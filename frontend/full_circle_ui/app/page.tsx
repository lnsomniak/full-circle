'use client';

import { useState } from 'react';
import { getArtistTags } from '@/lib/lastfm';
import { saveFeedback } from '@/lib/supabase';
import { useSpotify } from '@/lib/spotifycontext';
import { loginWithSpotify, searchSpotifyArtist } from '@/lib/spotify';
import dynamic from 'next/dynamic';

const DiamondGrid = dynamic(() => import('./components/DiamondGrid'), {
  ssr: false,
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function Home() {
  const {isAuthenticated, isLoading, user, topArtists, topAlbumArts, logout } = useSpotify();
  const [artistName, setArtistName] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [ratings, setRatings] = useState<Record<string, 1 | -1>>({});
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingTags, setFetchingTags] = useState(false);
  const [predictionProb, setPredictionProb] = useState<number | null>(null);
  const [isWeighted, setIsWeighted] = useState(true);
  const [artistImages, setArtistImages] = useState<Record<string, string>>({});

  const handleAutoFill = (artist: { name: string; genres: string[] }) => {
    setArtistName(artist.name);
    setTagsInput(artist.genres.slice(0, 5).join(', ')); 
  };

  const handleFeedback = async (artist: string, rank: number, rating: 1 | -1) => {
    if (!user) return;
    
    setRatings(prev => ({ ...prev, [artist]: rating }));
    
    await saveFeedback(user.id, {
      inputArtist: artistName,
      inputTags: tagsInput.split(',').map(t => t.trim()),
      recommendedArtist: artist,
      recommendationRank: rank,
      rating: rating,
      weightedSimilarity: isWeighted,
      predictionConfidence: predictionProb || 0,
    });
    
    console.log(`✅ Feedback saved: ${artist} = ${rating === 1 ? '👍' : '👎'}`);
  };

  const handleFetchTags = async () => {
    if (!artistName.trim()) return;
  
    setFetchingTags(true);
    const tags = await getArtistTags(artistName);
  
    if (tags.length > 0) {
      setTagsInput(tags.join(', '));
      console.log(`✅ Fetched ${tags.length} tags for ${artistName}`);
    } else {
      console.log(`⚠️ No tags found for ${artistName}`);
    }
  
    setFetchingTags(false);
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRecommendations([]);
    setPredictionProb(null);
    setRatings({});
    setArtistImages({});
    

    const tagsList = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    try {
      const res = await fetch(`${API_BASE_URL}/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artist_name: artistName,
          tags: tagsList,
          weighted_similarity: isWeighted,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.message) {
        setError(`Message from Model: ${data.message}`);
    } else {
      console.log('🏷️ Matching tags check:', data.recommendations[0]?.matching_tags);
      setPredictionProb(data.prediction_probability);
      setRecommendations(data.recommendations);

      data.recommendations.forEach(async (rec: any) => {
        const artist = await searchSpotifyArtist(rec.artist);
        if (artist?.image) {
          setArtistImages(prev => ({ ...prev, [rec.artist]: artist.image! }));
        }
      });
    }
    } catch (err) {
      setError('Failed to connect to backend. Is uvicorn running? Thought so.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    console.log('🎨 Passing to DiamondGrid:', topAlbumArts.length);
    return <DiamondGrid albumArts={topAlbumArts} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-950 text-gray-100">
      <div className="z-10 w-full max-w-2xl items-center justify-between font-mono text-sm">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
            Full-Circle
          </h1>
          
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {user?.images?.[0] && (
                <img 
                  src={user.images[0].url} 
                  alt={user.display_name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-gray-400 text-sm">{user?.display_name}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-white transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={loginWithSpotify}
              className="flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold py-2 px-4 rounded-full transition"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Login with Spotify
            </button>
          )}
        </div>

        {isAuthenticated && topArtists.length > 0 && (
          <div className="mb-6 p-4 bg-gray-900 rounded-xl border border-gray-800">
            <p className="text-gray-400 text-sm mb-3">Quick pick from your top artists:</p>
            <div className="flex flex-wrap gap-2">
              {topArtists.slice(0, 8).map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => handleAutoFill(artist)}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-full transition text-sm"
                >
                  {artist.images?.[2] && (
                    <img
                      src={artist.images[2].url}
                      alt={artist.name}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  {artist.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-1">Artist Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="e.g. Laufey"
                  className="flex-1 p-3 rounded bg-gray-800 border border-gray-700 text-white focus:border-green-500 focus:outline-none transition"
                  required
                />
                <button
                  type="button"
                  onClick={handleFetchTags}
                  disabled={!artistName.trim() || fetchingTags}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded transition text-sm font-medium"
                  title="Auto-fetch tags from Last.fm"
                >
                  {fetchingTags ? '...' : '🏷️ Tags'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. jazz, indie pop, icelandic"
                className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white focus:border-green-500 focus:outline-none transition"
                required
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isWeighted}
                  onChange={(e) => setIsWeighted(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-green-600 rounded border-gray-600 bg-gray-700 transition duration-150 ease-in-out"
                />
                <span className="text-sm text-gray-300 select-none">
                  Enable Weighted Tag Similarity? (Prioritizes niche/rare tags)
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Please work.' : 'Get Recommendations'}
            </button>
          </form>
        </div>

        {predictionProb !== null && (
          <div className="mt-8">
            <div className="text-center mb-6">
              <span className="text-gray-400">Prediction Confidence: </span>
              <span className="text-2xl font-bold text-green-400">
                {(predictionProb * 100).toFixed(2)}%
              </span>
            </div>

            <h2 className="text-xl font-bold mb-4 border-b border-gray-800 pb-2">
              Top 10 Recommendations
            </h2>

            <div className="grid gap-4">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-green-500/50 transition"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {artistImages[rec.artist] ? (
                        <img 
                          src={artistImages[rec.artist]} 
                          alt={rec.artist}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                          <span className="text-gray-500 text-xs">🎵</span>
                        </div>
                      )}
                      <div>
                        <span className="text-green-500 font-bold mr-3">#{index + 1}</span>
                        <span className="font-semibold text-lg">{rec.artist}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Similarity</div>
                        <div className="font-mono text-green-300">
                          {(rec.similarity_to_input * 100).toFixed(1)}%
                        </div>
                      </div>
                      
                      {user && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFeedback(rec.artist, index + 1, 1)}
                            className={`p-2 rounded-full transition ${
                              ratings[rec.artist] === 1
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                            title="Good recommendation"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleFeedback(rec.artist, index + 1, -1)}
                            className={`p-2 rounded-full transition ${
                              ratings[rec.artist] === -1
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                            title="Bad recommendation"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* WHY - Matching Tags */}
                  {rec.matching_tags && rec.matching_tags.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <span className="text-xs text-gray-500 mr-2">Matched:</span>
                      <div className="inline-flex flex-wrap gap-1">
                        {rec.matching_tags.slice(0, 6).map((tag: string) => (
                          <span 
                            key={tag} 
                            className="px-2 py-0.5 bg-purple-900/50 text-purple-300 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}