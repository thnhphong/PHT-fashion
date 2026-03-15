import { useEffect, useState, type ReactNode } from 'react';
import { FavoriteContext, type FavoriteContextType } from './favoriteStore';
import { apiUrl } from '../utils/api';
import { isAuthenticated, getAccessToken } from '../utils/auth';

const STORAGE_KEY = 'pht_favorites';

export const FavoriteProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (!isAuthenticated()) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? (JSON.parse(stored) as string[]) : [];
      } catch (err) {
        console.error('Failed to read favorites:', err);
        return [];
      }
    }
    return [];
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch favorites from API on load if authenticated
  useEffect(() => {
    let isMounted = true;
    const fetchFavorites = async () => {
      if (isAuthenticated()) {
        try {
          const res = await fetch(apiUrl('/favorites'), {
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data.productIds) {
              setFavorites(data.productIds);
            }
          }
        } catch (err) {
          console.error('Failed to fetch favorites:', err);
        }
      }
      if (isMounted) setIsInitialized(true);
    };

    fetchFavorites();
    return () => { isMounted = false; };
  }, []);

  // Persist to localStorage for guests
  useEffect(() => {
    if (isInitialized && !isAuthenticated()) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      } catch (err) {
        console.error('Failed to save favorites:', err);
      }
    }
  }, [favorites, isInitialized]);

  const addFavorite = async (productId: string) => {
    if (isAuthenticated()) {
      try {
        await fetch(apiUrl(`/favorites/${productId}`), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        });
      } catch (err) {
        console.error('Failed to add favorite API:', err);
      }
    }
    setFavorites((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
  };

  const removeFavorite = async (productId: string) => {
    if (isAuthenticated()) {
      try {
        await fetch(apiUrl(`/favorites/${productId}`), {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        });
      } catch (err) {
        console.error('Failed to remove favorite API:', err);
      }
    }
    setFavorites((prev) => prev.filter((id) => id !== productId));
  };

  const mergeGuestFavorites = async () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const guestFavs = JSON.parse(saved);
      if (guestFavs.length === 0) return;

      const res = await fetch(apiUrl('/favorites/merge'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ productIds: guestFavs }),
      });

      if (res.ok) {
        localStorage.removeItem(STORAGE_KEY);
        // Refresh favorites from API after merge
        const updatedRes = await fetch(apiUrl('/favorites'), {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        });
        if (updatedRes.ok) {
          const data = await updatedRes.json();
          if (data.productIds) {
            setFavorites(data.productIds);
          }
        }
      }
    } catch (err) {
      console.error('Failed to merge guest favorites', err);
    }
  };

  const clearLocalFavorites = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFavorites([]);
  };

  const value: FavoriteContextType = {
    favorites,
    addFavorite,
    removeFavorite,
    mergeGuestFavorites,
    clearLocalFavorites,
  };

  return <FavoriteContext.Provider value={value}>{children}</FavoriteContext.Provider>;
};
