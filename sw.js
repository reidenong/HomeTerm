function openHome() {
    chrome.tabs.create({ url: chrome.runtime.getURL("home.html") });
}

// toolbar click
if (chrome && chrome.action && chrome.action.onClicked) {
    chrome.action.onClicked.addListener(openHome);
}

// keyboard command (guard every access)
if (chrome && chrome.commands && chrome.commands.onCommand && chrome.commands.onCommand.addListener) {
    chrome.commands.onCommand.addListener(cmd => {
        if (cmd === "open-home") openHome();
    });
}
