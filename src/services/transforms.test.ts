import { describe, it, expect } from 'vitest';
import { toHourlyToday, toDailyForecast } from './transforms';
import type { OwmForecast } from '../types/weather';

const mk = (dt_txt: string, temp: number): OwmForecast['list'][number] => ({
  dt: Date.parse(dt_txt + 'Z') / 1000,
  dt_txt,
  main: { temp, temp_min: temp - 1, temp_max: temp + 1 },
  weather: [{ icon: '01d', description: 'clear', main: 'Clear' }],
});

const forecast: OwmForecast = {
  city: { name: 'Kyiv', country: 'UA' },
  list: [
    mk('2026-06-23 09:00:00', 18),
    mk('2026-06-23 12:00:00', 22),
    mk('2026-06-23 15:00:00', 20),
    mk('2026-06-24 12:00:00', 25),
    mk('2026-06-25 12:00:00', 30),
  ],
};

describe('toHourlyToday', () => {
  it('returns only the earliest date points as {time,temp}', () => {
    const pts = toHourlyToday(forecast);
    expect(pts).toEqual([
      { time: '09:00', temp: 18 },
      { time: '12:00', temp: 22 },
      { time: '15:00', temp: 20 },
    ]);
  });
});

describe('toDailyForecast', () => {
  it('groups by date and averages temp', () => {
    const days = toDailyForecast(forecast);
    expect(days).toHaveLength(3);
    expect(days[0].date).toBe('2026-06-23');
    expect(days[0].avgTemp).toBe(20); // (18+22+20)/3
    expect(days[0].icon).toBe('01d');
  });
  it('caps at 5 days', () => {
    const many: OwmForecast = { city: forecast.city, list: Array.from({ length: 6 }, (_, i) =>
      mk(`2026-07-0${i + 1} 12:00:00`, 20)) };
    expect(toDailyForecast(many)).toHaveLength(5);
  });
});
