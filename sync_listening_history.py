from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv
import spotipy
import sqlite3
import os
from datetime import datetime

load_dotenv()

# basic info/credentials

client_id = os.getenv("SPOTIFY_CLIENT_ID")
client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")

sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
    client_id=client_id,
    client_secret=client_secret,
    redirect_uri="http://127.0.0.1:8888/callback",
    scope="user-read-recently-played",
    open_browser=False
))
# connect to database
conn = sqlite3.connect("listening_history.db")
cursor = conn.cursor()

# gets last sync timestamp
cursor.execute("SELECT value FROM sync_metadata WHERE key = 'last_sync_timestamp'")
result = cursor.fetchone()

if result:
    last_sync = result[0]
# if, convert ISO string to Unix timestamp (milliseconds)
    last_sync_ms = int(datetime.fromisoformat(last_sync.replace('Z', '+00:00')).timestamp() * 1000)
    print(f"Last sync: {last_sync}")
# get plays AFTER last sync
    results = sp.current_user_recently_played(limit=50, after=last_sync_ms)
else:
    print("First sync - getting last 50 plays")
# first run - get last 50 plays
    results = sp.current_user_recently_played(limit=50)

# process those 50 and insert plays
new_plays = 0
duplicates = 0

for item in results["items"]:
    track = item.get("track", {})
    played_at = item.get("played_at")
    track_id = track.get("id")
    track_name = track.get("name", "Unknown Track")
    artists = track.get("artists", [])
    artist_names = ", ".join([artist.get("name", "Unknown") for artist in artists])

    try:
        cursor.execute(
            "INSERT INTO plays (played_at, track_id, track_name, artist_names) VALUES (?, ?, ?, ?)",
            (played_at, track_id, track_name, artist_names)
        )
        new_plays += 1
    except sqlite3.IntegrityError:
# if duplicate, skip
        duplicates += 1
    
# update last sync timestamp (most recent play)
if results["items"]:
    latest_play = results["items"][0]["played_at"]
    cursor.execute(
        "INSERT OR REPLACE INTO sync_metadata (key, value) VALUES ('last_sync_timestamp', ?)",
        (latest_play,)
)

conn.commit()
conn.close()

print(f"sync complete:")
print(f"  - {new_plays} new plays added")
print(f"  - {duplicates} duplicates skipped")
