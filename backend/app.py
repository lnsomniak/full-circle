import os
import json
import uvicorn
from typing import List
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

try:
    import predict 
except ImportError:
    raise RuntimeError("Could not import predict.py. Check the backend folder structure.")
metadata = {}
api_version = 'v1.0.0'
n_artists = len(predict.all_artists_df)

app = FastAPI(
    title="FullCircle Recommendation API",
    description="FastAPI interface for the FullCircle ML Recommender.",
    version=api_version
)

origins = [
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "https://full-circle-theta.vercel.app"
]

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
    exclude_artists: List[str] = []
    
@app.get("/health", summary="API Health Check")
def health_check():
    return {
        "status": "online",
        "model_version": metadata.get('trained_at', 'N/A'),
        "n_artists_in_db": n_artists,
        "n_features": metadata.get('n_features', 'N/A')
    }

@app.post("/recommend", summary="Generate Recommendations")
def get_recommendations(request: RecommendationRequest):
    if not request.tags:
        raise HTTPException(
            status_code=400,
            detail="Tags list cannot be empty. Please provide at least one tag."
        )
    try:
        recommendations = predict.generate_recommendations(
            new_artist_name=request.artist_name, 
            new_artist_tags=request.tags,
            weighted=request.weighted_similarity,
            threshold=0.60, 
            top_n=10,
            exclude_artists=request.exclude_artists
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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)