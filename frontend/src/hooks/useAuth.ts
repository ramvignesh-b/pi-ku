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
import { report } from "../utils/report";

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
    } catch (err) {
      // The local session is cleared either way; the server call is best effort.
      report("warn", "logout_request_failed", err);
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
    } catch (err) {
      // Blocked storage lands here. The author is asked to unlock again.
      report("warn", "master_key_restore_failed", err);
    }

    // If session in memory, don't trigger refresh/me again
    if (accessToken && user) {
      setInitializing(false);
      return;
    }

    try {
      const { data: refreshData } = await publicApi.post(endpoints.REFRESH);
      const { data: userData } = await api.get(endpoints.ME, {
        headers: { Authorization: `Bearer ${refreshData.access}` },
      });
      setAuth(refreshData.access, userData);
    } catch (err) {
      // grace for temporary network errors
      report("warn", "session_restore_failed", err);
    } finally {
      setInitializing(false);
    }
  }, [setMasterKey]);

  const unlock = async (password: string) => {
    if (!user) {
      await logout();
      return;
    }

    const { masterKey, authHash } = await CryptoUtils.deriveKeyBundle(
      password,
      user.email,
    );

    // Validate password by calling login endpoint
    await api.post(endpoints.LOGIN, {
      email: user.email,
      password: authHash,
    });

    await saveMasterKey(masterKey);
    setMasterKey(masterKey);
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
