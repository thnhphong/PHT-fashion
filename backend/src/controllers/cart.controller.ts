import { Request, Response } from 'express';
import * as cartService from '../services/cart.service';

export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const cart = await cartService.getCart(userId as string);
    return res.json(cart);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const addItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { productId, size, quantity } = req.body;
    const cart = await cartService.addItem(userId as string, productId, size, quantity);
    return res.status(201).json(cart);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { productId } = req.params;
    const { size, quantity } = req.body;
    const cart = await cartService.updateItem(userId as string, productId as string, size as string, quantity);
    return res.json(cart);
  } catch (error: any) {
    if (error.message === 'Cart not found' || error.message === 'Item not found in cart') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const removeItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { productId } = req.params;
    const { size } = req.body;
    const cart = await cartService.removeItem(userId as string, productId as string, size as string);
    return res.json(cart);
  } catch (error: any) {
    if (error.message === 'Cart not found') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    await cartService.clearCart(userId as string);
    return res.json({ message: 'Cart cleared' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const mergeCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { items } = req.body;
    const cart = await cartService.mergeCart(userId as string, items);
    return res.json(cart);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
