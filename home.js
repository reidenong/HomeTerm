// ===== Wallpaper loader (uses wallpapers/index.json if present) =====
// ===== Wallpaper loader (MV3-safe) =====
// Minimal MV3-safe wallpaper loader
(async function setWallpaper() {
    const abs = (p) => chrome.runtime.getURL(p);

    // 0) Inline JSON manifest works even on NTP
    let list = null;
    try {
        const el = document.getElementById('wallpapers-manifest');
        if (el && el.textContent.trim()) list = JSON.parse(el.textContent);
    } catch { }

    // 1) Fallback to fetching wallpapers/index.json
    if (!Array.isArray(list)) {
        try {
            const res = await fetch(abs('wallpapers/index.json'), { cache: 'no-store' });
            if (res.ok) list = await res.json();
        } catch { }
    }
    if (!Array.isArray(list) || list.length === 0) return;

    // Pick one at random
    const pick = list[Math.floor(Math.random() * list.length)];
    const url = abs(`wallpapers/${pick}`);

    // Verify once, then set as background
    const ok = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url; // no cache buster on extension URLs
    });
    if (ok) {
        document.body.style.backgroundImage = `url("${url}")`;
        document.body.classList.add('has-wallpaper');
    }
})();



// ===== Clock + greeting =====
const clockEl = document.getElementById('clock');
const greetEl = document.getElementById('greeting');
function tick() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}`;
    const d = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    greetEl.textContent = `Good ${now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'} • ${d}`;
}
tick(); setInterval(tick, 30_000);

// ===== Terminal focus + key handling (no inline handlers) =====
const term = document.getElementById('terminal');
const termContent = document.getElementById('terminal-content');

function getPrompt() {
    return document.getElementById('prompt-input') ||
        termContent.querySelector('input,[contenteditable="true"]');
}
function focusPromptHard() {
    const el = getPrompt();
    if (!el) return false;
    el.focus({ preventScroll: true });
    if ('selectionStart' in el) { const v = el.value; el.selectionStart = el.selectionEnd = v.length; }
    return true;
}
function showTerminal() {
    term.classList.remove('hidden'); term.classList.add('show');
    if (typeof window.focusPrompt === 'function') window.focusPrompt();
    let tries = 0; const t = setInterval(() => { if (focusPromptHard() || ++tries >= 10) clearInterval(t); }, 16);
}
function hideTerminal() { term.classList.remove('show'); term.classList.add('hidden'); }
function isPrintable(e) { return e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey; }

// click anywhere on the terminal to focus the prompt
term.addEventListener('click', () => focusPromptHard());

// Keep focus if prompt re-renders
new MutationObserver(() => { if (term.classList.contains('show')) focusPromptHard(); })
    .observe(termContent, { childList: true, subtree: true });

// Open terminal on key; forward first character; keep focus inside
window.addEventListener('keydown', (e) => {
    const visible = term.classList.contains('show');

    if (!visible) {
        if (isPrintable(e) || e.key === 'Backspace' || e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            const first = e.key;
            showTerminal();
            setTimeout(() => {
                const el = getPrompt(); if (!el) return;
                if (first === 'Tab') {
                    el.focus();
                    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
                } else if (isPrintable({ key: first, ctrlKey: false, metaKey: false, altKey: false })) {
                    const s = el.selectionStart ?? el.value.length;
                    const t = el.selectionEnd ?? el.value.length;
                    if (typeof el.setRangeText === 'function') el.setRangeText(first, s, t, 'end');
                    else el.value += first;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                } else if (first === 'Backspace') {
                    el.value = el.value.slice(0, -1);
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                }
                el.focus();
            }, 0);
        }
        return;
    }

    if (e.key === 'Escape') { e.preventDefault(); hideTerminal(); return; }
    if (!term.contains(document.activeElement)) focusPromptHard();
});

// Capture Tab to prevent browser focus traversal; let CLI handler run
window.addEventListener('keydown', (e) => {
    if (!term.classList.contains('show')) return;
    if (e.key === 'Tab') {
        e.preventDefault();
        const prompt = getPrompt();
        if (prompt && document.activeElement !== prompt) {
            prompt.focus({ preventScroll: true });
            if ('selectionStart' in prompt) {
                const v = prompt.value;
                prompt.selectionStart = prompt.selectionEnd = v.length;
            }
        }
    }
}, { capture: true });
