import { OWM_BASE, UNITS, API_KEY } from './constants';
import type { GeoSuggestion, OwmCurrent, OwmForecast } from '../types/weather';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new ApiError(res.status, `Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export function searchCities(query: string, signal?: AbortSignal): Promise<GeoSuggestion[]> {
  const q = query.trim();
  if (!q) return Promise.resolve([]);
  const url = `${OWM_BASE}/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${API_KEY}`;
  return getJson<GeoSuggestion[]>(url, signal);
}

export function getCurrentWeather(lat: number, lon: number, lang: string): Promise<OwmCurrent> {
  const url = `${OWM_BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&units=${UNITS}&lang=${lang}&appid=${API_KEY}`;
  return getJson<OwmCurrent>(url);
}

export function getForecast(lat: number, lon: number, lang: string): Promise<OwmForecast> {
  const url = `${OWM_BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${UNITS}&lang=${lang}&appid=${API_KEY}`;
  return getJson<OwmForecast>(url);
}
