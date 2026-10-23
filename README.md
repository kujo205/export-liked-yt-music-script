# Export Liked YouTube Music

A Chrome extension that turns your private **Liked Music** into a public, shareable playlist with one click.

Clicking the button:

1. creates a public playlist called "Liked Music" from your liked songs,
2. copies its URL to the clipboard,
3. opens the new playlist in a new tab.

## Install (development)

1. Clone this repo.
2. Open `chrome://extensions/` and enable **Developer mode**.
3. Click **Load unpacked** and select the `extension/` directory.

Works in Chromium-based browsers (Chrome, Edge, Brave).

## Usage

1. Open [music.youtube.com](https://music.youtube.com) and log in.
2. Click the extension icon, then **Export Liked Music**.

The YouTube Music tab must stay open: the extension talks to the API from inside that tab.

## How it works

The content script (`extension/content.js`) runs on `music.youtube.com` and calls the same internal API the site uses:

- `POST /youtubei/v1/playlist/create` with `sourcePlaylistId: "LM"` (the special ID of Liked Music).
- Auth is cookie-based: it reads the `SAPISID` cookie from the page and builds the
  `Authorization: SAPISIDHASH <ts>_<sha1("<ts> <SAPISID> <origin>")>` header. Nothing is stored or sent anywhere else.
- The `key` in the URL is YouTube Music's public InnerTube key, embedded in every page load. It is not a secret.

The request shape mirrors [`ytmusicapi`](https://github.com/sigma67/ytmusicapi)'s `create_playlist`.

## Files

- `extension/manifest.json` - Manifest V3 config and permissions
- `extension/popup.html`, `extension/popup.js` - popup UI, clipboard copy and redirect
- `extension/background.js` - service worker: finds the YouTube Music tab and relays the request
- `extension/content.js` - builds the auth header and calls the playlist API

## Troubleshooting

| Message | Fix |
| --- | --- |
| "Open music.youtube.com in a tab..." | Open YouTube Music in a tab and log in. |
| "You are not logged in..." | Sign in to music.youtube.com, reload the tab. |
| "...rejected the request (401/403)" | Reload the YouTube Music tab and try again. |
| "Could not attach to / talk to the tab" | Reload the YouTube Music tab. |

Debug logs: open DevTools on the music.youtube.com tab (content script) or the extension's service worker from `chrome://extensions`.

## Limitations

- Uses an unofficial internal API, so it may break if YouTube changes it.
- Uses the first logged-in Google account (`X-Goog-AuthUser: 0`).
