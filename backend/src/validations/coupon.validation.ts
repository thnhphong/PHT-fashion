import { z } from 'zod';

const baseCouponSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().min(0),
  scope: z.enum(['all', 'product', 'category']),
  productIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  usage_limit: z.number().int().min(0),
  expiration_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
});

export const createCouponSchema = baseCouponSchema.refine((data) => {
  if (data.scope === 'product' && (!data.productIds || data.productIds.length === 0)) {
    return false;
  }
  if (data.scope === 'category' && (!data.categoryIds || data.categoryIds.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Product IDs or Category IDs are required for the selected scope',
  path: ['productIds'],
});

export const updateCouponSchema = baseCouponSchema.partial();
