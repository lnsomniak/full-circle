'use client';

import { useState } from 'react';
import { useSpotify } from '@/lib/spotifycontext';
import { loginWithSpotify } from '@/lib/spotify';
import dynamic from 'next/dynamic';

const DiamondGrid = dynamic(() => import('./components/DiamondGrid'), {
  ssr: false,
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function Home() {
  const { isAuthenticated, isLoading, user, topArtists, logout } = useSpotify();
  
  const [artistName, setArtistName] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [predictionProb, setPredictionProb] = useState<number | null>(null);
  const [isWeighted, setIsWeighted] = useState(true);
  const handleAutoFill = (artist: { name: string; genres: string[] }) => {
    setArtistName(artist.name);
    setTagsInput(artist.genres.slice(0, 5).join(', ')); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRecommendations([]);
    setPredictionProb(null);

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
        setPredictionProb(data.prediction_probability);
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      setError('Failed to connect to backend. Is uvicorn running? Thought so.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

if (isLoading) {
  return <DiamondGrid />;
}

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-950 text-gray-100">
      <div className="z-10 w-full max-w-2xl items-center justify-between font-mono text-sm">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
            FullCircle Recs
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

        {/* Main Form */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-gray-400 mb-1">Artist Name</label>
              <input
                type="text"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="e.g. Laufey"
                className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white focus:border-green-500 focus:outline-none transition"
                required
              />
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
                  Enable Weighted Tag Similarity (Prioritizes niche/rare tags)
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Analyzing VIBE...' : 'Get Recommendations'}
            </button>
          </form>
        </div>
        {error && (
          <div className="mt-6 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
            {error}
          </div>
        )}

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
                  className="p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-green-500/50 transition flex justify-between items-center"
                >
                  <div>
                    <span className="text-green-500 font-bold mr-3">#{index + 1}</span>
                    <span className="font-semibold text-lg">{rec.artist}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Score</div>
                    <div className="font-mono text-green-300">
                      {rec.final_ranking_score.toFixed(4)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}