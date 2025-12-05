const LASTFM_API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY;
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

export interface LastFmTag {
  name: string;
  count: number;
  url: string;
}

export interface LastFmArtist {
  name: string;
  mbid?: string;
  url: string;
  image?: { '#text': string; size: string }[];
}

/**
 * these next lines just mean I can finally use the lastfm api I worked so hard for, i'll probably limit test it
 */
export async function getArtistTags(artistName: string): Promise<string[]> {
  try {
    const params = new URLSearchParams({
      method: 'artist.gettoptags',
      artist: artistName,
      api_key: LASTFM_API_KEY || '',
      format: 'json',
    });

    const response = await fetch(`${BASE_URL}?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch from Last.fm');
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.message || 'Artist not found');
    }

    // error codes are something you see a lot in my code mb 
    const tags: LastFmTag[] = data.toptags?.tag || [];
    
    const filteredTags = tags
      .filter(tag => {
        const name = tag.name.toLowerCase();
        // filter out overly generic tags that show up a lot
        const genericTags = ['seen live', 'favorite', 'favorites', 'love', 'awesome', 'cool', 'good'];
        return !genericTags.includes(name) && tag.count > 0;
      })
      .slice(0, 10)
      .map(tag => tag.name.toLowerCase());

    return filteredTags;
  } catch (error) {
    console.error('Last.fm API error:', error);
    return [];
  }
}

export async function searchArtists(query: string): Promise<LastFmArtist[]> {
  try {
    const params = new URLSearchParams({
      method: 'artist.search',
      artist: query,
      api_key: LASTFM_API_KEY || '',
      format: 'json',
      limit: '5',
    });

    const response = await fetch(`${BASE_URL}?${params}`);
    const data = await response.json();

    return data.results?.artistmatches?.artist || [];
  } catch (error) {
    console.error('Last.fm search error:', error);
    return [];
  }
}