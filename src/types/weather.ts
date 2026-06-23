export interface City {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export type Period = 'today' | '5day';

export interface OwmWeatherDesc { icon: string; description: string; main: string; }

export interface OwmCurrent {
  name: string;
  dt: number;
  main: { temp: number; feels_like: number; humidity: number; temp_min: number; temp_max: number };
  weather: OwmWeatherDesc[];
  wind: { speed: number };
  sys: { country: string };
}

export interface OwmForecastItem {
  dt: number;
  dt_txt: string; // "2026-06-23 12:00:00"
  main: { temp: number; temp_min: number; temp_max: number };
  weather: OwmWeatherDesc[];
}

export interface OwmForecast {
  list: OwmForecastItem[];
  city: { name: string; country: string };
}

export interface HourlyPoint { time: string; temp: number; }

export interface DailyForecast {
  date: string;
  avgTemp: number;
  min: number;
  max: number;
  icon: string;
  description: string;
}

export interface WeatherData {
  current: OwmCurrent;
  hourly: HourlyPoint[];
  daily: DailyForecast[];
}

export interface GeoSuggestion { name: string; country: string; state?: string; lat: number; lon: number; }
