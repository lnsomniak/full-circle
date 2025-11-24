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
    scope="user-read-recently-played" 
# i'd like to add thank you for whoever made the spotify scopes documentation, real life saver for how to do this. 
))

results = sp.current_user_recently_played(limit=10)
for item in results["items"]:
	track = item.get("track", {})
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
