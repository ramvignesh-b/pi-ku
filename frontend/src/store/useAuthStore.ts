import { create } from "zustand";

export interface UserProfile {
  public_id: string;
  email: string;
  full_name: string;
}

interface AuthState {
  accessToken: string | null;
  user: UserProfile | null;
  isInitializing: boolean;
  setAuth: (accessToken: string, user: UserProfile) => void;
  clearAuth: () => void;
  setInitializing: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isInitializing: true,
  setAuth: (accessToken, user) =>
    set({ accessToken, user, isInitializing: false }),
  clearAuth: () =>
    set({ accessToken: null, user: null, isInitializing: false }),
  setInitializing: (isInitializing) => set({ isInitializing }),
}));
