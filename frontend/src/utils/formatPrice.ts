export const formatPrice = (price: number, locale: string = 'vi-VN') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
};
