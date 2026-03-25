import axios from 'axios';
import { apiUrl } from './api';
import { getAccessToken } from './auth';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: 'customer' | 'admin';
  avatar?: string;
  created_at: Date;
}

// Fetch current user from backend using access token
export const fetchCurrentUser = async (): Promise<User | null> => {
  try {
    const token = getAccessToken();
    if (!token) return null;

    const response = await axios.get<User>(apiUrl('/users/me'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
};

// Create axios interceptor to add token to all requests
export const setupAxiosInterceptors = () => {
  axios.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle 401 errors
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
};