import type { OwmForecast, HourlyPoint, DailyForecast } from '../types/weather';

const dateOf = (dtTxt: string) => dtTxt.slice(0, 10);
const timeOf = (dtTxt: string) => dtTxt.slice(11, 16);
const round1 = (n: number) => Math.round(n * 10) / 10;

export function toHourlyToday(forecast: OwmForecast): HourlyPoint[] {
  // The free tier returns the forecast in 3-hour steps. Plot the next ~24h
  // (up to 8 points) so the hourly chart always shows a full line — filtering
  // strictly to today's calendar date leaves it nearly empty late in the day.
  return forecast.list.slice(0, 8).map((i) => ({ time: timeOf(i.dt_txt), temp: i.main.temp }));
}

export function toDailyForecast(forecast: OwmForecast): DailyForecast[] {
  const groups = new Map<string, OwmForecast['list']>();
  for (const item of forecast.list) {
    const d = dateOf(item.dt_txt);
    if (!groups.has(d)) groups.set(d, []);
    groups.get(d)!.push(item);
  }
  const days: DailyForecast[] = [];
  for (const [date, items] of groups) {
    const temps = items.map((i) => i.main.temp);
    const noon = items.find((i) => timeOf(i.dt_txt) === '12:00') ?? items[Math.floor(items.length / 2)];
    days.push({
      date,
      avgTemp: round1(temps.reduce((a, b) => a + b, 0) / temps.length),
      min: round1(Math.min(...items.map((i) => i.main.temp_min))),
      max: round1(Math.max(...items.map((i) => i.main.temp_max))),
      icon: noon.weather[0].icon,
      description: noon.weather[0].description,
    });
  }
  return days.slice(0, 5);
}
