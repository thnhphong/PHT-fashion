import { useEffect, useState, type ReactNode } from 'react';
import { FavoriteContext, type FavoriteContextType } from './favoriteStore';

const STORAGE_KEY = 'favorite';

export const FavoriteProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch (err) {
      console.error('Failed to read favorites:', err);
      return [];
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (err) {
      console.error('Failed to save favorites:', err);
    }
  }, [favorites]);

  const addFavorite = (productId: string) => {
    setFavorites((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
  };

  const removeFavorite = (productId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== productId));
  };

  const value: FavoriteContextType = {
    favorites,
    addFavorite,
    removeFavorite,
  };

  return <FavoriteContext.Provider value={value}>{children}</FavoriteContext.Provider>;
};