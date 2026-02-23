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
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
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
 * Clear all auth tokens from localStorage
 */
export const logOut = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // Remove old insecure user storage if it exists
  localStorage.removeItem('user');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  return token !== null && !isTokenExpired(token);
};

/**
 * Set tokens in localStorage (called after login/register)
 */
export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};