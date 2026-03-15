import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  size: z.string().min(1, 'Size is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const updateCartItemSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const removeCartItemSchema = z.object({
  size: z.string().min(1, 'Size is required'),
});

export const mergeCartSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      size: z.string().min(1),
      quantity: z.number().int().min(1),
    })
  ),
});
