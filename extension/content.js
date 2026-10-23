// Content script runs on music.youtube.com and can access document.cookie
console.log('[Content Script] Loaded on', window.location.href);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Content Script] Received message:', request.action);

  if (request.action === 'createPlaylist') {
    createPlaylistFromPage()
      .then(result => {
        console.log('[Content Script] Playlist created:', result);
        sendResponse({ success: true, playlistUrl: result });
      })
      .catch(error => {
        console.error('[Content Script] Error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the channel open for async response
  }
});

const ORIGIN = 'https://music.youtube.com';
const API_KEY = 'AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30';

function getCookie(name) {
  const match = document.cookie.split('; ').find(c => c.startsWith(name + '='));
  return match ? match.slice(name.length + 1) : null;
}

async function sapisidHash() {
  const sapisid = getCookie('SAPISID') || getCookie('__Secure-3PAPISID');
  if (!sapisid) {
    throw new Error('Not logged in: SAPISID cookie not found. Log in to music.youtube.com.');
  }
  const ts = Math.floor(Date.now() / 1000);
  const data = new TextEncoder().encode(`${ts} ${sapisid} ${ORIGIN}`);
  const digest = await crypto.subtle.digest('SHA-1', data);
  const hex = Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `SAPISIDHASH ${ts}_${hex}`;
}

async function createPlaylistFromPage() {
  console.log('[Content Script] Creating playlist from page context...');

  // Mirrors ytmusicapi create_playlist(): POST playlist/create with sourcePlaylistId
  const url = `${ORIGIN}/youtubei/v1/playlist/create?alt=json&key=${API_KEY}`;
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;

  const payload = {
    title: 'Liked Music',
    description: 'Music I like',
    privacyStatus: 'PUBLIC',
    sourcePlaylistId: 'LM',
    context: {
      client: { clientName: 'WEB_REMIX', clientVersion: `1.${ymd}.01.00` },
      user: {}
    }
  };

  console.log('[Content Script] Sending request to:', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-AuthUser': '0',
      'X-Origin': ORIGIN,
      Authorization: await sapisidHash()
    },
    body: JSON.stringify(payload),
    credentials: 'include'
  });

  console.log('[Content Script] Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Content Script] Error response:', errorText);
    throw new Error(`API error: ${response.status} ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();
  console.log('[Content Script] Response data:', data);

  // Extract playlist ID
  const playlistId = data.playlistId || data.result?.playlistId;

  if (!playlistId) {
    console.error('[Content Script] Could not find playlist ID in response');
    throw new Error('Failed to extract playlist ID from response');
  }

  const playlistUrl = `https://music.youtube.com/playlist?list=${playlistId}`;
  return playlistUrl;
}
