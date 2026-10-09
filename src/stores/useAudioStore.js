import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { startSpaceDrone, setMuted, playRadioClick, disposeAudio } from '@/lib/audioEngine';

export const useAudioStore = create(persist((set, get) => ({
  isMuted: true,
  // Consent is per document, even if the saved preference was ON.
  isStarted: false,
  isPending: false,
  error: false,
  toggleSound: async () => {
    const state = get();
    if (state.isPending) return;
    if (state.isStarted && !state.isMuted) {
      playRadioClick();
      set({ isMuted: true });
      await setMuted(true);
      return;
    }
    set({ isPending: true, error: false });
    try {
      const started = await startSpaceDrone();
      if (!started) await setMuted(true);
      set({ isMuted: !started, isStarted: started, isPending: false, error: !started });
      if (started) playRadioClick();
    } catch {
      disposeAudio();
      set({ isMuted: true, isStarted: false, isPending: false, error: true });
    }
  },
  resetAudio: () => {
    disposeAudio();
    set({ isStarted: false, isPending: false, error: false });
  },
}), {
  name: 'stellar-audio',
  storage: createJSONStorage(() => ({
    getItem: (name) => { try { return localStorage.getItem(name); } catch { return null; } },
    setItem: (name, value) => { try { localStorage.setItem(name, value); } catch { /* Session controls still work. */ } },
    removeItem: (name) => { try { localStorage.removeItem(name); } catch { /* Storage may be unavailable. */ } },
  })),
  partialize: ({ isMuted }) => ({ isMuted }),
  merge: (saved, current) => ({ ...current, isMuted: typeof saved?.isMuted === 'boolean' ? saved.isMuted : true }),
}));
