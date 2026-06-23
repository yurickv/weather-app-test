import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'uk';
export type Theme = 'day' | 'night';

interface SettingsState {
  language: Language;
  theme: Theme;
  setLanguage: (l: Language) => void;
  toggleTheme: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      theme: 'day',
      setLanguage: (language) => set({ language }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'day' ? 'night' : 'day' })),
    }),
    { name: 'weather-settings' }
  )
);
