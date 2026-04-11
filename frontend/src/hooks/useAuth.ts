import { api, publicApi } from "../api/apiClient";
import { endpoints } from "../config/endpoints";
import { useAuthStore } from "../store/useAuthStore";

interface UserProfile {
  public_id: string;
  email: string;
  full_name: string;
}

export const useAuth = () => {
  const {
    accessToken,
    user,
    isInitializing,
    setAuth,
    clearAuth,
    setInitializing,
  } = useAuthStore();

  const isAuthenticated = !!accessToken;

  const login = async (access: string, profile: UserProfile) => {
    setAuth(access, profile);
  };

  const logout = async () => {
    try {
      await api.post(endpoints.LOGOUT);
    } finally {
      clearAuth();
    }
  };

  const initialize = async () => {
    // If we already have a session in memory, don't trigger refresh/me again
    if (accessToken && user) {
      setInitializing(false);
      return;
    }

    try {
      // try refresh
      const { data: refreshData } = await publicApi.post(endpoints.REFRESH);

      // fetch user profile with the new access token
      const { data: userData } = await api.get(endpoints.ME, {
        headers: { Authorization: `Bearer ${refreshData.access}` },
      });

      // update auth details in memory
      setAuth(refreshData.access, userData);
    } catch (err) {
      console.error("Initialization failed:", err);
      clearAuth();
    }
  };

  return {
    isAuthenticated,
    user,
    isInitializing,
    login,
    logout,
    initialize,
  };
};
