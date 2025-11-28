import os
import pylast
import pickle
import sqlite3
import numpy as np
import pandas as pd
import xgboost as xgb
from datetime import datetime
from dotenv import load_dotenv
from collections import defaultdict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split
# Note: Took 4 hours to study modules, I have a fairly good idea of specifically all of sklearn, the jack of all trades. 
 
load_dotenv()
api_key = os.getenv("LASTFM_API_KEY")
api_secret = os.getenv("LASTFM_API_SECRET")
network = pylast.LastFMNetwork(api_key=api_key, api_secret=api_secret)

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

# top 25% or quantile 0.75 is what the algo considers to be "liked" 
threshold = artist_stats['weighted_plays'].quantile(0.75)
artist_stats['label'] = (artist_stats['weighted_plays'] >= threshold).astype(int)

print("\n" + "="*60)
print("Calculating behavioral features...")
print("="*60)

conn = sqlite3.connect("listening_history.db")

plays_query = """
SELECT 
    artist_names,
    played_at,
    COUNT(*) as plays
FROM plays
GROUP BY artist_names, played_at
"""
plays_df = pd.read_sql_query(plays_query, conn)
conn.close()

plays_df['played_at'] = pd.to_datetime(plays_df['played_at'], format='ISO8601')

plays_df['hour'] = plays_df['played_at'].dt.hour
plays_df['day_of_week'] = plays_df['played_at'].dt.dayofweek  # 0=Monday, 6=Sunday

behavioral_features = []

for artist in artist_stats['artist']:
    artist_plays = plays_df[plays_df['artist_names'] == artist]
    
    if len(artist_plays) == 0:
        behavioral_features.append({
            'artist': artist,
            'late_night_ratio': 0,
            'weekend_ratio': 0,
            'consistency_score': 0
        })
        continue
    
    total_plays = len(artist_plays)
    
    late_night_plays = len(artist_plays[(artist_plays['hour'] >= 23) | (artist_plays['hour'] <= 4)])
    late_night_ratio = late_night_plays / total_plays
    
    weekend_plays = len(artist_plays[artist_plays['day_of_week'].isin([5, 6])])
    weekend_ratio = weekend_plays / total_plays
    
    if len(artist_plays) > 1:
        artist_plays_sorted = artist_plays.sort_values('played_at')
        days_between = artist_plays_sorted['played_at'].diff().dt.days.dropna()
        if len(days_between) > 0:
            consistency_score = 1 / (days_between.std() + 1)  # +1 to avoid division by zero
        else:
            consistency_score = 0
    else:
        consistency_score = 0
    
    behavioral_features.append({
        'artist': artist,
        'late_night_ratio': late_night_ratio,
        'weekend_ratio': weekend_ratio,
        'consistency_score': consistency_score
    })

behavioral_df = pd.DataFrame(behavioral_features)
artist_stats = artist_stats.merge(behavioral_df, on='artist', how='left')

print(f"✓ Calculated behavioral features for {len(behavioral_df)} artists")
print(f"\nBehavioral feature examples (Mac Miller):")
mac_miller = artist_stats[artist_stats['artist'] == 'Mac Miller'].iloc[0]
print(f"  Late night ratio: {mac_miller['late_night_ratio']:.2%}")
print(f"  Weekend ratio: {mac_miller['weekend_ratio']:.2%}")
print(f"  Consistency score: {mac_miller['consistency_score']:.3f}")
print(f"\nLabeling:")
print(f"  Liked (1): {artist_stats['label'].sum()} artists (weighted_plays >= {threshold:.1f})")
print(f"  Not preferred (0): {len(artist_stats) - artist_stats['label'].sum()} artists")
# top 500 liked + 500 random not liked is the best way I fouind to balance the lack of API calls i'm able to do, also the diminishing returns that after 1000 examples apparently happens
# this lets the mdoel see 50/50 examples and learns to distinguish the features that predict both classes (in theory)
liked_artists = artist_stats[artist_stats['label'] == 1]
not_liked_sample = min(500, len(artist_stats[artist_stats['label'] == 0]))
not_liked_artists = artist_stats[artist_stats['label'] == 0].sample(len(liked_artists), random_state=42)
training_artists = pd.concat([liked_artists, not_liked_artists])

