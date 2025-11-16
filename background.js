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
    try {
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error('Screenshot capture error:', chrome.runtime.lastError);
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse({ dataUrl: dataUrl });
      });
    } catch (error) {
      console.error('Screenshot capture error:', error);
      sendResponse({ error: error.message });
    }
    return true; // Keep the message channel open for async response
  }

  // Handle tab management
  if (message.type === 'openTab') {
    try {
      if (!message.url) {
        sendResponse({ success: false, error: 'URL is required' });
        return true;
      }
      chrome.tabs.create({ url: message.url, active: message.active !== false }, (tab) => {
        if (chrome.runtime.lastError) {
          console.error('Open tab error:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse({ success: true, tabId: tab.id });
      });
    } catch (error) {
      console.error('Open tab error:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }

  if (message.type === 'closeTab') {
    try {
      if (!message.tabId) {
        sendResponse({ success: false, error: 'Tab ID is required' });
        return true;
      }
      chrome.tabs.remove(message.tabId, () => {
        if (chrome.runtime.lastError) {
          console.error('Close tab error:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse({ success: true });
      });
    } catch (error) {
      console.error('Close tab error:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }

  if (message.type === 'switchTab') {
    try {
      if (!message.tabId) {
        sendResponse({ success: false, error: 'Tab ID is required' });
        return true;
      }
      chrome.tabs.update(message.tabId, { active: true }, () => {
        if (chrome.runtime.lastError) {
          console.error('Switch tab error:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse({ success: true });
      });
    } catch (error) {
      console.error('Switch tab error:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }

  if (message.type === 'getAllTabs') {
    try {
      chrome.tabs.query({}, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error('Query tabs error:', chrome.runtime.lastError);
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse({ tabs: tabs });
      });
    } catch (error) {
      console.error('Query tabs error:', error);
      sendResponse({ error: error.message });
    }
    return true;
  }

  // Handle storage state save/load
  if (message.type === 'saveStorageState') {
    try {
      if (!message.data) {
        sendResponse({ success: false, error: 'Storage data is required' });
        return true;
      }
      chrome.storage.local.set({ storageState: message.data }, () => {
        if (chrome.runtime.lastError) {
          console.error('Save storage error:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse({ success: true });
      });
    } catch (error) {
      console.error('Save storage error:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }

  if (message.type === 'loadStorageState') {
    try {
      chrome.storage.local.get('storageState', (result) => {
        if (chrome.runtime.lastError) {
          console.error('Load storage error:', chrome.runtime.lastError);
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse({ data: result.storageState || null });
      });
    } catch (error) {
      console.error('Load storage error:', error);
      sendResponse({ error: error.message });
    }
    return true;
  }

  // Handle trace log save
  if (message.type === 'saveTraceLog') {
    try {
      if (!message.data) {
        sendResponse({ success: false, error: 'Trace data is required' });
        return true;
      }

      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = `trace-${timestamp}.json`;

      const blob = new Blob([JSON.stringify(message.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Download error:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse({ success: true, downloadId: downloadId });
      });
    } catch (error) {
      console.error('Save trace log error:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }

  return false;
});
