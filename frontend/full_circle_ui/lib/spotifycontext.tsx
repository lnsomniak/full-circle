'use client';
import { saveUser, saveUserArtists } from '@/lib/supabase';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  isLoggedIn,
  logout as spotifyLogout,
  getCurrentUser,
  getTopArtists,
  SpotifyUser,
  SpotifyArtist,
  getArtistTopAlbums,
} from '@/lib/spotify';
/// so pretty how i have it btw whoever is reading this should compliment me on my instagram abt this code i'm not kidding
interface SpotifyContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: SpotifyUser | null;
  topArtists: SpotifyArtist[];
  topAlbumArts: string[];
  logout: () => void;
  refreshData: () => Promise<void>;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

interface SpotifyProviderProps {
  children: ReactNode;
}

export function SpotifyProvider({ children }: SpotifyProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);
  const [topAlbumArts, setTopAlbumArts] = useState<string[]>([]);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      const minDelay = new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds though could go up

      if (isLoggedIn()) {
        try {
          const [userData, artistsData] = await Promise.all([
            getCurrentUser(),
            getTopArtists('medium_term', 50)
          ]);  

          setUser(userData);
          setIsAuthenticated(true);
          setTopArtists(artistsData.items);

          const albumFetchPromise = (async () => {
            const albumArts: string[] = [];

            const albumPromises = artistsData.items.slice(0,5).map(artist =>
              getArtistTopAlbums(artist.id)
            );
            const allAlbums = await Promise.all(albumPromises);
            
            allAlbums.forEach(albums => {
              albums.forEach(album => {
                if (album.image && albumArts.length < 50) {
                  albumArts.push(album.image);
                }
              });
            });
            return albumArts;
          })();

          const albumArts = await albumFetchPromise;
          setTopAlbumArts(albumArts);
          console.log ('Album Arts fetched:', albumArts.length);

          saveUser(userData);
          await saveUserArtists(userData.id, artistsData.items, 'medium_term');
          console.log('✅ User data succesfully saved to database!!!!!!!!!!!!!!!!!!!');
        } catch (error) {
          console.error('failed to load user data:', error);
          spotifyLogout();
          setIsAuthenticated(false);
        }
      }
      await minDelay;
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const logout = () => {
    spotifyLogout();
    setIsAuthenticated(false);
    setUser(null);
    setTopArtists([]);
    setTopAlbumArts([]);
  };

  const refreshData = async () => {
    if (!isAuthenticated) return;

    try {
      const [userData, artistsData] = await Promise.all([
        getCurrentUser(),
        getTopArtists('medium_term', 50),
      ]);
      
      setUser(userData);
      setTopArtists(artistsData.items);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  return (
    <SpotifyContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        topArtists,
        topAlbumArts,
        logout,
        refreshData,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotify() {
  const context = useContext(SpotifyContext);
  
  if (context === undefined) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
}