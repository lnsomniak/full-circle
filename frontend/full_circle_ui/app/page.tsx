'use client'; 

import { useState } from 'react';

export default function Home() {
  const [artistName, setArtistName] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [predictionProb, setPredictionProb] = useState<number | null>(null);

  // debug!: state to track if weighted similarity is enabled 
  const [isWeighted, setIsWeighted] = useState(true);

  // this function runs when you click "Get Recommendations"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRecommendations([]);
    setPredictionProb(null);

    // example: "jazz, pop" -> ["jazz", "pop"]
    const tagsList = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    try {
      // fetch call talks to the python backend 
      const res = await fetch('http://127.0.0.1:8000/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // sending the data exactly how app.py expects it
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

      // handles the response
      if (data.message) {
        // this handles the "Low Confidence" case logic returns
        setError(`Message from Model: ${data.message}`);
      } else {
        setPredictionProb(data.prediction_probability);
        setRecommendations(data.recommendations);
      }
    // funny message
    } catch (err) {
      setError('Failed to connect to backend. Is uvicorn running? Thought so.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-950 text-gray-100">
      <div className="z-10 w-full max-w-2xl items-center justify-between font-mono text-sm">
        
        {/* header section */}
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
          FullCircle Recs
        </h1>
        
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* artist input */}
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

            {/* tags input (manual for now, automated later!) */}
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

            {/* weighted similarity toggle (feature I edited in post prod!) */}
            <div className="pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isWeighted}
                        onChange={(e) => setIsWeighted(e.target.checked)}
                        className="form-checkbox h-5 w-5 text-green-600 rounded border-gray-600 bg-gray-700 transition duration-150 ease-in-out"
                    />
                    <span className="text-sm text-gray-300 select-none">
                        **Enable Weighted Tag Similarity** (Prioritizes niche/rare tags like `-bit`)
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

        {/* error display */}
        {error && (
          <div className="mt-6 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
            {error}
          </div>
        )}

        {/* success display */}
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