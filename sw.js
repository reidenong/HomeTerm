// sw.js — safe NTP replacement without closing new windows

const HOME_URL = chrome.runtime.getURL("home.html");
const NTP_PREFIXES = ["chrome://newtab", "chrome://new-tab-page"];

const isNtpUrl = (u) => !!u && NTP_PREFIXES.some((p) => u.startsWith(p));
const isOurUrl = (u) => !!u && u === HOME_URL;

// Debounce to avoid double handling of the same tab
const handled = new Set();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

function replaceTabSafe(tab) {
    const url = tab.pendingUrl || tab.url || "";
    if (!isNtpUrl(url)) return;                 // ignore about:blank and normal links
    if (handled.has(tab.id)) return;
    handled.add(tab.id);

    const { id, windowId, index } = tab;

    // Create our tab first to avoid closing the whole window when it has a single tab.
    chrome.tabs.create({ url: HOME_URL, windowId, index, active: true }, () => {
        // Remove the original NTP shortly after creation to prevent flicker.
        setTimeout(() => chrome.tabs.remove(id), 0);
    });
}

// New tab created (Ctrl+T, plus some cases where Chrome spawns an NTP)
chrome.tabs.onCreated.addListener((tab) => {
    replaceTabSafe(tab);
});

// Tab navigates to an NTP after creation; replace it too.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!changeInfo.url) return;
    if (isOurUrl(changeInfo.url)) return;       // avoid loops
    if (!isNtpUrl(changeInfo.url)) return;
    replaceTabSafe(tab);
});
