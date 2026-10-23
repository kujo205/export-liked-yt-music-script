chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'createPlaylist') {
    createPlaylist()
      .then(playlistUrl => {
        sendResponse({ success: true, playlistUrl });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

async function createPlaylist() {
  console.log('Background: Getting music.youtube.com tab...');

  // Get active tab with music.youtube.com
  const tabs = await chrome.tabs.query({ url: 'https://music.youtube.com/*' });

  if (!tabs || tabs.length === 0) {
    throw new Error('Please open music.youtube.com in a tab first.');
  }

  const tab = tabs[0];
  console.log('Background: Found tab:', tab.id);

  // Ask content script to create the playlist
  console.log('Background: Sending createPlaylist message to content script...');

  let response;
  try {
    try {
      response = await chrome.tabs.sendMessage(tab.id, { action: 'createPlaylist' });
    } catch (error) {
      console.log('Background: Content script missing, injecting...', error.message);
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      response = await chrome.tabs.sendMessage(tab.id, { action: 'createPlaylist' });
    }
    console.log('Background: Response from content script:', response);
  } catch (error) {
    console.error('Background: Error:', error);
    throw new Error(`Failed to communicate with content script: ${error.message}`);
  }

  if (!response.success) {
    throw new Error(response.error || 'Content script failed');
  }

  return response.playlistUrl;
}
