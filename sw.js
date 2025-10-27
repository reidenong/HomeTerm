// Open your page instead of Chrome's NTP by closing the new tab and creating ours.
const HOME_URL = chrome.runtime.getURL("home.html");

// Detect a Chrome New Tab Page (NTP)
function isNewTab(tab) {
    const u = tab.pendingUrl || tab.url || "";
    return u.startsWith("chrome://newtab") || u.startsWith("chrome://new-tab-page") || u === "";
}

chrome.tabs.onCreated.addListener((tab) => {
    if (!isNewTab(tab)) return;

    const id = tab.id;
    const { windowId, index } = tab;

    // Close the NTP, then create our page. Small delay avoids races.
    setTimeout(() => {
        chrome.tabs.remove(id, () => {
            // Recreate near the same position; keep it active.
            chrome.tabs.create({ url: HOME_URL, windowId, index, active: true });
        });
    }, 0);
});
