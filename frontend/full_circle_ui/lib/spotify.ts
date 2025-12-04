const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI!;

// Scopes define what data I can steal from you 
// https://developer.spotify.com/documentation/web-api/concepts/scopes
const SCOPES = [
  'user-read-private',           // Read user's subscription details
  'user-read-email',             // rEad user's email
  'user-top-read',               // reAd user's top artists and tracks
  'user-library-read',           // reaD user's saved tracks/albums
  'user-read-recently-played',   // Read recently played tracks 
].join(' ');

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64encode(input: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const hashed = await sha256(codeVerifier);
  return base64encode(hashed);
}

export async function loginWithSpotify(): Promise<void> {
  const codeVerifier = generateRandomString(64);
  localStorage.setItem('spotify_code_verifier', codeVerifier);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    show_dialog: 'true', // this is a testing feauture for the most part nothing about this linen is needed i am so tired my GOD.
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}


export async function handleCallback(code: string): Promise<SpotifyTokens> {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');
  
  if (!codeVerifier) {
    throw new Error('No code verifier found. Please try logging in again.');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to exchange code for tokens');
  }

  const tokens: SpotifyTokens = await response.json();
  
  localStorage.setItem('spotify_access_token', tokens.access_token);
  localStorage.setItem('spotify_refresh_token', tokens.refresh_token);
  localStorage.setItem('spotify_token_expiry', String(Date.now() + tokens.expires_in * 1000));
  

  localStorage.removeItem('spotify_code_verifier');

  return tokens;
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('spotify_refresh_token');
  
  if (!refreshToken) {
    throw new Error('No refresh token found. Please log in again.');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    logout();
    throw new Error('Session expired. Please log in again.');
  }

  const data = await response.json();
  
  localStorage.setItem('spotify_access_token', data.access_token);
  localStorage.setItem('spotify_token_expiry', String(Date.now() + data.expires_in * 1000));
  
  if (data.refresh_token) {
    localStorage.setItem('spotify_refresh_token', data.refresh_token);
  }

  return data.access_token;
}

export async function getAccessToken(): Promise<string | null> {
  const token = localStorage.getItem('spotify_access_token');
  const expiry = localStorage.getItem('spotify_token_expiry');

  if (!token) return null;

  if (expiry && Date.now() > parseInt(expiry) - 60000) {
    try {
      return await refreshAccessToken();
    } catch {
      return null;
    }
  }

  return token;
}


export function isLoggedIn(): boolean {
  return !!localStorage.getItem('spotify_access_token');
}

export function logout(): void {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_token_expiry');
  localStorage.removeItem('spotify_code_verifier');
}


/**
 * YAWNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN
 */
export async function getCurrentUser(): Promise<SpotifyUser> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not logged in');

  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Failed to fetch user profile');
  return response.json();
}

/**
 * YAWNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN
 */
export async function getTopArtists(
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
  limit: number = 20
): Promise<SpotifyTopArtistsResponse> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not logged in');

  const params = new URLSearchParams({
    time_range: timeRange,
    limit: String(limit),
  });

  const response = await fetch(
    `https://api.spotify.com/v1/me/top/artists?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) throw new Error('Failed to fetch top artists');
  return response.json();
}

export async function getTopTracks(
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
  limit: number = 20
): Promise<SpotifyTopTracksResponse> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not logged in');

  const params = new URLSearchParams({
    time_range: timeRange,
    limit: String(limit),
  });

  const response = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) throw new Error('Failed to fetch top tracks');
  return response.json();
}

export async function getRecentlyPlayed(limit: number = 50): Promise<SpotifyRecentlyPlayedResponse> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not logged in');

  const response = await fetch(
    `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) throw new Error('Failed to fetch recently played');
  return response.json();
}

export async function searchArtist(query: string): Promise<SpotifySearchResponse> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not logged in');

  const params = new URLSearchParams({
    q: query,
    type: 'artist',
    limit: '5',
  });

  const response = await fetch(
    `https://api.spotify.com/v1/search?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) throw new Error('Failed to search artists');
  return response.json();
}

export interface SpotifyTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: { url: string; height: number; width: number }[];
  followers: { total: number };
  country: string;
  product: string; // 'premium' | 'free' etc
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  images: { url: string; height: number; width: number }[];
  followers: { total: number };
  external_urls: { spotify: string };
}
/* god typing these out is so boring why would I do this to myself */
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: {
    id: string;
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  popularity: number;
  duration_ms: number;
}

export interface SpotifyTopArtistsResponse {
  items: SpotifyArtist[];
  total: number;
  limit: number;
  offset: number;
}

export interface SpotifyTopTracksResponse {
  items: SpotifyTrack[];
  total: number;
  limit: number;
  offset: number;
}

export interface SpotifyRecentlyPlayedResponse {
  items: {
    track: SpotifyTrack;
    played_at: string;
  }[];
}

export interface SpotifySearchResponse {
  artists: {
    items: SpotifyArtist[];
  };
}