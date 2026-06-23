import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWeather } from './useWeather';
import * as api from '../services/weatherApi';
import type { City } from '../types/weather';

const city: City = { name: 'Kyiv', country: 'UA', lat: 1, lon: 2 };
beforeEach(() => vi.restoreAllMocks());

describe('useWeather', () => {
  it('loads current + forecast and exposes data', async () => {
    vi.spyOn(api, 'getCurrentWeather').mockResolvedValue({
      name: 'Kyiv', dt: 0, main: { temp: 20, feels_like: 19, humidity: 50, temp_min: 18, temp_max: 22 },
      weather: [{ icon: '01d', description: 'clear', main: 'Clear' }], wind: { speed: 3 }, sys: { country: 'UA' },
    });
    vi.spyOn(api, 'getForecast').mockResolvedValue({
      city: { name: 'Kyiv', country: 'UA' },
      list: [{ dt: 0, dt_txt: '2026-06-23 12:00:00', main: { temp: 21, temp_min: 20, temp_max: 22 }, weather: [{ icon: '01d', description: 'clear', main: 'Clear' }] }],
    });
    const { result } = renderHook(() => useWeather(city));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.current.main.temp).toBe(20);
    expect(result.current.data?.hourly).toHaveLength(1);
  });
  it('maps 404 to notfound error', async () => {
    vi.spyOn(api, 'getCurrentWeather').mockRejectedValue(new api.ApiError(404, 'x'));
    vi.spyOn(api, 'getForecast').mockRejectedValue(new api.ApiError(404, 'x'));
    const { result } = renderHook(() => useWeather(city));
    await waitFor(() => expect(result.current.error).toBe('notfound'));
  });
});
