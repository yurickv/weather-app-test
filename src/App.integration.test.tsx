import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { useSettingsStore } from './store/settingsStore';
import { useFavoritesStore } from './store/favoritesStore';
import { useBlocksStore, makeEmptyBlock } from './store/blocksStore';
import * as geo from './services/geo';

beforeEach(() => {
  useSettingsStore.setState({ language: 'en', theme: 'day' });
  useFavoritesStore.setState({ favorites: [] });
  useBlocksStore.setState({ blocks: [makeEmptyBlock()] });
  vi.restoreAllMocks();
  vi.spyOn(geo, 'getLocationByIp').mockResolvedValue({ name: 'Kyiv', country: 'UA', lat: 1, lon: 2 });
});

describe('App integration', () => {
  it('switches tabs and language', async () => {
    render(<App />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Favorites'));
    expect(screen.getByText(/No favorite cities yet/i)).toBeInTheDocument();
    await userEvent.click(screen.getByText('UK'));
    expect(screen.getByText('Вибране')).toBeInTheDocument();
  });
});
