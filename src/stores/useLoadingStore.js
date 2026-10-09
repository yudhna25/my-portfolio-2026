import { create } from 'zustand';

export const useLoadingStore = create((set) => ({
  isLoading: true,
  setLoading: (isLoading) => set({ isLoading }),
}));
