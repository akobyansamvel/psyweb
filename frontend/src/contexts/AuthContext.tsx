import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Types
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  // Set up axios interceptor for authentication
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Adding token to request:', config.url, token.substring(0, 20) + '...');
        } else {
          console.log('No token available for request:', config.url);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]);

  useEffect(() => {
    if (token) {
      // Проверяем валидность токена
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      console.log('Checking auth status with token:', token);
      const response = await axios.get('/api/users/profile/');
      console.log('Auth check successful:', response.data);
      setUser(response.data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Attempting login for:', username);
      const response = await axios.post('/api/auth/login/', {
        username,
        password
      });
      
      console.log('Login response:', response.data);
      const { tokens, user } = response.data;
      const { access, refresh } = tokens;
      
      setToken(access);
      setUser(user);
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      
      console.log('Login successful, user set:', user);
      console.log('Token set:', access.substring(0, 20) + '...');
      console.log('isAuthenticated will be:', !!user && !!access);
      return { success: true };
    } catch (error: any) {
      console.error('Login failed:', error.response?.data || error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.response?.data?.error || 'Ошибка авторизации' 
      };
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Attempting registration for:', userData.username);
      const response = await axios.post('/api/auth/register/', userData);
      
      console.log('Registration response:', response.data);
      const { tokens, user } = response.data;
      const { access, refresh } = tokens;
      
      setToken(access);
      setUser(user);
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      
      console.log('Registration successful, user set:', user);
      return { success: true };
    } catch (error: any) {
      console.error('Registration failed:', error.response?.data || error);
      return { 
        success: false, 
        error: error.response?.data || 'Ошибка регистрации' 
      };
    }
  };

  const logout = (): void => {
    console.log('Logging out user');
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
