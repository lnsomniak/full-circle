import json
import sqlite3
import glob
from datetime import datetime

# first things first (second because it's after api's) is just the basics so all of my locating shit
conn = sqlite3.connect("listening_history.db")
cursor = conn.cursor()

# this is new, fun!
json_files = sorted(glob.glob("Spotify Extended Streaming History/Streaming_History_Audio_*.json"))
# test case in case if ever doens't 
print(f"Found {len(json_files)} audio history files")
print("="*60)

total_plays = 0
imported = 0
duplicates = 0
skipped_short = 0
# empty! for now, processes it below 
for json_file in json_files:
    print(f"\nProcessing: {json_file}")
    
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for entry in data:
        total_plays += 1
       
 # i love this line, it skips if played less than 30 seconds. 
        ms_played = entry.get('ms_played', 0)
        if ms_played < 30000:
            skipped_short += 1
            continue
        
# extract all! lots of entry.get.. thank you codepath!
        played_at = entry.get('ts')
        track_name = entry.get('master_metadata_track_name')
        artist_name = entry.get('master_metadata_album_artist_name')
        track_uri = entry.get('spotify_track_uri', '')
        
        # if no real data, skips. takes care of hundreds of edge cases!
        if not played_at or not track_name or not artist_name:
            continue
        
        # give me that track ID. 
        track_id = track_uri.split(':')[-1] if track_uri else None
        
        # try: to insert into my plays database 
        try:
            cursor.execute(
                "INSERT INTO plays (played_at, track_id, track_name, artist_names) VALUES (?, ?, ?, ?)",
                (played_at, track_id, track_name, artist_name)
            )
            imported += 1
        except sqlite3.IntegrityError:
            # duplicate- although won't be used often still useful.,
            duplicates += 1
    
    conn.commit()
    print(f"  ✓ {imported} imported, {duplicates} duplicates, {skipped_short} skipped (< 30s)")

conn.close()
# lots of information, very helpful for me but also just helpful to have for readability 
print("\n" + "="*60)
print("COMPLETEDDD YOU DID IT")
print("="*60)
print(f"Total entries processed: {total_plays:,}")
print(f"Successfully imported: {imported:,}")
print(f"Duplicates skipped: {duplicates:,}")
print(f"Too short (< 30s): {skipped_short:,}")
