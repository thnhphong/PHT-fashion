import { apiUrl } from './api';

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(apiUrl('/auth/refresh-token'), {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    // Token is now in cookie, just return the cookie value
    return getCookie('accessToken');
  } catch {
    return null;
  }
};
// Utility to decode and validate JWT tokens client-side
interface JWTPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Decode JWT token (client-side only - does not verify signature)
 * For security: Always verify token on backend
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Get access token from cookie (httpOnly)
 */
export const getAccessToken = (): string | null => {
  return getCookie('accessToken');
};

/**
 * Get refresh token from cookie (httpOnly)
 */
export const getRefreshToken = (): string | null => {
  return getCookie('refreshToken');
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  // exp is in seconds, Date.now() is in milliseconds
  return decoded.exp * 1000 < Date.now();
};

/**
 * Get user information from access token
 * Returns null if token is missing or expired
 */
export const getUserFromToken = (): JWTPayload | null => {
  const token = getAccessToken();
  if (!token) return null;

  if (isTokenExpired(token)) {
    // Token expired, clear storage
    logOut();
    return null;
  }

  return decodeToken(token);
};

/**
 * Clear all auth tokens from cookies and localStorage
 */
export const logOut = (): void => {
  // Clear cookies
  document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
  document.cookie = 'refreshToken=; path=/api/auth; expires=Thu, 01 Jan 1970 00:00:00 GMT;';

  // Clear localStorage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('isLoggedIn');
  
  // Also clear fashion related guest data
  localStorage.removeItem('pht_cart');
  localStorage.removeItem('pht_favorites');
  localStorage.removeItem('pht_guest_session_at');

  // Dispatch event so context providers can reset
  window.dispatchEvent(new CustomEvent('auth-token-set'));
};

/**
 * Check if user is authenticated (by checking login flag in localStorage)
 * Note: Actual token is in httpOnly cookie, not accessible by JS
 */
export const isAuthenticated = (): boolean => {
  return localStorage.getItem('isLoggedIn') === 'true';
};

/**
 * Set login flag (called after successful login)
 * This indicates user has valid tokens in cookies
 */
export const setLoginFlag = (): void => {
  localStorage.setItem('isLoggedIn', 'true');
  window.dispatchEvent(new CustomEvent('auth-token-set'));
};

/**
 * Clear login flag (called on logout)
 */
export const clearLoginFlag = (): void => {
  localStorage.removeItem('isLoggedIn');
};

/**
 * Set tokens in localStorage (called after login/register)
 * Kept for backward compatibility but now just sets login flag
 */
export const setTokens = (_accessToken: string, _refreshToken: string): void => {
  setLoginFlag();
};