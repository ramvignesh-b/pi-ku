import { create } from "zustand";
import { postAuthApiClient, preAuthApiClient } from "../api/apiClient";
import { endpoints } from "../config/endpoints";

interface UserProfile {
  public_id: string;
  email: string;
  full_name: string;
}

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  user: UserProfile | null;
  isInitializing: boolean; // refresh in transit
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  accessToken: null,
  isAuthenticated: false,
  user: null,
  isInitializing: true,

  login: async (credentials: any) => {
    const response = await preAuthApiClient.post(endpoints.LOGIN, credentials);
    set({
      accessToken: response.data.access,
      isAuthenticated: true,
      user: response.data.user,
    });
  },

  logout: async () => {
    try {
      const token = get().accessToken;
      if (token) {
        await preAuthApiClient.post(endpoints.LOGOUT);
      }
    } finally {
      set({
        accessToken: null,
        isAuthenticated: false,
        user: null,
      });
    }
  },

  checkAuth: async () => {
    try {
      const response = await postAuthApiClient.get(endpoints.ME);
      set({
        user: response.data,
        isAuthenticated: true,
      });
    } catch (err) {
      console.error("Check auth error:", err);
      set({
        user: null,
        isAuthenticated: false,
      });
    } finally {
      set({ isInitializing: false });
    }
  },
}));
