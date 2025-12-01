"""
FullCircle Prediction Module
Predicts whether a new artist will be liked and generates recommendations.
"""
# I am going to try being as professional as possible here. this is my application to MANGO. 
import pickle
import numpy as np
import pandas as pd
from scipy.spatial.distance import cosine
from typing import List, Dict, Tuple
import os

MODEL_DIR = 'model_artifacts'
BLACKLIST_TAGS = {'hop', 's', 'boy', 'good', 'east', 'states', 'new'}

print("Loading model artifacts...")
final_xgb_model = pickle.load(open(f'{MODEL_DIR}/final_xgb_model.pkl', 'rb'))
tfidf = pickle.load(open(f'{MODEL_DIR}/tfidf_vectorizer.pkl', 'rb'))
all_feature_names = pickle.load(open(f'{MODEL_DIR}/feature_names.pkl', 'rb'))
behavioral_means = pickle.load(open(f'{MODEL_DIR}/behavioral_means.pkl', 'rb'))
all_artists_df = pd.read_pickle(f'{MODEL_DIR}/all_artists_df.pkl')

try:
    print(f"DEBUG: TFIDF loaded successfully: {tfidf}")
    IDF_WEIGHTS = tfidf.idf_
    FEATURE_NAMES = tfidf.get_feature_names_out()
    IDF_MAP = dict(zip(FEATURE_NAMES, IDF_WEIGHTS))
    
    # NEW DEBUG CODE:
    print(f"DEBUG: IDF_WEIGHTS shape: {IDF_WEIGHTS.shape}")
    print(f"DEBUG: Feature Names count: {len(FEATURE_NAMES)}")
    print(f"DEBUG: Rarity of 'icelandic' tag (IDF): {IDF_MAP.get('icelandic', 'NOT FOUND')}")

except AttributeError as e:
    print(f"Error loading TF-IDF components: {e}")
    IDF_WEIGHTS = None
    IDF_MAP = {}
except FileNotFoundError as e:
    print(f"Error: Missing model file: {e}")
    IDF_WEIGHTS = None
    IDF_MAP = {}

print(f"✓ Loaded model with {len(all_feature_names)} features")
print(f"✓ Loaded {len(all_artists_df)} artists for recommendations")
print(f"✓ Behavioral means: {behavioral_means}")

print("\nDebug: Analyzing feature vectors...")
tfidf_nonzero = 0
for idx, row in all_artists_df.iterrows():
    vec = row['features']
    if np.sum(np.abs(vec[:300])) > 0:  # First 300 are TF-IDF
        tfidf_nonzero += 1

print(f"Artists with non-zero TF-IDF features: {tfidf_nonzero}/{len(all_artists_df)}")
print(f"Artists with ONLY behavioral features: {len(all_artists_df) - tfidf_nonzero}/{len(all_artists_df)}")

assert len(all_feature_names) == 307, f"Expected 307 features, got {len(all_feature_names)}"
# very smart from me, if there's ever more or less it just fails instead of giving me garbage which would cause me to spiral like i've done before. 
def preprocess_tags(tags: List[str]) -> List[str]:
    cleaned = []
    for tag in tags:
        tag = tag.lower().strip()
        if tag not in BLACKLIST_TAGS and len(tag) > 1:
            cleaned.append(tag)
    return cleaned

def create_feature_vector(artist_tags: List[str]) -> np.ndarray:
    clean_tags = preprocess_tags(artist_tags)
    tag_string = " | ".join(clean_tags) if clean_tags else ""
    tfidf_vector = tfidf.transform([tag_string]).toarray().flatten()
    
    behavioral_features = np.array([
        behavioral_means['late_night_ratio'],
        behavioral_means['weekend_ratio'],
        behavioral_means['consistency_score'],
        behavioral_means['consistency_std'],
        behavioral_means['late_weekend_interaction'],
        behavioral_means['consistency_x_late_night'],
        behavioral_means['all_behavioral'],
    ])
    
    full_vector = np.hstack([tfidf_vector, behavioral_features])
    
    assert full_vector.shape[0] == 307, f"Expected 307 features, got {full_vector.shape[0]}"
    
    return full_vector.reshape(1, -1)

# won't pretend like I knew what a Tuple was before this project LOLLLLLLLLLLLLL.
def predict_artist_probability(artist_name: str, artist_tags: List[str]) -> Tuple[float, np.ndarray]:
    feature_vector = create_feature_vector(artist_tags)
    
    probability = final_xgb_model.predict_proba(feature_vector)[0][1]
    
    return probability, feature_vector.flatten()