print(f"\n{'='*60}")
print(f"Fetching Last.fm tags for {len(training_artists)} artists...")
print(f"  Liked: {len(liked_artists)}")
print(f"  Not preferred: {len(not_liked_artists)}")
print(f"{'='*60}")


all_tags = defaultdict(int)
artist_tags = {}

for idx, row in training_artists.iterrows():
    artist_name = row['artist']
    
    try:
        artist = network.get_artist(artist_name)
        tags = artist.get_top_tags(limit=10)
        
        tag_dict = {}
        for tag in tags:
            tag_name = tag.item.name.lower() # no more separate "hip hop" and "Hip Hop" tags
            
            tag_name = tag_name.replace('hip hop', 'hip-hop')
            tag_name = tag_name.replace('hip_hop', 'hip-hop') # is this very specific to me? yes. do I care? no
# stand alone noise that i see very often. 
            if tag_name in ['hop', 'the', 's', 'and', 'new']:
                continue

            if len(tag_name) > 1:  # literally just the character "s" was showing up in my top reasons for high ranking?? get out
                tag_weight = int(tag.weight)
                tag_dict[tag_name] = tag_weight  
                all_tags[tag_name] += 1
        
        artist_tags[artist_name] = tag_dict
        
        if len(artist_tags) % 100 == 0:
            print(f"  Processed {len(artist_tags)}/{len(training_artists)} artists...")
    
    except Exception as e:
        artist_tags[artist_name] = {}  # if error

print(f"\n✓ Collected tags for {len(artist_tags)} artists")
print(f"✓ Found {len(all_tags)} unique tags")

print("\n" + "="*60)
print("Building COMBINED feature matrix (TF-IDF + Behavioral)...")
print("="*60)

artist_tag_sentences = []
for idx, row in training_artists.iterrows():
    artist_name = row['artist']
    tags = artist_tags.get(artist_name, {})
    tag_list = [tag for tag in tags.keys()]
    artist_tag_sentences.append(" ".join(tag_list) if tag_list else "")

tfidf = TfidfVectorizer(
    max_features=300,  
    min_df=5,           
    stop_words='english',  # removes "the", "and", "fi" from my list of top features
    token_pattern=r'[a-z-]{2,}'  # minimum 2 characters also a fix for the "s" thing just in case 
)

X_tags_tfidf = tfidf.fit_transform(artist_tag_sentences).toarray()

print(f"TF-IDF tag features: {X_tags_tfidf.shape[1]}")

X_behavioral = training_artists[[
    'late_night_ratio',
    'weekend_ratio', 
    'consistency_score'
]].fillna(0).values  

print(f"Behavioral features: {X_behavioral.shape[1]}")

X = np.hstack((X_tags_tfidf, X_behavioral))
y = training_artists['label'].values

print(f"\n✓ Combined feature matrix shape: {X.shape}")
print(f"  {X.shape[0]} artists")
print(f"  {X.shape[1]} total features ({X_tags_tfidf.shape[1]} tags + {X_behavioral.shape[1]} behavioral)")
print(f"\nClass distribution:")
print(f"  Liked (1): {np.sum(y == 1)} artists")
print(f"  Not preferred (0): {np.sum(y == 0)} artists")



print("\n" + "="*60)
print("Adding feature interactions and refining features...")
print("="*60)

