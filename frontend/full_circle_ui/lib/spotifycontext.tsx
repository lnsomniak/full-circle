'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  isLoggedIn,
  logout as spotifyLogout,
  getCurrentUser,
  getTopArtists,
  SpotifyUser,
  SpotifyArtist,
} from '@/lib/spotify';
/// so pretty how i have it btw whoever is reading this should compliment me on my instagram abt this code i'm not kidding
interface SpotifyContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: SpotifyUser | null;
  topArtists: SpotifyArtist[];
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

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

       const minDelay = new Promise(resolve => setTimeout(resolve, 2500));
      // 2.5 second loading time becauase i put a lot of effort into it and this is the average. 
      if (isLoggedIn()) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
          const artistsData = await getTopArtists('medium_term', 50);
          setTopArtists(artistsData.items);
        } catch (error) {
          console.error('Failed to load user data:', error);
          spotifyLogout();
          setIsAuthenticated(false);
        }
      }
      
  //red stop sign
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