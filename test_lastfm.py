from dotenv import load_dotenv
import os
import pylast

load_dotenv()

# testing whether or not this lastfm thing will work to bypass spotify not giving me access to audio analysis ORRRRR audio features :(
api_key = os.getenv("LASTFM_API_KEY")
api_secret = os.getenv("LASTFM_API_SECRET")

# connection check
network = pylast.LastFMNetwork(
    api_key=api_key,
    api_secret=api_secret
)

# testing
artist_name = "Bad Bunny"

# get the info and print my tags PLEASEEEEEEE
artist = network.get_artist(artist_name)

print(f"Artist: {artist.get_name()}")
print(f"\nTop Tags:")
tags = artist.get_top_tags()
for tag in tags[:10]:
    print(f"  - {tag.item.name} (weight: {tag.weight})")

print(f"\nSimilar Artists:")
similar = artist.get_similar(limit=5)
for similar_artist in similar:
    print(f"  - {similar_artist.item.name}")
