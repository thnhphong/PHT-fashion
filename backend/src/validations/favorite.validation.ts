import { z } from 'zod';

export const mergeFavoritesSchema = z.object({
  productIds: z.array(z.string().min(1)).default([]),
});
