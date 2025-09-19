import json
from ytmusicapi import YTMusic

def create_sharable_playlist():
    """
    Create a sharable playlist for a user using a cookie stored in cookie.txt.
    """
    print("Reading cookie file...")

    with open("cookie.txt", "r", encoding="utf-8") as f:
        cookie = f.read().strip()

    headers_dict = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:72.0) Gecko/20100101 Firefox/72.0",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/json",
        "X-Goog-AuthUser": "0",
        "x-origin": "https://music.youtube.com",
        "Cookie": cookie
    }

    # Write headers.json for YTMusic
    with open("headers_auth.json", "w", encoding="utf-8") as f:
        json.dump(headers_dict, f)

    print("Creating playlist...")

    # Init YTMusic with cookie headers
    ytmusic = YTMusic("headers_auth.json")

    playlist_id = ytmusic.create_playlist(
        "Liked Music",
        "Music I like",
        privacy_status="PUBLIC",
        source_playlist="LM"  # special ID for "Liked Music"
    )

    url = f"https://music.youtube.com/playlist?list={playlist_id}"

    print("Playlist created!")
    print(f"URL: {url}")

if __name__ == "__main__":
    create_sharable_playlist()
