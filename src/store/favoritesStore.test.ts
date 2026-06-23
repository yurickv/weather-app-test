import { describe, it, expect, beforeEach } from 'vitest';
import { useFavoritesStore } from './favoritesStore';
import type { City } from '../types/weather';

const city = (n: string, lat: number): City => ({ name: n, country: 'UA', lat, lon: lat });

beforeEach(() => useFavoritesStore.setState({ favorites: [] }));

describe('favoritesStore', () => {
  it('adds and reports isFavorite', () => {
    const c = city('Kyiv', 1);
    expect(useFavoritesStore.getState().addFavorite(c)).toBe(true);
    expect(useFavoritesStore.getState().isFavorite(c)).toBe(true);
  });
  it('rejects duplicates', () => {
    const c = city('Kyiv', 1);
    useFavoritesStore.getState().addFavorite(c);
    expect(useFavoritesStore.getState().addFavorite(c)).toBe(false);
    expect(useFavoritesStore.getState().favorites).toHaveLength(1);
  });
  it('caps at 5 and rejects the 6th', () => {
    for (let i = 0; i < 5; i++) useFavoritesStore.getState().addFavorite(city('C' + i, i));
    expect(useFavoritesStore.getState().addFavorite(city('C6', 99))).toBe(false);
    expect(useFavoritesStore.getState().favorites).toHaveLength(5);
  });
  it('removes', () => {
    const c = city('Kyiv', 1);
    useFavoritesStore.getState().addFavorite(c);
    useFavoritesStore.getState().removeFavorite(c);
    expect(useFavoritesStore.getState().isFavorite(c)).toBe(false);
  });
});
