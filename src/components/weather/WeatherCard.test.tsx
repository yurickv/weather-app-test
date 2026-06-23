import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeatherCard from './WeatherCard';
import { I18nProvider } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import type { WeatherData, City } from '../../types/weather';

const city: City = { name: 'Kyiv', country: 'UA', lat: 1, lon: 2 };
const data: WeatherData = {
  current: { name: 'Kyiv', dt: 0, main: { temp: 20, feels_like: 19, humidity: 50, temp_min: 18, temp_max: 22 }, weather: [{ icon: '01d', description: 'clear sky', main: 'Clear' }], wind: { speed: 3 }, sys: { country: 'UA' } },
  hourly: [{ time: '12:00', temp: 21 }],
  daily: [{ date: '2026-06-23', avgTemp: 20, min: 18, max: 22, icon: '01d', description: 'clear' }],
};
beforeEach(() => useSettingsStore.setState({ language: 'en', theme: 'day' }));
const renderCard = (props: Partial<React.ComponentProps<typeof WeatherCard>> = {}) =>
  render(<I18nProvider><WeatherCard data={data} period="today" city={city} isFavorite={false} showFavorite onToggleFavorite={vi.fn()} {...props} /></I18nProvider>);

describe('WeatherCard', () => {
  it('shows current temperature in today mode', () => {
    renderCard();
    expect(screen.getByText(/20/)).toBeInTheDocument();
    expect(screen.getByText(/clear sky/)).toBeInTheDocument();
  });
  it('fires onToggleFavorite when star clicked', async () => {
    const onToggleFavorite = vi.fn();
    renderCard({ onToggleFavorite });
    await userEvent.click(screen.getByRole('button', { name: /favorite/i }));
    expect(onToggleFavorite).toHaveBeenCalledOnce();
  });
});
