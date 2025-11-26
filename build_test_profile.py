from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv
import spotipy
import pylast
import json
import os
import math
import datetime
load_dotenv()

client_id = os.getenv("SPOTIFY_CLIENT_ID")
client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")


lastfm_api_key = os.getenv("LASTFM_API_KEY")
lastfm_api_secret = os.getenv("LASTFM_API_SECRET")
# copy and paste from get_listening_history since it's just creating the spotify client
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
    client_id=client_id,
    client_secret=client_secret,
    redirect_uri="http://127.0.0.1:8888/callback",
    scope="user-read-recently-played",
    open_browser=False
))
# connecting now to last.fm since i'll be getting information from here as well 
network = pylast.LastFMNetwork(
    api_key=lastfm_api_key,
    api_secret=lastfm_api_secret
)

unique_artists = set()

results = sp.current_user_recently_played(limit=50)

for item in results["items"]:
    track = item.get("track", {})
    artists = track.get("artists", [])
    artist_names = [artist.get("name", "Unknown Artist") for artist in artists]
# took this .update DIRECTLY from w3schools thank you. 
    unique_artists.update(artist_names)  # adds all artists from this track to the set which should be o(1) 

print(f"\nfound {len(unique_artists)} unique artists in the listening history")
print(f"Artists: {unique_artists}")
# dictionary to store tag data
tag_data = {}  # should be: {"hip hop": {"sum": 340, "count": 5}, ...}

# looooping through each unique artist
for artist_name in unique_artists:
    try:
        # .get artist from Last.fm
        artist = network.get_artist(artist_name)
        tags = artist.get_top_tags(limit=10)  # Get top 10 tags per artist
        
       # process each tag
        for tag in tags:
            tag_name = tag.item.name
            tag_weight = int(tag.weight)
            # this should fix the issue where apparently tag.weight is a string like "100" instead of just a number, these api's return things so interestingly
            # if we've seen this tag before, update it
            if tag_name in tag_data:
                tag_data[tag_name]["sum"] += tag_weight
                tag_data[tag_name]["count"] += 1
            else:
                # if not, add
                tag_data[tag_name] = {"sum": tag_weight, "count": 1}
        
        print(f"✓ Got tags for {artist_name}")
    # test case LOLLLL but it ended up working so ggood
    except Exception as e:
        print(f"✗ Couldn't get tags for {artist_name}: {e}")

# calculate the average and show me 
print("\n" + "="*50)
print("MUSIC TASTE PROFILE")
print("="*50)

# math is imported, now after trying to decide if i should multiply get the sqrt or take a logorithmic approach, I went with sqrt because my individual artists are very important to my music taste howeeverrr i do think that my very common genres should be taken into count. 
tag_scores = {}
for tag_name, data in tag_data.items():
    average = data["sum"] / data["count"]
    score = average * math.sqrt(data["count"])  # composite score!!!
    tag_scores[tag_name] = {
        "score": score,
        "average": average,
        "count": data["count"]
    }

sorted_tags = sorted(tag_scores.items(), key=lambda x: x[1]["score"], reverse=True)

# display the ones that matter the most
print("\nmost important taste:")
for i, (tag_name, data) in enumerate(sorted_tags[:20], 1):
    avg = data["average"]
    count = data["count"]
    print(f"{i:2}. {tag_name:20} - Score: {data['score']:6.1f} (avg: {data['average']:5.1f} × {data['count']} artists)")

profile_data = {
    "generated_at": datetime.datetime.now().isoformat(),
    "total_artists": len(unique_artists),
    "total_tags": len(tag_scores),
    "artists": list(unique_artists),
    "tags": {
        tag_name: {
            "score": data["score"],
            "average": data["average"],
            "count": data["count"]
        }
        for tag_name, data in tag_scores.items()
    }
}

filename = f"taste_profile_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
with open(filename, 'w') as f:
    json.dump(profile_data, f, indent=2)

print(f"\n✓ saved profile to {filename}")
