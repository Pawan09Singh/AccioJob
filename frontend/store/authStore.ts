import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import apiClient from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      loading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.login({ email, password });
          apiClient.setAuthToken(response.token);
          set({
            user: response.user,
            token: response.token,
            loading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.error || error.message || 'Login failed',
          });
          throw error;
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.register({ email, password, name });
          apiClient.setAuthToken(response.token);
          set({
            user: response.user,
            token: response.token,
            loading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.error || error.message || 'Registration failed',
          });
          throw error;
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          await apiClient.logout();
        } catch (error) {
          // Even if logout fails on server, clear local state
          console.error('Logout error:', error);
        } finally {
          apiClient.clearAuthToken();
          set({
            user: null,
            token: null,
            loading: false,
            error: null,
          });
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      setToken: (token: string) => {
        apiClient.setAuthToken(token);
        set({ token });
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ user: null, loading: false });
          return;
        }

        set({ loading: true });
        try {
          const user = await apiClient.getProfile();
          set({ user, loading: false });
        } catch (error) {
          // Token is invalid, clear auth state
          apiClient.clearAuthToken();
          set({
            user: null,
            token: null,
            loading: false,
            error: null,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
); 