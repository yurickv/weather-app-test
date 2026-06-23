import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { City } from '../types/weather';

export const MAX_FAVORITES = 5;
export const cityKey = (c: City) => `${c.lat},${c.lon}`;

interface FavoritesState {
  favorites: City[];
  addFavorite: (c: City) => boolean;
  removeFavorite: (c: City) => void;
  isFavorite: (c: City) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isFavorite: (c) => get().favorites.some((f) => cityKey(f) === cityKey(c)),
      addFavorite: (c) => {
        const { favorites, isFavorite } = get();
        if (isFavorite(c) || favorites.length >= MAX_FAVORITES) return false;
        set({ favorites: [...favorites, c] });
        return true;
      },
      removeFavorite: (c) =>
        set((s) => ({ favorites: s.favorites.filter((f) => cityKey(f) !== cityKey(c)) })),
    }),
    { name: 'weather-favorites' }
  )
);
