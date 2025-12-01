from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv	
from datetime import datetime
import spotipy
import json
import os
load_dotenv()
client_id = os.getenv("SPOTIFY_CLIENT_ID")
client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")

sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
    client_id=client_id,
    client_secret=client_secret,
    redirect_uri="http://127.0.0.1:8888/callback",
    scope="user-read-recently-played",
    open_browser=False
))
# i'd like to add thank you for whoever made the spotify scopes documentation, real life saver for how to do this.
results = sp.current_user_recently_played(limit=10)

track_ids = []

for item in results["items"]:
	track = item.get("track", {})
	track_id = track.get("id")
	if track_id:
		track_ids.append(track_id)
# used .get funcvtion here bc if there is no track left It dies, or at least I think it does idk I don't want to risk it.
	track_name = track.get("name", "Unknown Track")

	artists = track.get("artists", [])
	artist_names = [artist.get("name", "Unknown Artist") for artist in artists]
	artist_str = ", ".join(artist_names)
# thank you datetime documentation for this i couldn't have done it without you iloveyou
	played_at = item.get("played_at", "")
	if played_at:
		dt = datetime.fromisoformat(played_at.replace("Z", "+00:00"))
		played_at_readable = dt.strftime("%Y-%m-%d %I:%M %p")
	else:
		played_at_readable = "Unknown time"
		print(f"{played_at_readable} - {artist_str} - {track_name}")

print(f"\nCollected {len(track_ids)} track IDs")
print(f"Track IDs: {track_ids}")
print(f"Number of unique IDs: {len(set(track_ids))}")

# get audio features for all tracks and then print them beautifully thank you spotipy documentation and ctrl + f
track_info = sp.track(track_ids[0])
print(f"\nGot track: {track_info['name']}")

try:
    audio_features = sp.audio_features(track_ids[0])
    print("Audio analysis worked!")
except Exception as e:
    print(f"\nAudio analysis failed: {e}")

# Check token regardless
print(f"\nToken info: {sp.auth_manager.get_access_token()}")
