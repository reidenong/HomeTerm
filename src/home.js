/* =============================================================================
 * Editing Controls
 * ---------------------------------------------------------------------------
 * Disable spellcheck/autocorrect globally, including dynamically added inputs.
 * No functional changes. Formatting and comments only.
 * ========================================================================== */

/** Disable editing helpers on inputs/textareas/contenteditable elements. */
function neuterEditing(root = document) {
    const els = root.querySelectorAll("input, textarea, [contenteditable]");
    els.forEach((el) => {
        el.spellcheck = false;
        el.autocomplete = "off";
        el.autocapitalize = "off";
        el.setAttribute("autocorrect", "off");
        el.setAttribute("data-gramm", "false");            // Grammarly off
        el.setAttribute("data-enable-grammarly", "false"); // Grammarly off
    });
}

// Site-wide flags (cover static markup)
document.documentElement.setAttribute("spellcheck", "false");
document.body.setAttribute("spellcheck", "false");
neuterEditing();

// Keep it off for elements created later (terminal prompts, etc.)
new MutationObserver((mutations) => {
    for (const r of mutations) {
        for (const n of r.addedNodes) {
            if (n.nodeType !== 1) continue; // element nodes only
            if (n.matches?.("input, textarea, [contenteditable]")) neuterEditing(n);
            else neuterEditing(n); // scan subtree
        }
    }
}).observe(document.documentElement, { childList: true, subtree: true });

/* =============================================================================
 * Wallpaper Loader (MV3-safe)
 * ---------------------------------------------------------------------------
 * Picks a random wallpaper from inline JSON or wallpapers/index.json and sets
 * as body background. Works in Manifest V3 contexts.
 * ========================================================================== */

(async function setWallpaper() {
    const abs = (p) => chrome.runtime.getURL(p);

    // 0) Inline JSON manifest (works even on NTP)
    let list = null;
    try {
        const el = document.getElementById("wallpapers-manifest");
        if (el && el.textContent.trim()) list = JSON.parse(el.textContent);
    } catch { } // ignore parse errors

    // 1) Fallback: fetch wallpapers/index.json
    if (!Array.isArray(list)) {
        try {
            const res = await fetch(abs("wallpapers/index.json"), { cache: "no-store" });
            if (res.ok) list = await res.json();
        } catch { } // ignore fetch errors
    }

    if (!Array.isArray(list) || list.length === 0) return;

    // Random pick
    const pick = list[Math.floor(Math.random() * list.length)];
    const url = abs(`wallpapers/${pick}`);

    // Verify image loads, then apply
    const ok = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url; // no cache buster for extension URLs
    });

    if (ok) {
        document.body.style.backgroundImage = `url("${url}")`;
        document.body.classList.add("has-wallpaper");
    }
})();

/* =============================================================================
 * Clock + Greeting
 * ---------------------------------------------------------------------------
 * Updates HH:MM and contextual greeting with locale date.
 * ========================================================================== */

const clockEl = document.getElementById("clock");
const greetEl = document.getElementById("greeting");

function tick() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    clockEl.textContent = `${hh}:${mm}`;

    const d = now.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    const hour = now.getHours();
    const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    greetEl.textContent = `Good ${period} • ${d}`;
}

tick();
setInterval(tick, 30_000);

/* =============================================================================
 * Terminal Focus + Key Handling
 * ---------------------------------------------------------------------------
 * No inline handlers. Click-to-focus, preserve focus on re-render, open on key,
 * and capture Tab for CLI completion.
 * ========================================================================== */

const term = document.getElementById("terminal");
const termContent = document.getElementById("terminal-content");

/** Return the current prompt input element. */
function getPrompt() {
    return (
        document.getElementById("prompt-input") ||
        termContent.querySelector('input,[contenteditable="true"]')
    );
}

/** Focus prompt and move caret to end. */
function focusPromptHard() {
    const el = getPrompt();
    if (!el) return false;
    el.focus({ preventScroll: true });
    if ("selectionStart" in el) {
        const v = el.value;
        el.selectionStart = el.selectionEnd = v.length;
    }
    return true;
}

/** Show terminal UI and ensure prompt receives focus soon after. */
function showTerminal() {
    term.classList.remove("hidden");
    term.classList.add("show");

    if (typeof window.focusPrompt === "function") window.focusPrompt();

    let tries = 0;
    const t = setInterval(() => {
        if (focusPromptHard() || ++tries >= 10) clearInterval(t);
    }, 16);
}

/** Hide terminal UI. */
function hideTerminal() {
    term.classList.remove("show");
    term.classList.add("hidden");
}

/** True for printable keys without modifiers. */
function isPrintable(e) {
    return e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
}

// Click anywhere on the terminal to focus the prompt
term.addEventListener("click", () => focusPromptHard());

// Keep focus if prompt re-renders
new MutationObserver(() => {
    if (term.classList.contains("show")) focusPromptHard();
}).observe(termContent, { childList: true, subtree: true });

/* -----------------------------------------------------------------------------
 * Open terminal on first key; forward first character; keep focus inside.
 * - Esc hides terminal.
 * - Ensures prompt remains the active element.
 * -------------------------------------------------------------------------- */
window.addEventListener("keydown", (e) => {
    const visible = term.classList.contains("show");

    // If hidden, open on first keypress and forward it to the prompt
    if (!visible) {
        if (
            isPrintable(e) ||
            e.key === "Backspace" ||
            e.key === "Enter" ||
            e.key === "Tab"
        ) {
            e.preventDefault();
            const first = e.key;
            showTerminal();

            setTimeout(() => {
                const el = getPrompt();
                if (!el) return;

                if (first === "Tab") {
                    el.focus();
                    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
                } else if (isPrintable({ key: first, ctrlKey: false, metaKey: false, altKey: false })) {
                    const s = el.selectionStart ?? el.value.length;
                    const t = el.selectionEnd ?? el.value.length;
                    if (typeof el.setRangeText === "function") el.setRangeText(first, s, t, "end");
                    else el.value += first;
                    el.dispatchEvent(new Event("input", { bubbles: true }));
                } else if (first === "Backspace") {
                    el.value = el.value.slice(0, -1);
                    el.dispatchEvent(new Event("input", { bubbles: true }));
                }

                el.focus();
            }, 0);
        }
        return;
    }

    // Visible: Escape hides, otherwise keep focus in prompt
    if (e.key === "Escape") {
        e.preventDefault();
        hideTerminal();
        return;
    }
    if (!term.contains(document.activeElement)) focusPromptHard();
});

/* -----------------------------------------------------------------------------
 * Capture Tab to prevent browser focus traversal; let CLI handler run.
 * Uses capture=true to intercept early.
 * -------------------------------------------------------------------------- */
window.addEventListener(
    "keydown",
    (e) => {
        if (!term.classList.contains("show")) return;
        if (e.key === "Tab") {
            e.preventDefault();
            const prompt = getPrompt();
            if (prompt && document.activeElement !== prompt) {
                prompt.focus({ preventScroll: true });
                if ("selectionStart" in prompt) {
                    const v = prompt.value;
                    prompt.selectionStart = prompt.selectionEnd = v.length;
                }
            }
        }
    },
    { capture: true },
);
