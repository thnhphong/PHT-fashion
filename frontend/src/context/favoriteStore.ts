import { createContext } from 'react';

export interface FavoriteContextType {
  favorites: string[];
  addFavorite: (productId: string) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  mergeGuestFavorites: () => Promise<void>;
  clearLocalFavorites: () => void;
}

export const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);
