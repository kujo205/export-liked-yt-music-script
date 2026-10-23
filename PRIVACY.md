# Privacy Policy

**Liked Music Exporter** (the "extension")
Effective date: 2026-10-24

## Summary

The extension does not collect, sell, or share any personal data. It has no servers, no analytics, and no ads. Everything happens on your device and between your browser and music.youtube.com.

## What the extension accesses

- **Your YouTube Music login session.** When you click "Create playlist", the extension reads your Google session cookie (`SAPISID`) on music.youtube.com and uses it only to sign a request to YouTube Music, the same way the YouTube Music website does. The cookie is never stored by the extension and never sent anywhere other than music.youtube.com.
- **Your Liked Music.** The extension asks YouTube Music to create a public playlist from your Liked Music. The song data stays between your browser and YouTube Music. The extension does not read or keep your song list.
- **Recent exports list.** The extension saves the ID, link, and creation time of playlists it created, in your browser's local extension storage (`chrome.storage.local`). This data stays on your device and is never transmitted. To check whether a saved playlist still exists, the extension asks music.youtube.com about it.

## What the extension does not do

- It does not send data to the developer or any third party.
- It does not use analytics, tracking, advertising, or remote code.
- It does not sell data or use it for any purpose other than creating and listing your exported playlists.

## Permissions

- `https://music.youtube.com/*`: to call YouTube Music's playlist API from the YouTube Music page using your existing login.
- `scripting`: to attach the extension's script to a YouTube Music tab that was already open.
- `storage`: to keep your recent exports list on your device.

## Your control

You can delete the saved exports list at any time by removing the extension, which deletes its local storage. Playlists created on YouTube Music are managed in your YouTube Music account, not by the extension.

## Changes

If this policy changes, the updated version will be published in this file with a new effective date.

## Contact

Open an issue at https://github.com/kujo205/export-liked-yt-music-script/issues.

This extension is not affiliated with, endorsed by, or sponsored by YouTube or Google. YouTube and YouTube Music are trademarks of Google LLC.
