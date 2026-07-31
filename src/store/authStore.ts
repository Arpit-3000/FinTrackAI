import { create } from 'zustand';
import { User } from '../types';
import { authService } from '../services';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User, token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user, error: null });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  login: async (user, token, refreshToken) => {
    try {
      await authService.saveTokens(token, refreshToken);
      await authService.saveUserData(user);
      set({ 
        user, 
        isAuthenticated: true, 
        error: null,
        isLoading: false 
      });
    } catch (error) {
      console.error('Login store error:', error);
      set({ error: 'Failed to save login data' });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await authService.logout();
      set({ 
        user: null, 
        isAuthenticated: false, 
        error: null,
        isLoading: false 
      });
    } catch (error) {
      console.error('Logout error:', error);
      set({ isLoading: false });
    }
  },

  initialize: async () => {
    try {
      set({ isLoading: true });
      
      const authData = await authService.initializeAuth();
      
      if (authData) {
        set({ 
          user: authData.user, 
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false 
        });
      } else {
        set({ 
          user: null, 
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Initialize auth error:', error);
      set({ 
        user: null, 
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false,
        error: 'Failed to initialize authentication' 
      });
    }
  },

  updateUser: (user) => {
    set({ user });
    authService.saveUserData(user);
  },
}));
