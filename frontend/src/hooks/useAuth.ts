import { useCallback } from "react";
import { api, publicApi } from "../api/apiClient";
import { endpoints } from "../config/endpoints";
import { type UserProfile, useAuthStore } from "../store/useAuthStore";

export const useAuth = () => {
  const { accessToken, user, isInitializing, setAuth, clearAuth } =
    useAuthStore();

  const isAuthenticated = !!accessToken;

  const login = (access: string, profile: UserProfile) => {
    setAuth(access, profile);
  };

  const logout = async () => {
    try {
      await api.post(endpoints.LOGOUT);
    } finally {
      clearAuth();
    }
  };

  const initialize = useCallback(async () => {
    const { accessToken, user, setAuth, clearAuth, setInitializing } =
      useAuthStore.getState();

    // If session in memory, don't trigger refresh/me again
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
  }, []);

  return {
    isAuthenticated,
    user,
    isInitializing,
    login,
    logout,
    initialize,
  };
};
