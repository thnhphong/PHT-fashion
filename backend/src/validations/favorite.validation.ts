import { z } from 'zod';

export const mergeFavoritesSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1, 'At least one product ID is required'),
});
