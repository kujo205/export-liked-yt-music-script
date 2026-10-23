// Runs on music.youtube.com. Wrapped in an IIFE so re-injection (see background.js)
// neither redeclares constants nor registers the listener twice.
(() => {
  if (window.__exportLikedMusicLoaded) return;
  window.__exportLikedMusicLoaded = true;

  const ORIGIN = 'https://music.youtube.com';
  // Public InnerTube key embedded in every music.youtube.com page (ytcfg.INNERTUBE_API_KEY).
  const API_KEY = 'AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30';
  const LIKED_MUSIC_PLAYLIST_ID = 'LM';
  const ERROR_BODY_PREVIEW_LENGTH = 300;

  // Errors whose message is safe to show to the user as-is.
  class ExportError extends Error {}

  function readCookie(name) {
    const entry = document.cookie.split('; ').find(c => c.startsWith(`${name}=`));
    return entry ? entry.slice(name.length + 1) : null;
  }

  function getSapisid() {
    const sapisid = readCookie('SAPISID') || readCookie('__Secure-3PAPISID');
    if (!sapisid) {
      throw new ExportError('You are not logged in. Sign in to music.youtube.com and try again.');
    }
    return sapisid;
  }

  async function sha1Hex(text) {
    const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  // Google's cookie-based auth scheme: SAPISIDHASH <ts>_<sha1("<ts> <SAPISID> <origin>")>
  async function buildAuthorizationHeader() {
    const timestamp = Math.floor(Date.now() / 1000);
    const hash = await sha1Hex(`${timestamp} ${getSapisid()} ${ORIGIN}`);
    return `SAPISIDHASH ${timestamp}_${hash}`;
  }

  function buildClientVersion() {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    return `1.${yyyy}${mm}${dd}.01.00`;
  }

  function withContext(body) {
    return {
      ...body,
      context: {
        client: { clientName: 'WEB_REMIX', clientVersion: buildClientVersion() },
        user: {}
      }
    };
  }

  // POSTs to a youtubei/v1 endpoint and returns the raw Response (not yet checked).
  async function postInnerTube(endpoint, body) {
    const url = `${ORIGIN}/youtubei/v1/${endpoint}?alt=json&key=${API_KEY}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-AuthUser': '0',
      'X-Origin': ORIGIN,
      Authorization: await buildAuthorizationHeader()
    };

    try {
      return await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(withContext(body)),
        credentials: 'include'
      });
    } catch (error) {
      throw new ExportError(`Network error while contacting YouTube Music: ${error.message}`);
    }
  }

  async function assertResponseOk(response) {
    if (response.ok) return;

    const body = (await response.text().catch(() => '')).slice(0, ERROR_BODY_PREVIEW_LENGTH);
    console.error('[Export Liked Music] API error', response.status, body);

    if (response.status === 401 || response.status === 403) {
      throw new ExportError(
        `YouTube Music rejected the request (${response.status}). Reload the tab and make sure you are logged in.`
      );
    }
    throw new ExportError(`YouTube Music API error ${response.status}: ${body}`);
  }

  async function parseJson(response) {
    try {
      return await response.json();
    } catch {
      throw new ExportError('YouTube Music returned a response that is not valid JSON.');
    }
  }

  function extractPlaylistId(data) {
    if (!data.playlistId) {
      console.error('[Export Liked Music] No playlistId in response', data);
      const apiMessage = data.error?.message;
      throw new ExportError(
        apiMessage
          ? `YouTube Music did not create the playlist: ${apiMessage}`
          : 'YouTube Music did not return a playlist ID.'
      );
    }
    return data.playlistId;
  }

  async function createPlaylistFromLikedMusic() {
    const response = await postInnerTube('playlist/create', {
      title: 'Liked Music',
      description: 'Music I like',
      privacyStatus: 'PUBLIC',
      sourcePlaylistId: LIKED_MUSIC_PLAYLIST_ID
    });
    await assertResponseOk(response);
    const playlistId = extractPlaylistId(await parseJson(response));
    return { playlistUrl: `${ORIGIN}/playlist?list=${playlistId}` };
  }

  // The browse endpoint answers HTTP 200 even for missing playlists; a real playlist always has a
  // top-level `contents`, a missing one only has response metadata. Any failure is 'unknown' so
  // history is never pruned by mistake.
  async function getPlaylistStatus(playlistId) {
    try {
      const response = await postInnerTube('browse', { browseId: `VL${playlistId}` });
      if (response.status === 404) return 'deleted';
      if (!response.ok) return 'unknown';
      const data = await response.json();
      return data.contents ? 'exists' : 'deleted';
    } catch {
      return 'unknown';
    }
  }

  async function findExistingPlaylistIds(playlistIds) {
    const statuses = await Promise.all(playlistIds.map(getPlaylistStatus));
    return { existingIds: playlistIds.filter((id, i) => statuses[i] !== 'deleted') };
  }

  const HANDLERS = {
    createPlaylist: () => createPlaylistFromLikedMusic(),
    checkPlaylists: request => findExistingPlaylistIds(request.playlistIds)
  };

  function toUserMessage(error) {
    if (error instanceof ExportError) return error.message;
    console.error('[Export Liked Music] Unexpected error', error);
    return `Unexpected error: ${error.message}`;
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const handler = HANDLERS[request.action];
    if (!handler) return false;

    handler(request)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: toUserMessage(error) }));

    return true; // keep the channel open for the async response
  });
})();
