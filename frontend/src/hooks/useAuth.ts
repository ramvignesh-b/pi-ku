import { useCallback } from "react";
import { api, publicApi } from "../api/apiClient";
import { endpoints } from "../config/endpoints";
import type { UserProfile } from "../store/useAuthStore";
import { useAuthStore } from "../store/useAuthStore";
import { useKeyStore } from "../store/useKeyStore";
import { CryptoUtils } from "../utils/crypto";
import {
  clearMasterKey,
  loadMasterKey,
  saveMasterKey,
} from "../utils/keystore";

export const useAuth = () => {
  const { accessToken, user, isInitializing, setAuth, clearAuth } =
    useAuthStore();
  const { setMasterKey } = useKeyStore();

  const isAuthenticated = !!accessToken;

  // called after successful login — derive & save master key
  const login = async (
    access: string,
    profile: UserProfile,
    password: string,
  ) => {
    const masterKey = await CryptoUtils.deriveMasterKey(
      password,
      profile.email,
    );
    await saveMasterKey(masterKey);
    setMasterKey(masterKey);
    setAuth(access, profile);
  };

  const logout = async () => {
    try {
      await api.post(endpoints.LOGOUT);
    } finally {
      clearAuth();
      setMasterKey(null);
      await clearMasterKey();
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
      const { data: userData } = await api.get(endpoints.ME, {
        headers: { Authorization: `Bearer ${refreshData.access}` },
      });
      setAuth(refreshData.access, userData);

      // restore master key from IndexedDB
      const masterKey = await loadMasterKey();
      if (masterKey) setMasterKey(masterKey);
    } catch {
      clearAuth();
      setMasterKey(null);
      await clearMasterKey();
    }
  }, [setMasterKey]);

  return {
    isAuthenticated,
    user,
    isInitializing,
    login,
    logout,
    initialize,
  };
};
