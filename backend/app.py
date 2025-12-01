# backend/app.py

import os
import json
import uvicorn
from typing import List
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# This imports all functions and artifacts loaded in predict.py, new for me
try:
    import predict 
except ImportError:
    raise RuntimeError("Could not import predict.py. Check the backend folder structure.")
# really good error code for later, I've been doing this a lot with my code where I make even my errors explained to not have to go back so often.
# load metadata for versioning, but fallback if it doesn't exist
try:
    metadata = predict.metadata
    api_version = metadata.get('trained_at', 'v0.0.1')
    n_artists = len(predict.all_artists_df)
except AttributeError:
    # If predict.py hasn't been updated to load metadata yet
    metadata = {}
    api_version = 'v0.0.1 (Metadata not loaded)'
    n_artists = 0

app = FastAPI(
    title="FullCircle Recommendation API",
    description="FastAPI interface for the FullCircle ML Recommender.",
    version=api_version
)

# Updated CORS - will add production URL when deployed
origins = [
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    
]

# CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RecommendationRequest(BaseModel):
    artist_name: str
    tags: List[str]
    weighted_similarity: bool = True
    
@app.get("/health", summary="API Health Check")
def health_check():
    """
    Returns the status and loaded model metadata.
    """
    return {
        "status": "online",
        "model_version": metadata.get('trained_at', 'N/A'),
        "n_artists_in_db": n_artists,
        "n_features": metadata.get('n_features', 'N/A')
    }

@app.post("/recommend", summary="Generate Recommendations")
def get_recommendations(request: RecommendationRequest):
    """
    Generates a list of recommended artists based on a new artist's tags.
    """  
    if not request.tags:
        raise HTTPException(
            status_code=400,
            detail="Tags list cannot be empty. Please provide at least one tag."
        )

    try:
        # FIX: Now passing weighted_similarity through to the prediction function
        recommendations = predict.generate_recommendations(
            new_artist_name=request.artist_name, 
            new_artist_tags=request.tags,
            weighted=request.weighted_similarity,
            threshold=0.60, # this threshold will be edited, can confirm.
            top_n=10
        )
        
        if recommendations and 'message' in recommendations[0]:
            return {
                "message": recommendations[0]['message'],
                "artist_name_input": request.artist_name,
                "prediction_probability": recommendations[0]['probability'],
                "weighted_similarity_enabled": request.weighted_similarity
            }

        return {
            "artist_name_input": request.artist_name,
            "prediction_probability": recommendations[0]['prediction_confidence'],
            "weighted_similarity_enabled": request.weighted_similarity,
            "recommendations": recommendations
        }

    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An internal error occurred during prediction: {e}"
        )

# (For testing only) 
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)