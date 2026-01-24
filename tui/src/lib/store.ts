import { create } from "zustand";
import { setAuthToken } from "./api.js";
import { saveToken, deleteToken } from "./tokenPersistence.js";

type User = {
  id: string;
  email: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  login: (token, refreshToken, user) => {
    setAuthToken(token);
    set({ user, token, refreshToken, isAuthenticated: true });
    saveToken({ token, refreshToken, user }).catch(() => {});
  },
  logout: () => {
    setAuthToken(null);
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
    deleteToken().catch(() => {});
  },
}));
