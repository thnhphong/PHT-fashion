import { Request, Response } from 'express';
import * as favoriteService from '../services/favorite.service';

const toProductIdStrings = (fav: { productIds?: unknown[] } | null | undefined): string[] =>
  (fav?.productIds ?? []).map((p: unknown) =>
    p && typeof p === 'object' && '_id' in p ? String((p as { _id: unknown })._id) : String(p)
  ).filter(Boolean);

export const getFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const fav = await favoriteService.getFavorites(userId as string);
    return res.json({ productIds: toProductIdStrings(fav) });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ message: msg });
  }
};

export const addFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { productId } = req.params;
    const fav = await favoriteService.addFavorite(userId as string, productId as string);
    return res.status(201).json({ productIds: toProductIdStrings(fav) });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ message: msg });
  }
};

export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { productId } = req.params;
    const fav = await favoriteService.removeFavorite(userId as string, productId as string);
    return res.json({ productIds: toProductIdStrings(fav) });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Favorites not found') {
      return res.status(404).json({ message: error.message });
    }
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ message: msg });
  }
};

export const mergeFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { productIds = [] } = req.body;
    const fav = await favoriteService.mergeFavorites(userId as string, Array.isArray(productIds) ? productIds : []);
    return res.json({ productIds: toProductIdStrings(fav) });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ message: msg });
  }
};
