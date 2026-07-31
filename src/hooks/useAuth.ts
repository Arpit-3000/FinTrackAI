import { useAuthStore } from '../store';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    setLoading,
    logout,
  };
};
