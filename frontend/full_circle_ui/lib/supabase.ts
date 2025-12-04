
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =============================================
// this is a database i'm using supabase for to add storage, postgre, and more. 
// =============================================

export async function saveUser(spotifyUser: {
  id: string;
  display_name: string;
  email: string;
  images?: { url: string }[];
}) {
  console.log('🔄 Attempting to save user:', spotifyUser.id);
  
  const { data, error } = await supabase
    .from('users')
    .upsert({
      spotify_id: spotifyUser.id,
      display_name: spotifyUser.display_name,
      email: spotifyUser.email,
      profile_image: spotifyUser.images?.[0]?.url || null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'spotify_id'
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error saving user:', error);
  } else {
    console.log('✅ User saved:', data);
  }
  
  return data;
}

// Save user's top artists
export async function saveUserArtists(
  userId: string,
  artists: {
    id: string;
    name: string;
    genres: string[];
    popularity: number;
    images?: { url: string }[];
  }[],
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
) {
  // First get the user's UUID from spotify_id
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('spotify_id', userId)
    .single();

  if (!user) return null;

  const artistRows = artists.map((artist, index) => ({
    user_id: user.id,
    spotify_artist_id: artist.id,
    artist_name: artist.name,
    genres: artist.genres,
    popularity: artist.popularity,
    image_url: artist.images?.[2]?.url || artist.images?.[0]?.url || null,
    time_range: timeRange,
    rank: index + 1,
    captured_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('user_artists')
    .upsert(artistRows, {
      onConflict: 'user_id,spotify_artist_id,time_range'
    });

  if (error) console.error('Error saving artists:', error);
  return data;
}

// Save feedback on a recommendation
export async function saveFeedback(
  spotifyUserId: string,
  feedback: {
    inputArtist: string;
    inputTags: string[];
    recommendedArtist: string;
    recommendationRank: number;
    rating: 1 | -1; // 1 = thumbs up, -1 = thumbs down
    weightedSimilarity: boolean;
    predictionConfidence: number;
  }
) {
  // Get user UUID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('spotify_id', spotifyUserId)
    .single();

  if (!user) return null;

  const { data, error } = await supabase
    .from('feedback')
    .insert({
      user_id: user.id,
      input_artist: feedback.inputArtist,
      input_tags: feedback.inputTags,
      recommended_artist: feedback.recommendedArtist,
      recommendation_rank: feedback.recommendationRank,
      rating: feedback.rating,
      weighted_similarity: feedback.weightedSimilarity,
      prediction_confidence: feedback.predictionConfidence,
    });

  if (error) console.error('Error saving feedback:', error);
  return data;
}

// Get all feedback for training data export
export async function getAllFeedback() {
  const { data, error } = await supabase
    .from('feedback')
    .select(`
      *,
      users (spotify_id, display_name)
    `)
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching feedback:', error);
  return data;
}