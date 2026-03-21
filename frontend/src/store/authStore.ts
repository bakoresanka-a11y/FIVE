import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionToken: string | null;
  setUser: (user: User | null) => void;
  setSessionToken: (token: string | null) => Promise<void>;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  exchangeSession: (sessionId: string) => Promise<User | null>;
  login: (email: string, password: string) => Promise<User | null>;
  register: (email: string, password: string, name: string, username?: string) => Promise<User | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  sessionToken: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setSessionToken: async (token) => {
    if (token) {
      await AsyncStorage.setItem('session_token', token);
    } else {
      await AsyncStorage.removeItem('session_token');
    }
    set({ sessionToken: token });
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const token = await AsyncStorage.getItem('session_token');
      
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        set({ user, isAuthenticated: true, sessionToken: token, isLoading: false });
      } else {
        await AsyncStorage.removeItem('session_token');
        set({ user: null, isAuthenticated: false, sessionToken: null, isLoading: false });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  exchangeSession: async (sessionId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem('session_token', data.session_token);
        set({ 
          user: data.user, 
          isAuthenticated: true, 
          sessionToken: data.session_token,
          isLoading: false 
        });
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Session exchange failed:', error);
      return null;
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem('session_token', data.session_token);
        set({ 
          user: data.user, 
          isAuthenticated: true, 
          sessionToken: data.session_token,
          isLoading: false 
        });
        return data.user;
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  register: async (email: string, password: string, name: string, username?: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, username }),
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem('session_token', data.session_token);
        set({ 
          user: data.user, 
          isAuthenticated: true, 
          sessionToken: data.session_token,
          isLoading: false 
        });
        return data.user;
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      await AsyncStorage.removeItem('session_token');
      set({ user: null, isAuthenticated: false, sessionToken: null });
    }
  },
}));
