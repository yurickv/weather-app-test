import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import FavoritesTab from './FavoritesTab';
import { I18nProvider } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import * as api from '../../services/weatherApi';

beforeEach(() => {
  useSettingsStore.setState({ language: 'en', theme: 'day' });
  useFavoritesStore.setState({ favorites: [] });
  vi.restoreAllMocks();
  vi.spyOn(api, 'getCurrentWeather').mockResolvedValue({
    name: 'Kyiv', dt: 0, main: { temp: 20, feels_like: 19, humidity: 50, temp_min: 18, temp_max: 22 },
    weather: [{ icon: '01d', description: 'clear', main: 'Clear' }], wind: { speed: 3 }, sys: { country: 'UA' } });
  vi.spyOn(api, 'getForecast').mockResolvedValue({ city: { name: 'Kyiv', country: 'UA' },
    list: [{ dt: 0, dt_txt: '2026-06-23 12:00:00', main: { temp: 21, temp_min: 20, temp_max: 22 }, weather: [{ icon: '01d', description: 'clear', main: 'Clear' }] }] });
});

describe('FavoritesTab', () => {
  it('shows empty message with no favorites', () => {
    render(<I18nProvider><FavoritesTab /></I18nProvider>);
    expect(screen.getByText(/No favorite cities yet/i)).toBeInTheDocument();
  });
  it('renders a block per favorite without a search input', async () => {
    useFavoritesStore.setState({ favorites: [{ name: 'Kyiv', country: 'UA', lat: 1, lon: 2 }] });
    render(<I18nProvider><FavoritesTab /></I18nProvider>);
    await waitFor(() => expect(screen.getByText(/20/)).toBeInTheDocument());
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});
