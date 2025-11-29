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

# --- Configuration ---
MODEL_DIR = 'model_artifacts'
BLACKLIST_TAGS = {'hop', 's', 'boy', 'good', 'east', 'states', 'new'}

# --- Load Model Artifacts ---
print("Loading model artifacts...")
final_xgb_model = pickle.load(open(f'{MODEL_DIR}/final_xgb_model.pkl', 'rb'))
tfidf = pickle.load(open(f'{MODEL_DIR}/tfidf_vectorizer.pkl', 'rb'))
all_feature_names = pickle.load(open(f'{MODEL_DIR}/feature_names.pkl', 'rb'))
behavioral_means = pickle.load(open(f'{MODEL_DIR}/behavioral_means.pkl', 'rb'))
all_artists_df = pd.read_pickle(f'{MODEL_DIR}/all_artists_df.pkl')

print(f"✓ Loaded model with {len(all_feature_names)} features")
print(f"✓ Loaded {len(all_artists_df)} artists for recommendations")
print(f"✓ Behavioral means: {behavioral_means}")

print("\nDebug: Analyzing feature vectors...")
#checking TF-IDF portion (first 300 features)
tfidf_nonzero = 0
for idx, row in all_artists_df.iterrows():
    vec = row['features']
    if np.sum(np.abs(vec[:300])) > 0:  # First 300 are TF-IDF
        tfidf_nonzero += 1

print(f"Artists with non-zero TF-IDF features: {tfidf_nonzero}/{len(all_artists_df)}")
print(f"Artists with ONLY behavioral features: {len(all_artists_df) - tfidf_nonzero}/{len(all_artists_df)}")

# --- Verify feature count ---
assert len(all_feature_names) == 307, f"Expected 307 features, got {len(all_feature_names)}"
# very smart from me, if there's ever more or less it just fails instead of giving me garbage which would cause me to spiral like i've done before. 
# --- Applying same preproccessing as training ---
def preprocess_tags(tags: List[str]) -> List[str]:
    cleaned = []
    for tag in tags:
        tag = tag.lower().strip()
        if tag not in BLACKLIST_TAGS and len(tag) > 1:
            cleaned.append(tag)
    return cleaned

# --- Creating a 307 feature vector for a new artist ---
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
    
# --- Combine: TF-IDF first, then behavioral ---
    full_vector = np.hstack([tfidf_vector, behavioral_features])
    
    assert full_vector.shape[0] == 307, f"Expected 307 features, got {full_vector.shape[0]}"
    
    return full_vector.reshape(1, -1)


def predict_artist_probability(artist_name: str, artist_tags: List[str]) -> Tuple[float, np.ndarray]:
    """
    Predicts the probability (0 to 1) that i'll (otherwise known as "the user") will like the artist    
    Args:
        artist_name: Name of the artist
        artist_tags: List of Last.fm tags for the artist
        
    Returns:
        (probability, feature_vector) tuple
        - probability: 0.0 to 1.0 (probability of being "Liked")
        - feature_vector: The 307 element feature vector used for prediction
    """
    feature_vector = create_feature_vector(artist_tags)
    
# --- Get prediction probability ---
    probability = final_xgb_model.predict_proba(feature_vector)[0][1]
    
    return probability, feature_vector.flatten()
# --- Generating artist recs based on what I like ---
def generate_recommendations(
    new_artist_name: str, 
    new_artist_tags: List[str], 
    threshold: float = 0.65,
    top_n: int = 10
) -> List[Dict]:

    probability, new_artist_vector = predict_artist_probability(new_artist_name, new_artist_tags)
    
# --- Checking if prediction confidence is high enough ---
    if probability < threshold:
        return [{
            "artist": new_artist_name,
            "probability": float(probability),
            "recommendation": False,
            "message": f"Low prediction score ({probability:.2%}). Model is not confident you'll like this artist. Try threshold={threshold:.0%} or higher."
        }]
    
 # --- Filter for "Not Preferred" artists (label == 0), this was a debug that didn't work as planned but still good to have
    not_preferred_candidates = all_artists_df[
       (all_artists_df['label'] == 0) &
       (all_artists_df['features'].apply(lambda x: np.sum(np.abs(x[:300])) > 0))
    ].copy()    
    
    recommendations = []
    
#  --- Calculating similarity for all candidates ---
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

            # Safety check for empty tag vectors
            if np.sum(np.abs(vec_a_tags)) == 0 or np.sum(np.abs(vec_b_tags)) == 0:
                continue

            # Calculate similarity on Tags only
            similarity = 1 - cosine(vec_a_tags, vec_b_tags)

            # a lot of my return data was nan, this is a really important line for me atm
            if np.isnan(similarity) or np.isinf(similarity):
                continue
        # Final score: combine prediction confidence with feature similarity
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
    

 # --- Sorts by final score and return top N ---
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
    # Test with one of my recently listened to artists 
    test_artist = "Laufey"
    test_tags = ["jazz", "indie pop", "female vocalists", "icelandic", "bedroom pop"]
    
    print(f"\n{'='*60}")
    print(f"Testing prediction for: {test_artist}")
    print(f"Tags: {test_tags}")
    print(f"{'='*60}")
    
    # Get prediction
    prob, features = predict_artist_probability(test_artist, test_tags)
    print(f"\nPrediction: {prob:.2%} probability you'll like this artist")
    print(f"Feature vector shape: {features.shape}")
    
    # Get recommendations
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
