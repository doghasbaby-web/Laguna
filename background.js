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
});

// Optional: Add any background tasks here
// For example, storing action history, analytics, etc.
