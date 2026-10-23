const MUSIC_URL_PATTERN = 'https://music.youtube.com/*';
const RELAYED_ACTIONS = new Set(['createPlaylist', 'checkPlaylists']);

async function findMusicTab() {
  const tabs = await chrome.tabs.query({ url: MUSIC_URL_PATTERN });
  const tab = tabs.find(t => t.active) ?? tabs[0];
  if (!tab) {
    throw new Error('Open music.youtube.com in a tab and log in first.');
  }
  return tab;
}

// Tabs opened before the extension was installed/reloaded have no content script yet.
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
  } catch (error) {
    throw new Error(`Could not attach to the YouTube Music tab (${error.message}). Try reloading the tab.`);
  }
}

async function sendToTab(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch {
    await injectContentScript(tabId);
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      throw new Error(`Could not talk to the YouTube Music tab (${error.message}). Try reloading the tab.`);
    }
  }
}

async function relayToMusicTab(message) {
  const tab = await findMusicTab();
  const response = await sendToTab(tab.id, message);

  if (!response?.success) {
    throw new Error(response?.error || 'The YouTube Music tab returned no result.');
  }
  return response;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!RELAYED_ACTIONS.has(request.action)) return false;

  relayToMusicTab(request)
    .then(response => sendResponse(response))
    .catch(error => {
      console.error('[Export Liked Music] Background error', error);
      sendResponse({ success: false, error: error.message });
    });

  return true; // keep the channel open for the async response
});
