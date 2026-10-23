# Export Liked YouTube Music - Browser Extension

A browser extension to create a shareable playlist from your liked YouTube Music songs.

## Features

- 🎵 Creates a public playlist from your liked music with one click
- 📋 Automatically copies the playlist URL to clipboard
- 🔗 Opens the new playlist in a new tab

## Installation (Development)

### Chrome/Edge:

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select this `extension/` directory

### Firefox:

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file from this `extension/` directory

## Usage

1. Make sure you're logged into [music.youtube.com](https://music.youtube.com)
2. Click the extension icon
3. Click "Export Liked Music" button
4. The extension will:
   - Create a new public playlist called "Liked Music"
   - Copy the playlist URL to your clipboard
   - Redirect you to the new playlist

## How it works

1. Extension reads your YouTube Music authentication cookies
2. Makes an API call to YouTube Music to create a playlist from your liked music (source ID: `LM`)
3. Returns the shareable playlist URL

## Troubleshooting

**"Not authenticated" error:**
- Make sure you're logged into [music.youtube.com](https://music.youtube.com) first

**"Failed to extract playlist ID" error:**
- The YouTube Music API response format might have changed
- Check the console (right-click popup → Inspect) for the full response
- The `extractPlaylistId()` function in `background.js` might need adjustment

**CORS errors:**
- Extensions have broader permissions than regular scripts
- If you see CORS errors, make sure `host_permissions` in `manifest.json` includes the YouTube Music domain

## Files

- `manifest.json` - Extension configuration and permissions
- `popup.html` - UI for the popup
- `popup.js` - Handles button clicks and status messages
- `background.js` - Service worker that handles the API call

## Next Steps for Production

1. Test the API endpoint and response format by checking the browser console
2. Adjust `extractPlaylistId()` if needed based on actual response
3. Add error handling for edge cases
4. Create extension icons (128x128 PNG)
5. Publish to Chrome Web Store / Firefox Add-ons
