import { create } from "zustand";

interface KeyState {
  masterKey: CryptoKey | null;
  setMasterKey: (key: CryptoKey | null) => void;
}

// this key will be used to encrypt and decrypt the user's data
export const useKeyStore = create<KeyState>((set) => ({
  masterKey: null,
  setMasterKey: (masterKey) => set({ masterKey }),
}));
