const HISTORY_KEY = 'exportHistory';
const MAX_HISTORY_ENTRIES = 20;

async function loadHistory() {
  const stored = await chrome.storage.local.get(HISTORY_KEY);
  return stored[HISTORY_KEY] ?? [];
}

function saveHistory(entries) {
  return chrome.storage.local.set({ [HISTORY_KEY]: entries });
}

function playlistIdFromUrl(playlistUrl) {
  return new URL(playlistUrl).searchParams.get('list');
}

// Newest first; re-exporting the same playlist ID moves it to the top instead of duplicating.
async function addToHistory(playlistUrl) {
  const id = playlistIdFromUrl(playlistUrl);
  const entry = { id, url: playlistUrl, title: 'Liked Music', createdAt: Date.now() };
  const others = (await loadHistory()).filter(e => e.id !== id);
  const entries = [entry, ...others].slice(0, MAX_HISTORY_ENTRIES);
  await saveHistory(entries);
  return entries;
}

async function removeFromHistory(ids) {
  const remove = new Set(ids);
  const entries = (await loadHistory()).filter(e => !remove.has(e.id));
  await saveHistory(entries);
  return entries;
}
