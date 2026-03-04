import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/types";

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  setUser: (user: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: Partial<Profile>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "setu-auth",
      // Only persist the user field, not transient state like isLoading
      partialize: (state) => ({ user: state.user }),
    }
  )
);
