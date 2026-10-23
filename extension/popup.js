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

function showSuccess(playlistUrl) {
  exportBtn.disabled = false;
  showStatus('✓ Playlist created! Redirecting...', 'success');

  // Copy to clipboard
  navigator.clipboard.writeText(playlistUrl).catch(err => {
    console.error('Failed to copy:', err);
  });

  // Redirect to playlist after short delay
  setTimeout(() => {
    chrome.tabs.create({ url: playlistUrl });
    window.close();
  }, 500);
}

function showError(message) {
  exportBtn.disabled = false;
  showStatus(`✗ ${message}`, 'error');
}

exportBtn.addEventListener('click', async () => {
  showLoading();

  try {
    // Send message to background service worker
    const response = await chrome.runtime.sendMessage({
      action: 'createPlaylist'
    });

    if (response.success) {
      showSuccess(response.playlistUrl);
    } else {
      showError(response.error || 'Failed to create playlist');
    }
  } catch (error) {
    showError(error.message);
  }
});
