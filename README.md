# Full-Circle - Intelligent Music Discovery Engine

## What This Is

A personalized music recommendation system that actually understands my taste across genres. Built out of spite towards the giants of the music world, because I'm tired of algorithmic playlists that don't get the vibe. My taste ranges music across UK rap, Latin indie, and alt rock, etc etc.. and a wider net creates room for error in algorithms! This would allow me to control not only the net, but the whole ship. 
## The Problem

Spotify's recommendations are decent, but they're trained on everybody. I want something that learns *my* specific taste, the energy I look for, the moods I gravitate toward, the way I jump between completely different genres. This is that tool. Something to match my energy that I’d appreciate.. 

## Tech Stack

**Backend:**
- Python (FastAPI)
- Spotify Web API 
- Spotipy API for ease of access
- Last.FM API for genre trend for further data collection
- scikit-learn for ML models
- SQLite for data storage
- CronTab for automatation
- Redis for caching (maybe, if needed)

**Frontend:**
- React
- Tailwind CSS

**ML Approach:**
- Audio feature analysis (tempo, energy, valence, danceability)
- Clustering algorithms to find similarity patterns
- Collaborative filtering using my listening history
- Genre agnostic recommendations based on audio characteristics

## Current Status

**In Progress** - Audio features added, currently gathering data!

- [x] Project setup
- [x] Spotify API authentication
- [x] Pull listening history and audio features
- [x] Complex composite algorithm
- [ ] FastAPI backend MVP
- [ ] React frontend MVP
- [ ] Deploy somewhere I can actually use it

## Why I'm Building This

1. **Real ML application** - Not another tutorial project. This solves an actual problem I have.
2. **Full-stack practice** - End to end ownership from data collection to deployment.
3. **Portfolio piece** - Something I can demo in interviews that I'm genuinely excited about.
4. **Actually useful** - I'll use this daily, which means I'll be more inclined to ensure its quality. 

## Long-term Vision

- Playlist generation based on mood/energy
- Cross platform support (Apple Music, YouTube Music)
- Social features - share discoveries with friends
- Vinyl integration - Camera attached to my vinyl player also recording the data of which vinyls I play.

## Learning Goals

- Production grade ML pipelines
- API design and rate limiting
- Frontend state management
- Deployment and monitoring
- Working with real, messy music data

---

*Started: November 2024*  
*Expected MVP: January 2025*

Built with curiosity and too much time spent organizing playlists. Thank you Dan Sohval for the inspiration.

