import type { City } from '../types/weather';

const FALLBACK: City = { name: 'Kyiv', country: 'UA', lat: 50.4501, lon: 30.5234 };

export async function getLocationByIp(): Promise<City> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return FALLBACK;
    const d = (await res.json()) as { latitude?: number; longitude?: number; city?: string; country_code?: string };
    if (typeof d.latitude !== 'number' || typeof d.longitude !== 'number') return FALLBACK;
    return { name: d.city ?? FALLBACK.name, country: d.country_code ?? '', lat: d.latitude, lon: d.longitude };
  } catch {
    return FALLBACK;
  }
}
