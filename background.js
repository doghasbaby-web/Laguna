// Background service worker for Action Recorder & Player

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Action Recorder & Player installed successfully!');
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Forward playback status messages
  if (message.type === 'playbackStatus') {
    // Message will be received by popup
    return true;
  }

  // Handle screenshot capture
  if (message.type === 'captureScreenshot') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      sendResponse({ dataUrl: dataUrl });
    });
    return true; // Keep the message channel open for async response
  }

  // Handle tab management
  if (message.type === 'openTab') {
    chrome.tabs.create({ url: message.url, active: message.active !== false }, (tab) => {
      sendResponse({ success: true, tabId: tab.id });
    });
    return true;
  }

  if (message.type === 'closeTab') {
    chrome.tabs.remove(message.tabId, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'switchTab') {
    chrome.tabs.update(message.tabId, { active: true }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'getAllTabs') {
    chrome.tabs.query({}, (tabs) => {
      sendResponse({ tabs: tabs });
    });
    return true;
  }

  // Handle storage state save/load
  if (message.type === 'saveStorageState') {
    chrome.storage.local.set({ storageState: message.data }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'loadStorageState') {
    chrome.storage.local.get('storageState', (result) => {
      sendResponse({ data: result.storageState || null });
    });
    return true;
  }

  // Handle trace log save
  if (message.type === 'saveTraceLog') {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `trace-${timestamp}.json`;

    const blob = new Blob([JSON.stringify(message.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    }, (downloadId) => {
      sendResponse({ success: true, downloadId: downloadId });
    });
    return true;
  }

  return false;
});
