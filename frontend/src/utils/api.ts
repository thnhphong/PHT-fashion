const rawHost = (import.meta.env.VITE_API_URL ?? 'http://localhost:5001').replace(/\/$/, '');
const hostWithoutApi = rawHost.endsWith('/api') ? rawHost.slice(0, -4) : rawHost;
const API_ROOT = `${hostWithoutApi}/api`;

export const apiUrl = (path: string) => {
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_ROOT}${trimmedPath}`;
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

export const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};
