import { createContext } from 'react';

export interface FavoriteContextType {
  favorites: string[];
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
}

export const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);
