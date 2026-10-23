const REDIRECT_DELAY_MS = 500;

const exportBtn = document.getElementById('exportBtn');
const statusDiv = document.getElementById('status');

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

async function showSuccess(playlistUrl) {
  exportBtn.disabled = false;
  const copied = await copyToClipboard(playlistUrl);
  showStatus(
    copied
      ? '✓ Playlist created! Link copied. Redirecting...'
      : '✓ Playlist created! (Could not copy the link.) Redirecting...',
    'success'
  );
  openPlaylistAndClose(playlistUrl);
}

async function requestPlaylist() {
  const response = await chrome.runtime.sendMessage({ action: 'createPlaylist' });
  if (!response?.success) {
    throw new Error(response?.error || 'Failed to create playlist.');
  }
  return response.playlistUrl;
}

async function handleExportClick() {
  showLoading();
  try {
    await showSuccess(await requestPlaylist());
  } catch (error) {
    showError(error.message);
  }
}

exportBtn.addEventListener('click', handleExportClick);
