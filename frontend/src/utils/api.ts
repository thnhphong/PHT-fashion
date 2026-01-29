const rawHost = (import.meta.env.VITE_API_URL ?? 'http://localhost:5001').replace(/\/$/, '');
const hostWithoutApi = rawHost.endsWith('/api') ? rawHost.slice(0, -4) : rawHost;
const API_ROOT = `${hostWithoutApi}/api`;

export const apiUrl = (path: string) => {
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_ROOT}${trimmedPath}`;
};

