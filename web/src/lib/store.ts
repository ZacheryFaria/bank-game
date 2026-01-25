import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserSchema } from "@bank-game/shared";
import { z } from "zod";

type User = z.infer<typeof UserSchema>;

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (token, refreshToken, user) => {
        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);
        set({ token, refreshToken, user });
      },
      clearAuth: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        set({ token: null, refreshToken: null, user: null });
      },
      isAuthenticated: () => {
        const state = get();
        return state.token !== null && state.user !== null;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
