# Export Liked YouTube Music Playlist

This script creates a public, sharable playlist in your YouTube Music account by cloning your "Liked Music" playlist. It uses `ytmusicapi` with your browser cookies for authentication.

---

## Prerequisites

- Docker and Docker Compose installed
- A modern browser (Firefox recommended)
- A logged-in YouTube Music account

---

## Running the Script

1. Clone the repository and navigate into it:

```bash
git clone <repo-url>
cd <repo-folder>
```

2. Find a cookie and paste it in cookie.txt file (Described how to do this below)

3. In order to run the script, run this command

```bash
docker compose run --build --rm script

```

---

## Steps to Get Your Cookie

1. Open a new browser tab.
2. Open Developer Tools: `Ctrl + Shift + I` (Windows/Linux) or `Cmd + Option + I` (Mac).
3. Go to the **Network** tab.
4. Navigate to [YouTube Music](https://music.youtube.com) and make sure you are logged in.
5. Perform an action such as searching for a song or clicking on your library.
6. Look for an authenticated **POST request** to `/browse` or similar:
   - Status: `200`
   - Method: `POST`
   - Domain: `music.youtube.com`
7. Hit Headers Tab, Scroll to Request Headers And find Cookie header
8. Open a file named `cookie.txt` in the project root and **paste only the cookie value** (not the full headers).

> Example `cookie.txt` content:
>
> ````
> LOGIN_INFO=AFmmF2swRQIhANRgw7DvolknN5SAPISID=xxxx... > ```
> ````
