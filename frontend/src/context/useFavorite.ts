import { useContext } from 'react';
import { FavoriteContext, type FavoriteContextType } from './favoriteStore';

export const useFavorite = (): FavoriteContextType => {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error('useFavorite must be used within FavoriteProvider');
  }
  return context;
};
