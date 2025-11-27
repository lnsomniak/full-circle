import sqlite3
import pandas as pd
from datetime import datetime
import numpy as np
# i legit took a week to study this, this is going to be the easiest thing of my life (i'm LYINGG.)
#LETS get the basics out the way so the credentials and laoding all the plays i ahve

conn = sqlite3.connect("listening_history.db")

query = """
SELECT 
    artist_names,
    played_at,
    COUNT(*) as play_count
FROM plays
GROUP BY artist_names, DATE(played_at)
ORDER BY played_at
"""
# see how i made it reabable very cool very nice i'm listening to who knows by daniel ceaser i did it to the tempo of this song
df = pd.read_sql_query(query, conn)
conn.close()

print(f"Loaded {len(df)} play records")
print(f"\nDate range: {df['played_at'].min()} to {df['played_at'].max()}")
#next part is just converting played_at into readable time, so using datetime we imported earlier
#edit! which got fixed later related to the issue of not all my songs having the same time! 
df['played_at'] = pd.to_datetime(df['played_at'], format='ISO8601')
# I googled a way to do this well, but honestly it didn't take long to find the time_decay function. I'm gonna start setting it up here
# edit! ^ Some of the songs don't include miliseconds! I rewrote this to tell pandas to just handle both formats automatically. This will be reflected in my DEV_LOG
#      first_play = df['played_at'].min()
#      df['days_since_first'] = (df['played_at'] - first_play).dt.days
# i'm highlighting these two lines because they ruined my code for a while, i had to do so many lookups of specific songs because artists that I hadn't listened to in over a year were appearing.
half_life_days = 90
most_recent_play = df['played_at'].max()
df['days_ago'] = (most_recent_play - df['played_at']).dt.days
df['time_weight'] = np.exp(-np.log(2) * df['days_ago'] / half_life_days)
print(f"\nTime weighting examples:")
print(f"Oldest play ({df['played_at'].min().date()}): weight = {df['time_weight'].min():.3f}")
print(f"Newest play ({df['played_at'].max().date()}): weight = {df['time_weight'].max():.3f}")

# aggregate
artist_stats = df.groupby('artist_names').agg({
    'play_count': 'sum',  # total motherfreaking plays
    'played_at': 'max'     # Most recent motherfreaking play
}).reset_index()

df['weighted_count'] = df['play_count'] * df['time_weight']
weighted_sum = df.groupby('artist_names')['weighted_count'].sum()
artist_stats['weighted_plays'] = artist_stats['artist_names'].map(weighted_sum)

artist_stats.columns = ['artist', 'total_plays', 'last_played', 'weighted_plays']

# sorted by weighted motherfreaking plays
artist_stats = artist_stats.sort_values('weighted_plays', ascending=False)

print(f"\n" + "="*60)
print("Top 20 artists by TIME WEIGHTED MOTHERFREAKING plays:")
print("="*60)
for i, row in artist_stats.head(20).iterrows():
    print(f"{row['artist']:30} - Total: {row['total_plays']:5.0f}, Weighted: {row['weighted_plays']:7.1f}")

# top 10% or quantile 0.90 is what the algo considers to be "liked" 
threshold = artist_stats['weighted_plays'].quantile(0.90)
artist_stats['label'] = (artist_stats['weighted_plays'] >= threshold).astype(int)

print(f"\nLabeling:")
print(f"  Liked (1): {artist_stats['label'].sum()} artists (weighted_plays >= {threshold:.1f})")
print(f"  Not preferred (0): {len(artist_stats) - artist_stats['label'].sum()} artists")

