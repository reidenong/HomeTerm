const HOME_URL = chrome.runtime.getURL("home.html");
const NTP_PREFIXES = ["chrome://newtab", "chrome://new-tab-page"];

function isNtpUrl(u) {
    return !!u && NTP_PREFIXES.some(p => u.startsWith(p));
}

// Replace *only* genuine NTPs created by Ctrl+T or similar.
chrome.tabs.onCreated.addListener((tab) => {
    const u = tab.pendingUrl || tab.url || "";
    if (!isNtpUrl(u)) return;                 // ignore about:blank and external links
    const { id, windowId, index } = tab;
    setTimeout(() => {
        chrome.tabs.remove(id, () => {
            chrome.tabs.create({ url: HOME_URL, windowId, index, active: true });
        });
    }, 0);
});

// Also catch cases where URL changes to NTP after creation.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!changeInfo.url) return;
    if (!isNtpUrl(changeInfo.url)) return;
    const { windowId, index } = tab;
    chrome.tabs.remove(tabId, () => {
        chrome.tabs.create({ url: HOME_URL, windowId, index, active: true });
    });
});
