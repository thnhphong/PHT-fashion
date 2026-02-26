
const SHIPPING_COSTS: Record<'standard' | 'express' | 'next_day', number> = {
  standard: 0,
  express: 9.99,
  next_day: 19.99,
};

const TAX_RATE = 0.08; // 8%
const DEFAULT_SIZE_LABEL = 'ONE_SIZE';

const normalizeSize = (size?: string) => (size ? size.trim().toUpperCase() : undefined);

const generateOrderNumber = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `PHT-${random}`;
};

export { SHIPPING_COSTS, TAX_RATE, DEFAULT_SIZE_LABEL, normalizeSize, generateOrderNumber };
