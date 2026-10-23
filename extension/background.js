const MUSIC_URL_PATTERN = 'https://music.youtube.com/*';

async function findMusicTab() {
  const tabs = await chrome.tabs.query({ url: MUSIC_URL_PATTERN });
  const tab = tabs.find(t => t.active) ?? tabs[0];
  if (!tab) {
    throw new Error('Open music.youtube.com in a tab and log in first.');
  }
  return tab;
}

function askContentScript(tabId) {
  return chrome.tabs.sendMessage(tabId, { action: 'createPlaylist' });
}

// Tabs opened before the extension was installed/reloaded have no content script yet.
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
  } catch (error) {
    throw new Error(`Could not attach to the YouTube Music tab (${error.message}). Try reloading the tab.`);
  }
}

async function requestPlaylistFromTab(tabId) {
  try {
    return await askContentScript(tabId);
  } catch {
    await injectContentScript(tabId);
    try {
      return await askContentScript(tabId);
    } catch (error) {
      throw new Error(`Could not talk to the YouTube Music tab (${error.message}). Try reloading the tab.`);
    }
  }
}

async function createPlaylist() {
  const tab = await findMusicTab();
  const response = await requestPlaylistFromTab(tab.id);

  if (!response?.success) {
    throw new Error(response?.error || 'The YouTube Music tab returned no result.');
  }
  return response.playlistUrl;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== 'createPlaylist') return false;

  createPlaylist()
    .then(playlistUrl => sendResponse({ success: true, playlistUrl }))
    .catch(error => {
      console.error('[Export Liked Music] Background error', error);
      sendResponse({ success: false, error: error.message });
    });

  return true; // keep the channel open for the async response
});
