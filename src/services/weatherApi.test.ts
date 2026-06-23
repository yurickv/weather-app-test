import { describe, it, expect, vi, afterEach } from 'vitest';
import { searchCities, getCurrentWeather, ApiError } from './weatherApi';

afterEach(() => vi.restoreAllMocks());

const okJson = (data: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) } as Response);

describe('searchCities', () => {
  it('calls the geocoding endpoint and returns suggestions', async () => {
    const spy = vi.spyOn(global, 'fetch').mockReturnValue(
      okJson([{ name: 'London', country: 'GB', lat: 51.5, lon: -0.12 }]));
    const res = await searchCities('Lon');
    expect(spy.mock.calls[0][0]).toContain('/geo/1.0/direct');
    expect(spy.mock.calls[0][0]).toContain('q=Lon');
    expect(res[0].name).toBe('London');
  });
  it('returns [] for blank query without calling fetch', async () => {
    const spy = vi.spyOn(global, 'fetch');
    expect(await searchCities('  ')).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('getCurrentWeather', () => {
  it('throws ApiError on non-ok response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      { ok: false, status: 404, json: () => Promise.resolve({}) } as Response);
    await expect(getCurrentWeather(1, 2, 'en')).rejects.toBeInstanceOf(ApiError);
  });
});
