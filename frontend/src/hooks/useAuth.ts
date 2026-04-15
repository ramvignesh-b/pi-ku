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

  // called after successful login — save master key
  const setAuthStore = async (
    access: string,
    profile: UserProfile,
    masterKey: CryptoKey,
  ) => {
    await saveMasterKey(masterKey);
    setMasterKey(masterKey);
    setAuth(access, profile);
  };

  const logout = async () => {
    try {
      await api.post(endpoints.LOGOUT);
    } catch (_error) {
    } finally {
      clearAuth();
      setMasterKey(null);
      await clearMasterKey();
    }
  };

  const initialize = useCallback(async () => {
    const { accessToken, user, setAuth, setInitializing } =
      useAuthStore.getState();

    // Restore master key from IndexedDB
    try {
      const masterKey = await loadMasterKey();
      if (masterKey) setMasterKey(masterKey);
    } catch {
      console.error("Master key restoration failed");
    }

    // If session in memory, don't trigger refresh/me again
    if (accessToken && user) {
      setInitializing(false);
      return;
    }

    try {
      // try session refresh
      const { data: refreshData } = await publicApi.post(endpoints.REFRESH);
      const { data: userData } = await api.get(endpoints.ME, {
        headers: { Authorization: `Bearer ${refreshData.access}` },
      });
      setAuth(refreshData.access, userData);
    } catch {
      // grace for temporary network errors
    } finally {
      setInitializing(false);
    }
  }, [setMasterKey]);

  const unlock = async (password: string) => {
    if (!user) return;

    try {
      const { masterKey } = await CryptoUtils.deriveKeyBundle(
        password,
        user.email,
      );
      await saveMasterKey(masterKey);
      setMasterKey(masterKey);
    } catch {
      console.error("Master key restoration failed");
    }
  };

  return {
    isAuthenticated,
    user,
    isInitializing,
    setAuthStore,
    logout,
    initialize,
    unlock,
  };
};
