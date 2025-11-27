# Full-Circle - Intelligent Music Discovery Engine

## What This Is

A personalized music recommendation system that actually understands my taste across genres. Built out of spite towards the giants of the music world, because I'm tired of algorithmic playlists that don't get the vibe. My taste ranges music across UK rap, Latin indie, and alt rock, etc etc.. and a wider net creates room for error in algorithms! This would allow me to control not only the net, but the whole ship. 
## The Problem

Spotify's recommendations are decent, but they're trained on everybody. I want something that learns *my* specific taste evolution, the energy I look for, the moods I gravitate toward, the way I jump between completely different genres yet understands recency bias. This is this tool. Something to match my energy and can read through my subtle patterns in my 6 years listening history Spotify provided at request... 

## Tech Stack

**Data Collection & Storage:**
- Python 3.12
- Spotify Web API (spotipy) - listening history extraction
- Last.FM API(pylast) - genre trend for further data collection 
- SQLite - 140k+ plays stored with varying timestamps
- CronTab - automated 3x daily sync (8am, 2pm, 10pm)
  
**Machine Learning:**
- scikit-learn - Random Forest classifier
- NumPy/Pandas - data processing and feature engineering
- Time weighted listening patterns (exponential decay)
- Tag based feature vectors from [Last.fm](http://last.fm/)
- Composite scoring (tag similarity × endorsement strength)
  
**Recommendation Engine:**
- Hybrid approach: collaborative filtering + content based
- Tag similarity matching
- Artist endorsement system (weighted by play counts)
- Time decayed preferences (90 day half life)

**Deployment (Planned):**
- FastAPI backend
- React + Tailwind CSS frontend
- Redis for caching

## Current Status

**Phase 1: Data & ML Foundation** ✅ COMPLETE

- [x]  Spotify OAuth authentication
- [x]  Listening history extraction (50 recent plays)
- [x]  Extended history import (140,392 plays from 2019-2025)
- [x]  SQLite database with incremental sync
- [x]  Automated cron jobs (3x daily data collection)
- [x]  [Last.fm] tag integration
- [x]  Time weighted preference calculation
- [x]  Composite scoring algorithm (sqrt scaling)
- [x]  ML feature matrix preparation (1,540 unique tags)

**Phase 2: ML Model Training** 🚧 IN PROGRESS

- [x]  Data labeling (top 25% = "liked")
- [x]  Feature engineering (tag based vectors)
- [ ]  Random Forest training
- [ ]  Model evaluation & tuning
- [ ]  Prediction pipeline

**Phase 3: Production** 📋 PLANNED

- [ ]  FastAPI backend MVP
- [ ]  React frontend MVP
- [ ]  Model serving endpoint
- [ ]  Deploy somewhere I can actually use it
## Why I'm Building This

1. **Real ML application** - Solving an actual problem with production grade code
2. **Full stack ownership** - Data engineering → ML → API → Frontend → Deployment
3. **Portfolio piece** - Something I use daily and can demo with confidence
4. **Learning vehicle** - Touches every part of modern ML systems which lets me explore machine learning naturally!

## Technical Challenges Solved

### Bug Hunt: Backwards Time Weighting
Spent 2+ hours debugging inverted time calculations where old plays had weight 1.0 and recent plays had weight ~0. Root cause: calculating `days_since_first` instead of `days_ago`. Classic mistake in time-series ML.

### Mixed Timestamp Formats
Spotify data has inconsistent timestamp precision (some with milliseconds, some without). Solved with `pd.to_datetime(format='ISO8601')` for automatic handling.

### API Rate Limiting Strategy
Instead of fetching tags for all 2,929 artists (20+ min), sample 500 liked + 500 not liked for balanced training set (~3-5 minutes).

## Long term Vision

- **Mood based playlist generation** - "Give me high energy morning music"
- **Explainable recommendations** - "Recommended because: 45% reggaeton, 30% indie, 25% recent plays"
- **Cross platform support** - Apple Music, YouTube Music integration
- **Social features** - Share discoveries with friends
- **Vinyl integration** - Camera monitoring which records I actually play and integrates that into my listening history
- **Deep learning** - Hopefully work hard enough to fund some 5090 only to explore neural networks for audio feature analysis for further development! 
  
## Learning Goals

- ✅ Time series feature engineering using datetime
- ✅ Hybrid recommendation systems
- 🚧 A good understanding of the complex and core libaries of Machine Learning
- 📋 API design and deployment
- 📋 Frontend state management
- 📋 Model monitoring and retraining

## Development Log

Detailed technical documentation and debugging sessions in `DEV_LOG.md`.

---

*Started: November 2024*  
**Current Phase:** Handwriting documentation to better understand the psuedocode! (core libraries, deep learning, librosa, optuna, lightfm even) 
Built with curiosity and too much time spent organizing playlists. Thank you Dan Sohval for the inspiration.

