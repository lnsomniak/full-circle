import sqlite3
import pylast
import json
import glob
import os
from dotenv import load_dotenv
from collections import defaultdict

load_dotenv()

# credentials
api_key = os.getenv("LASTFM_API_KEY")
api_secret = os.getenv("LASTFM_API_SECRET")

network = pylast.LastFMNetwork(
    api_key=api_key,
    api_secret=api_secret
)

# connecting to database
conn = sqlite3.connect("listening_history.db")
cursor = conn.cursor()

cursor.execute("""
    SELECT artist_names, COUNT(*) as play_count 
    FROM plays 
    GROUP BY artist_names 
    ORDER BY play_count DESC
""")
# It really took me quite a long time to understand a way to implement this despite of its simplicity, but SELECT artist_names, COUNT(*) as play_count just selects the name and then counts how many times it appears
# the next line, FROM plays is literally exactly what it sounds like, from the plays table, and then the group and order is just grouping all rows in said table with the same artist together
# order by play count is sorts these results by the count and DESC is there because of descending order. 
your_artists = cursor.fetchall()

print(f"Found {len(your_artists)} unique artists in the history")
print("\nTop 10 most-played artists:")
for artist, count in your_artists[:10]:
    print(f"  {artist}: {count} plays")

candidate_artists = defaultdict(lambda: {"endorsements": 0, "endorsed_by": []})

print("\n" + "="*60)
print("Finding similar artists...")
print("="*60)

for artist_name, play_count in your_artists[:20]:  # top 20 artists to keep it fast
    try:
        artist = network.get_artist(artist_name)
        similar = artist.get_similar(limit=10)  # top 10 
        
        for similar_artist in similar:
            similar_name = similar_artist.item.name
            
            # line should skip if it's an artist i already have in my list- will only get better once spotify hands me my data
            if similar_name in [a[0] for a in your_artists]:
                continue
            
            # weight by play count to include loops! i love looping my songs.
            weight = play_count
            candidate_artists[similar_name]["endorsements"] += weight
            candidate_artists[similar_name]["endorsed_by"].append(artist_name)
        
        print(f"✓ {artist_name} ({play_count} plays)")
    
    except Exception as e:
        print(f"✗ Couldn't get similar artists for {artist_name}: {e}")

print(f"\n✓ Found {len(candidate_artists)} candidate artists")

# loading my taste profile little cute message
print("\nLoading your taste profile <3...")
# finds the most recent profile
profile_files = glob.glob("taste_profile_*.json")
if not profile_files:
    print("ERROR: No taste profile found! Run build_taste_profile.py first.")
    exit(1)
# if statement very helpful 
latest_profile = sorted(profile_files)[-1]
with open(latest_profile, 'r') as f:
    your_profile = json.load(f)

your_tags = your_profile["tags"]
print(f"✓ Loaded profile with {len(your_tags)} tags")

# cute statement
print("\n please wait while I calculate the tag similarity <3")

for candidate_name in list(candidate_artists.keys()):
    try:
        artist = network.get_artist(candidate_name)
        tags = artist.get_top_tags(limit=10)
        
        # similarity score for loop 
        similarity_score = 0
        for tag in tags:
            tag_name = tag.item.name
            if tag_name in your_tags:
                # doing both the wights of the similar artist tags and my profile score for the total similarity score! just adding to the math so it's a normalzied score and not some massive number.
                artist_tag_weight = int(tag.weight)
                your_tag_score = your_tags[tag_name]["score"]
                similarity_score += (artist_tag_weight * your_tag_score) / 100
        
        candidate_artists[candidate_name]["similarity"] = similarity_score
        
    except Exception as e:
        # **if** can't get tags, remove this candidate
        del candidate_artists[candidate_name]

print(f"✓ Calculated similarity for {len(candidate_artists)} candidates")

# print statements ✓ 
print("\n" + "="*60)
print("TOP RECOMMENDATIONS")
print("="*60)

# endorsements × similarity
for candidate_name, data in candidate_artists.items():
    endorsements = data["endorsements"]
    similarity = data.get("similarity", 0)
    
# my cmposite score: multiply endorsements by similarity
# high endorsements + high similarity = best recommendations
    data["final_score"] = endorsements * similarity

# sort final score in one line ✓ (for the record i love this little checkmark it's such a nice touch
ranked = sorted(candidate_artists.items(), key=lambda x: x[1]["final_score"], reverse=True)

# display top 20 print statements with a for loop 
print("\nTop 20 artists you should check out:\n")
for i, (artist_name, data) in enumerate(ranked[:20], 1):
    endorsements = data["endorsements"]
    similarity = data["similarity"]
    final_score = data["final_score"]
    endorsed_by = ", ".join(data["endorsed_by"][:3])  # shows who endorsed it so I can see who i need to lioten to less LOLLLLLLLLLLLLLLLLLLLL
    
    print(f"{i:2}. {artist_name}")
    print(f"    Score: {final_score:.1f} (endorsements: {endorsements}, similarity: {similarity:.1f})")
    print(f"    Endorsed by: {endorsed_by}")
    if len(data["endorsed_by"]) > 3:
        print(f"    ... and {len(data['endorsed_by']) - 3} others") # who will i kick out of my spotify
    print()
