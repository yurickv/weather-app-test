import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeatherBlock from './WeatherBlock';
import { I18nProvider } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import * as api from '../../services/weatherApi';
import type { City } from '../../types/weather';

const city: City = { name: 'Kyiv', country: 'UA', lat: 1, lon: 2 };

beforeEach(() => {
  useSettingsStore.setState({ language: 'en', theme: 'day' });
  useFavoritesStore.setState({ favorites: [] });
  vi.restoreAllMocks();
  vi.spyOn(api, 'getCurrentWeather').mockResolvedValue({
    name: 'Kyiv', dt: 0, main: { temp: 20, feels_like: 19, humidity: 50, temp_min: 18, temp_max: 22 },
    weather: [{ icon: '01d', description: 'clear', main: 'Clear' }], wind: { speed: 3 }, sys: { country: 'UA' },
  });
  vi.spyOn(api, 'getForecast').mockResolvedValue({
    city: { name: 'Kyiv', country: 'UA' },
    list: [{ dt: 0, dt_txt: '2026-06-23 12:00:00', main: { temp: 21, temp_min: 20, temp_max: 22 }, weather: [{ icon: '01d', description: 'clear', main: 'Clear' }] }],
  });
});

const renderBlock = (props: Partial<React.ComponentProps<typeof WeatherBlock>> = {}) =>
  render(<I18nProvider><WeatherBlock city={city} period="today" allowCityEdit allowDelete
    onCityChange={vi.fn()} onPeriodChange={vi.fn()} onDelete={vi.fn()} {...props} /></I18nProvider>);

describe('WeatherBlock', () => {
  it('loads and shows weather for a city', async () => {
    renderBlock();
    await waitFor(() => expect(screen.getByText(/20/)).toBeInTheDocument());
  });
  it('confirms before deleting', async () => {
    const onDelete = vi.fn();
    renderBlock({ onDelete });
    await waitFor(() => screen.getByText(/20/));
    await userEvent.click(screen.getByRole('button', { name: /delete block/i }));
    await userEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledOnce();
  });
  it('shows max-favorites alert when adding a 6th favorite', async () => {
    useFavoritesStore.setState({ favorites: [
      { name: 'a', country: 'x', lat: 10, lon: 10 }, { name: 'b', country: 'x', lat: 11, lon: 11 },
      { name: 'c', country: 'x', lat: 12, lon: 12 }, { name: 'd', country: 'x', lat: 13, lon: 13 },
      { name: 'e', country: 'x', lat: 14, lon: 14 } ] });
    renderBlock();
    await waitFor(() => screen.getByText(/20/));
    await userEvent.click(screen.getByRole('button', { name: /add to favorites/i }));
    expect(await screen.findByText(/maximum is 5/i)).toBeInTheDocument();
  });
});
