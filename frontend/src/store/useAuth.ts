import { create } from "zustand";
import authApiClient from "../api/apiClient";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  user: any | null;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  user: null,
  login: async (credentials: any) => {
    const response = await authApiClient.post("login/", credentials);
    set({
      accessToken: response.data.access,
      refreshToken: response.data.refresh,
      isAuthenticated: true,
      user: response.data.user,
    });
  },
  logout: async () => {
    await authApiClient.post("logout/");
    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      user: null,
    });
  },
}));
