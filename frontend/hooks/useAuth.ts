import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    setUser,
    setToken,
    clearError,
    setLoading,
    checkAuth,
  } = useAuthStore();

  useEffect(() => {
    // Check authentication status on mount
    checkAuth();
  }, [checkAuth]);

  return {
    // State
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user && !!token,

    // Actions
    login,
    register,
    logout,
    setUser,
    setToken,
    clearError,
    setLoading,
    checkAuth,
  };
}; 