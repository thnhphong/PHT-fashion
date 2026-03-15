import { Request, Response } from 'express';
import * as favoriteService from '../services/favorite.service';

export const getFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const favorites = await favoriteService.getFavorites(userId as string);
    return res.json(favorites);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const addFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { productId } = req.params;
    const favorites = await favoriteService.addFavorite(userId as string, productId as string);
    return res.status(201).json(favorites);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { productId } = req.params;
    const favorites = await favoriteService.removeFavorite(userId as string, productId as string);
    return res.json(favorites);
  } catch (error: any) {
    if (error.message === 'Favorites not found') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const mergeFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { productIds } = req.body;
    const favorites = await favoriteService.mergeFavorites(userId as string, productIds);
    return res.json(favorites);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
