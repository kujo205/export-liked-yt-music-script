const REDIRECT_DELAY_MS = 500;
const COPIED_LABEL_MS = 1200;

const exportBtn = document.getElementById('exportBtn');
const statusDiv = document.getElementById('status');
const historySection = document.getElementById('history');
const historyList = document.getElementById('historyList');

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = type;
}

function showLoading() {
  exportBtn.disabled = true;
  showStatus('Creating playlist...', 'loading');
}

function showError(message) {
  exportBtn.disabled = false;
  showStatus(`✗ ${message}`, 'error');
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('[Export Liked Music] Clipboard error', error);
    return false;
  }
}

function openPlaylistAndClose(playlistUrl) {
  setTimeout(() => {
    chrome.tabs.create({ url: playlistUrl });
    window.close();
  }, REDIRECT_DELAY_MS);
}

async function recordExport(playlistUrl) {
  try {
    renderHistory(await addToHistory(playlistUrl));
  } catch (error) {
    console.error('[Export Liked Music] Could not save history', error);
  }
}

async function showSuccess(playlistUrl) {
  exportBtn.disabled = false;
  await recordExport(playlistUrl);
  const copied = await copyToClipboard(playlistUrl);
  showStatus(
    copied
      ? '✓ Playlist created! Link copied. Redirecting...'
      : '✓ Playlist created! (Could not copy the link.) Redirecting...',
    'success'
  );
  openPlaylistAndClose(playlistUrl);
}

async function sendToBackground(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.success) {
    throw new Error(response?.error || 'Request failed.');
  }
  return response;
}

async function requestPlaylist() {
  const { playlistUrl } = await sendToBackground({ action: 'createPlaylist' });
  return playlistUrl;
}

async function handleExportClick() {
  showLoading();
  try {
    await showSuccess(await requestPlaylist());
  } catch (error) {
    showError(error.message);
  }
}

// --- History list ---

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function createActionButton(label, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'small';
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

async function handleCopyClick(event, entry) {
  const button = event.currentTarget;
  const copied = await copyToClipboard(entry.url);
  button.textContent = copied ? 'Copied!' : 'Failed';
  setTimeout(() => (button.textContent = 'Copy'), COPIED_LABEL_MS);
}

function createHistoryItem(entry) {
  const item = document.createElement('li');

  const info = document.createElement('div');
  info.className = 'info';
  const title = document.createElement('span');
  title.className = 'title';
  title.textContent = entry.title;
  const date = document.createElement('span');
  date.className = 'date';
  date.textContent = formatDate(entry.createdAt);
  info.append(title, date);

  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.append(
    createActionButton('Open', () => chrome.tabs.create({ url: entry.url })),
    createActionButton('Copy', event => handleCopyClick(event, entry))
  );

  item.append(info, actions);
  return item;
}

function renderHistory(entries) {
  historyList.replaceChildren(...entries.map(createHistoryItem));
  historySection.hidden = entries.length === 0;
}

// Drops entries whose playlist was deleted. Needs an open YouTube Music tab; without one the list is left as is.
async function pruneDeletedPlaylists(entries) {
  if (entries.length === 0) return;

  const playlistIds = entries.map(e => e.id);
  try {
    const { existingIds } = await sendToBackground({ action: 'checkPlaylists', playlistIds });
    const deletedIds = playlistIds.filter(id => !existingIds.includes(id));
    if (deletedIds.length > 0) {
      renderHistory(await removeFromHistory(deletedIds));
    }
  } catch (error) {
    console.warn('[Export Liked Music] Skipped deleted-playlist check:', error.message);
  }
}

async function initHistory() {
  try {
    const entries = await loadHistory();
    renderHistory(entries);
    await pruneDeletedPlaylists(entries);
  } catch (error) {
    console.error('[Export Liked Music] Could not load history', error);
  }
}

exportBtn.addEventListener('click', handleExportClick);
initHistory();