behavioral_features_refined = []
for artist in artist_stats['artist']:
    artist_plays = plays_df[plays_df['artist_names'] == artist]
    
    if len(artist_plays) > 1:
        artist_plays_sorted = artist_plays.sort_values('played_at')
        days_between = artist_plays_sorted['played_at'].diff().dt.days.dropna()
        if len(days_between) > 0:
            consistency_std = days_between.std()  # raw dev
        else:
            consistency_std = 0
    else:
        consistency_std = 0
    
    behavioral_features_refined.append({
        'artist': artist,
        'consistency_std': consistency_std
    })

behavioral_refined_df = pd.DataFrame(behavioral_features_refined)
artist_stats = artist_stats.merge(behavioral_refined_df, on='artist', how='left')
training_artists = training_artists.merge(behavioral_refined_df, on='artist', how='left')

# I was getting an inflated score, which is cool but i figured it was a data leakage problem
training_artists['late_weekend_interaction'] = training_artists['late_night_ratio'] * training_artists['weekend_ratio']
training_artists['consistency_x_late_night'] = training_artists['consistency_score'] * training_artists['late_night_ratio']
training_artists['all_behavioral'] = training_artists['late_night_ratio'] * training_artists['weekend_ratio'] * training_artists['consistency_score']

print("✓ Added refined consistency score and 3 interaction features")


X_behavioral_enhanced = training_artists[[
    'late_night_ratio',
    'weekend_ratio', 
    'consistency_score',
    'consistency_std',  
    'late_weekend_interaction',      # <- NEW
    'consistency_x_late_night',      # <- NEW
    'all_behavioral'                 # <- NEWWWW
]].fillna(0).values

X = np.hstack((X_tags_tfidf, X_behavioral_enhanced))

print(f"Enhanced feature matrix: {X.shape[1]} features ({X_tags_tfidf.shape[1]} tags + {X_behavioral_enhanced.shape[1]} behavioral)")

param_grid = {
    'n_estimators': [100, 200, 300],
    'max_depth': [3, 5, 7],
    'learning_rate': [0.1, 0.05, 0.01],
    'gamma': [0.1, 0.5]
}

kfold = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

xgb_base = xgb.XGBClassifier(
    objective='binary:logistic',
    eval_metric='logloss',
    random_state=42,
    n_jobs=-1
)

grid_search = GridSearchCV(
    estimator=xgb_base,
    param_grid=param_grid,
    scoring='accuracy',
    n_jobs=-1,
    cv=kfold,
    verbose=1
)

print("\n" + "="*60)
print("Starting XGBoost Grid Search Cross-Validation (5-Fold)...")
print("This may take a few minutes as it trains many models.")
print("="*60)

grid_search.fit(X, y)

print("\n✓ Grid Search Complete!")
print(f"Best CV Accuracy found: {grid_search.best_score_:.2%}")
print(f"Best Hyperparameters: {grid_search.best_params_}")

# final model please
final_xgb_model = grid_search.best_estimator_

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

final_xgb_model.fit(X_train, y_train)
y_pred = final_xgb_model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"\nFinal Model Test Accuracy (using best params): {accuracy:.2%}")


print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['Not Preferred', 'Liked']))

print("\n" + "="*60)
print("Top 20 Most Important Features (Optimized XGBoost):")
print("="*60)

behavioral_names_enhanced = [
    'late_night_ratio', 'weekend_ratio', 'consistency_score', 'consistency_std',
    'late_weekend_interaction', 'consistency_x_late_night', 'all_behavioral'
]
all_feature_names = list(tfidf.get_feature_names_out()) + behavioral_names_enhanced

importances = final_xgb_model.feature_importances_
feature_importance = list(zip(all_feature_names, importances))
feature_importance.sort(key=lambda x: x[1], reverse=True)

for i, (feature, importance) in enumerate(feature_importance[:20], 1):
    print(f"{i:2}. {feature:35} - {importance:.4f}")

with open('fullcircle_model_v1.pkl', 'wb') as f:
    pickle.dump(final_xgb_model, f)

with open('tfidf_vectorizer_v1.pkl', 'wb') as f:
    pickle.dump(tfidf, f)

print("✓ Model and vectorizer saved!")