def generate_recommendations(
    new_artist_name: str, 
    new_artist_tags: List[str],
    weighted: bool = True,
    threshold: float = 0.65,
    top_n: int = 10
) -> List[Dict]:

    probability, new_artist_vector = predict_artist_probability(new_artist_name, new_artist_tags)

    if weighted and IDF_WEIGHTS is not None:
        tag_vector = new_artist_vector[:300].copy()
        weight_multiplier = np.zeros_like(tag_vector)

        for i, feature_name in enumerate(FEATURE_NAMES):
            if tag_vector[i] > 0:
                weight_multiplier[i] = IDF_MAP.get(feature_name, 1.0)
        weighted_tag_vector = tag_vector * weight_multiplier
        new_artist_vector[:300] = weighted_tag_vector
    
    if probability < threshold:
        return [{
            "artist": new_artist_name,
            "probability": float(probability),
            "recommendation": False,
            "message": f"Low prediction score ({probability:.2%}). Model is not confident you'll like this artist. Try threshold={threshold:.0%} or higher."
        }]
    
 # max playcount for a low history is 5, trying to get some artists that i've listened to a little bit but not enough to be considered a favorite
    LOW_HISTORY_THRESHOLD = 5 

    not_preferred_candidates = all_artists_df[
        (all_artists_df['label'] > 0) & 
        (all_artists_df['label'] < LOW_HISTORY_THRESHOLD) &
        (all_artists_df['features'].apply(lambda x: np.sum(np.abs(x[:300])) > 0))
    ].copy()
    recommendations = []
    
    for _, row in not_preferred_candidates.iterrows():
        candidate_vector = row['features']
        # skip artists with no tags
        if np.sum(np.abs(candidate_vector)) == 0:
            continue
        try:
            # by the time I push this, I wouldn't be surprised if I already forgot about this strategy I used. 
            # I was getting some crazy numbers in my prediction results, and it was because my TF-IDF features were being measured in numbers like 0.04, and 0.12
            # this is in comparison to my behaviorals, which were in numbers like 63.97 etc etc
            # Normally, you'd think to normalize however I thought that in my problem this wouldn't work since normalizing doesn't separate intent.
            # By slicing the [:300], I forced the math to look at ONLY the genre tags. Now the vector for Laufey points to Jazz and the vector for Feid points to Reggaeton and the angle between them is wide. 
            vec_a_tags = new_artist_vector[:300]
            vec_b_tags = candidate_vector[:300]

          
            if np.sum(np.abs(vec_a_tags)) == 0 or np.sum(np.abs(vec_b_tags)) == 0:
                continue

            similarity = 1 - cosine(vec_a_tags, vec_b_tags)

            # a lot of my return data was nan, this is a really important line for me atm (didn't know what nan was before)
            if np.isnan(similarity) or np.isinf(similarity):
                continue

            final_score = probability * similarity
        
            recommendations.append({
                'artist': row['artist_name'],
                'similarity_to_input': float(similarity),
                'prediction_confidence': float(probability),
                'final_ranking_score': float(final_score),
            })
        except Exception as e:
            continue
    print(f"\nDEBUG: Found {len(recommendations)} candidates with non-zero tags")
    if len(recommendations) > 0:
        print("\nTop 3 candidate vectors analysis:")
        for i, rec in enumerate(recommendations[:3]):
            artist_name = rec['artist']
            artist_row = all_artists_df[all_artists_df['artist_name'] == artist_name].iloc[0]
            candidate_vec = artist_row['features']
            
            print(f"\n{i+1}. {artist_name}:")
            print(f"   TF-IDF portion sum: {np.sum(np.abs(candidate_vec[:300])):.4f}")
            print(f"   Behavioral portion: {candidate_vec[300:]}")
            print(f"   Cosine distance: {cosine(new_artist_vector, candidate_vec):.6f}")
            print(f"   Similarity: {1 - cosine(new_artist_vector, candidate_vec):.6f}")
    
    print(f"\nInput artist (Laufey) vector:")
    print(f"   TF-IDF portion sum: {np.sum(np.abs(new_artist_vector[:300])):.4f}")
    print(f"   Behavioral portion: {new_artist_vector[300:]}")
    
    recommendations.sort(key=lambda x: x['final_ranking_score'], reverse=True)
    return recommendations[:top_n]


print("\nDebug: Checking for zero-vectors in dataset...")
zero_count = 0
for idx, row in all_artists_df.iterrows():
    if np.sum(np.abs(row['features'])) == 0:
        zero_count += 1
        if zero_count <= 5:  # checking...
            print(f"  Zero-vector artist: {row['artist_name']}")

print(f"Total zero-vector artists: {zero_count}/{len(all_artists_df)}")
# --- Example Usage ---
if __name__ == "__main__":
    test_artist = "Laufey"
    test_tags = ["jazz", "indie pop", "female vocalists", "icelandic", "bedroom pop"]
    
    print(f"\n{'='*60}")
    print(f"Testing prediction for: {test_artist}")
    print(f"Tags: {test_tags}")
    print(f"{'='*60}")
    
    prob, features = predict_artist_probability(test_artist, test_tags)
    print(f"\nPrediction: {prob:.2%} probability you'll like this artist")
    print(f"Feature vector shape: {features.shape}")
    
    print(f"\n{'='*60}")
    print(f"Generating recommendations based on {test_artist}...")
    print(f"{'='*60}")
    
    recommendations = generate_recommendations(test_artist, test_tags, threshold=0.60, top_n=10)
    
    if recommendations and 'message' not in recommendations[0]:
        print(f"\nTop 10 similar artists you might like:")
        for i, rec in enumerate(recommendations, 1):
            print(f"{i:2}. {rec['artist']:30} - Score: {rec['final_ranking_score']:.4f} "
                  f"(Similarity: {rec['similarity_to_input']:.2%})")
    else:
        print(f"\n{recommendations[0]['message']}")
