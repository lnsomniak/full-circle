from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv
import spotipy
import os
load_dotenv()
client_id = os.getenv("SPOTIFY_CLIENT_ID")
client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")

sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
    client_id=client_id,
    client_secret=client_secret,
    redirect_uri="http://127.0.0.1:8888/callback",
    scope="user-library-read"
))

user = sp.current_user()
print(f"Logged in as: {user['display_name']}")


