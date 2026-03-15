import { useEffect, useState, type ReactNode } from 'react';
import { FavoriteContext, type FavoriteContextType } from './favoriteStore';
import { apiUrl } from '../utils/api';
import { isAuthenticated, getAccessToken } from '../utils/auth';

const STORAGE_KEY = 'pht_favorites';

export const FavoriteProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch (err) {
      console.error('Failed to read favorites:', err);
      return [];
    }
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // On load: fetch from DB when logged in (merge with localStorage), else load from localStorage
  useEffect(() => {
    let isMounted = true;
    const fetchFavorites = async () => {
      if (isAuthenticated()) {
        try {
          const res = await fetch(apiUrl('/favorites'), {
            headers: { Authorization: `Bearer ${getAccessToken()}` },
          });
          if (res.ok) {
            const data = await res.json();
            const apiIds = (data.productIds ?? []) as string[];
            const localIds = (() => {
              try {
                const s = localStorage.getItem(STORAGE_KEY);
                return s ? (JSON.parse(s) as string[]) : [];
              } catch {
                return [];
              }
            })();
            const merged = [...new Set([...apiIds, ...localIds])];
            if (isMounted) setFavorites(merged);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          }
        } catch (err) {
          console.error('Failed to fetch favorites:', err);
          const s = localStorage.getItem(STORAGE_KEY);
          if (isMounted && s) setFavorites(JSON.parse(s) as string[]);
        }
      } else {
        const s = localStorage.getItem(STORAGE_KEY);
        if (isMounted) setFavorites(s ? (JSON.parse(s) as string[]) : []);
      }
      if (isMounted) setIsInitialized(true);
    };

    fetchFavorites();
    window.addEventListener('auth-token-set', fetchFavorites);
    return () => {
      isMounted = false;
      window.removeEventListener('auth-token-set', fetchFavorites);
    };
  }, []);

  // Persist to localStorage for both guest and logged-in
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      } catch (err) {
        console.error('Failed to save favorites:', err);
      }
    }
  }, [favorites, isInitialized]);

  const addFavorite = async (productId: string) => {
    setFavorites((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
  };

  const removeFavorite = async (productId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== productId));
  };

  const syncFavoritesToDbOnLogout = async () => {
    if (!isAuthenticated()) return;
    const token = getAccessToken();
    if (!token) return;
    if (favorites.length === 0) return;
    try {
      await fetch(apiUrl('/favorites/merge'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds: favorites }),
      });
    } catch (err) {
      console.error('Failed to sync favorites on logout', err);
    }
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
    syncFavoritesToDbOnLogout,
  };

  return <FavoriteContext.Provider value={value}>{children}</FavoriteContext.Provider>;
};
