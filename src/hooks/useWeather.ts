import { useCallback, useEffect, useState } from 'react';
import { getCurrentWeather, getForecast, ApiError } from '../services/weatherApi';
import { toHourlyToday, toDailyForecast } from '../services/transforms';
import { useSettingsStore } from '../store/settingsStore';
import type { City, WeatherData } from '../types/weather';

type WeatherError = 'notfound' | 'generic' | null;

export function useWeather(city: City | null) {
  const language = useSettingsStore((s) => s.language);
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<WeatherError>(null);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const key = city ? `${city.lat},${city.lon}` : null;

  useEffect(() => {
    if (!city) { setData(null); setError(null); setLoading(false); return; }
    let active = true;
    setLoading(true); setError(null);
    Promise.all([getCurrentWeather(city.lat, city.lon, language), getForecast(city.lat, city.lon, language)])
      .then(([current, forecast]) => {
        if (!active) return;
        setData({ current, hourly: toHourlyToday(forecast), daily: toDailyForecast(forecast) });
      })
      .catch((e) => {
        if (!active) return;
        setData(null);
        setError(e instanceof ApiError && e.status === 404 ? 'notfound' : 'generic');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, language, nonce]);

  return { data, loading, error, reload };
}
