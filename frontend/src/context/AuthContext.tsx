import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { logOut, isAuthenticated, setLoginFlag } from '../utils/auth';
import apiClient from '../utils/apiClient';
import { apiUrl } from '../utils/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: 'customer' | 'admin';
  avatar?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Check login flag instead of token (token is in httpOnly cookie)
      if (isAuthenticated()) {
        try {
          const response = await apiClient.get<User>(apiUrl('/users/me'));
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
          console.error('Failed to fetch user:', error);
          logOut();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post<{ user: User }>(apiUrl('/auth/login'), {
      email,
      password,
    });

    const { user: userData } = response.data;
    setLoginFlag();
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await apiClient.post(apiUrl('/auth/logout'));
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logOut();
      setUser(null);
      window.location.href = '/login';
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    const response = await apiClient.put<{ user: User }>(apiUrl('/users/me'), data);
    setUser(response.data.user);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    await apiClient.put(apiUrl('/auth/change-password'), {
      oldPassword,
      newPassword,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
