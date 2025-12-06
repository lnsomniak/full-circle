# Full-Circle - Intelligent Music Discovery Engine  
## What This Is

A personalized music recommendation system that understands taste across genres. Built out of spite towards the giants of the music world, music taste ranges yet a wider net creates room for error in algorithms! This lets me control not only the net, but the whole ship.

## The Problem 

Spotify's recommendations are decent, but they're trained on everybody. I wanted something that learns a specific taste evolution, the energy you look for, the moods you gravitate toward, all while understanding recency bias.

## Tech Stack

**Frontend:**
- Next.js 15 + React + TypeScript
- Tailwind CSS
- Spotify OAuth (PKCE flow)
- Interactive diamond grid loading screen
  
**Backend:**
- FastAPI (Python)
- XGBoost + TF-IDF vectorization
- Cosine similarity matching
- Deployed on Render
  
**Data & APIs:**
- Spotify Web API - OAuth, artist images, user top artists
- Last.fm API - genre/tag extraction
- Supabase (PostgreSQL) - user data & feedback storage

**ML Pipeline:**
- 140k+ plays analyzed from 6 years of listening history
- 300 TF-IDF tag features + 7 behavioral features
- 76% prediction accuracy on preference classification

## Features

| Feature | Description |
|---------|-------------|
| 🎯 **ML Recommendations** | XGBoost model predicts what you'll like with confidence scores |
| 🏷️ **Auto Tag Fetch** | One click genre tags from Last.fm |
| 🔮 **Explore Mode** | Hide artists you already know for pure discovery |
| 💡 **Explainable AI** | See WHY each artist was recommended (matching tags) |
| ⚖️ **Weighted Similarity** | Toggle to prioritize rare/niche tags over common ones |
| 👍👎 **Feedback System** | Rate recommendations to improve future training |
| 📊 **Export Data** | Download feedback as CSV for model retraining |
| 🎨 **Personalized Loading** | Your album artwork on the loading screen |
| 🖼️ **Artist Images** | Real Spotify artist photos in results |


## Current Status 

**Phase 1: Data & ML Foundation** ✅ COMPLETE
- [x] Spotify OAuth authentication
- [x] Extended history import (140,392 plays from 2019-2025)
- [x] Last.fm tag integration
- [x] Time weighted preference calculation
- [x] ML feature matrix (307 features)

**Phase 2: ML Model Training** ✅ COMPLETE
- [x] XGBoost + Random Forest training
- [x] TF-IDF vectorization (300 tag features)
- [x] 76% prediction accuracy
- [x] IDF weighted similarity scoring

**Phase 3: Production** ✅ COMPLETE
- [x] FastAPI backend deployed on Render
- [x] Next.js frontend deployed on Vercel
- [x] Spotify OAuth with PKCE
- [x] Supabase database integration
- [x] User feedback collection
- [x] Explore Mode (exclude known artists)
- [x] Export feedback for retraining

## Technical Highlights

### Explainable AI
Each recommendation shows the matching tags between your input and the suggested artist, sorted by rarity (IDF score). You see *why* the model thinks you'll like someone.

### Explore Mode
Filters out your top 50 Spotify artists from recommendations. Pure discovery of artists you've never heard.

### Weighted Similarity
Toggle between:
- **On:** Rare tags (like "icelandic" or "bedroom pop") weighted higher
- **Off:** All tags weighted equally

### Parallel Data Fetching
Album artwork for the loading screen fetches in parallel with user data, reducing perceived load time while showing personalized content through preloading. 

## Local Development
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app:app --reload

# Frontend
cd frontend/full_circle_ui
npm install
npm run dev
```
## Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id
NEXT_PUBLIC_REDIRECT_URI=http://127.0.0.1:3000/callback
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXT_PUBLIC_LASTFM_API_KEY=your_lastfm_key
```
## Why I Built This

1. **Real ML application** - My first time solving an actual problem with (what I feel is) production grade code
2. **Full stack ownership** - Data engineering → ML → API → Frontend → Deployment
3. **Portfolio piece** - Something I use daily and can demo with confidence with friends!
4. **Learning vehicle** - Touches every part of modern ML systems

## Long-term Vision

- 🎭 Mood based playlist generation
- 🍎 Apple Music / YouTube Music integration
- 📀 Vinyl integration - camera monitoring for physical plays
- 🧠 Neural networks for audio feature analysis

## Development Log

Detailed technical documentation and debugging sessions in `DEV_LOG.md`.

*Started: November 2025*  
*Completed: December 2025*  

---

Built with curiosity, too much time organizing playlists, and some very long all nighters. Thank you Dan Sohval for the inspiration.

🔗 **Live Demo:** https://full-circle-theta.vercel.app
