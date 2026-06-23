# Weather App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive OpenWeatherMap weather app with city autocomplete, current-day card + hourly chart, up to 5 independent weather blocks, a persisted favorites tab, and the bonus features (5-day toggle, IP default, preloaders, en/uk i18n, day/night theme).

**Architecture:** React 18 SPA. A typed `fetch` service layer talks to OpenWeatherMap (geocoding, current, 5-day/3-hour forecast) and an IP-geo service; pure transform functions reshape forecast data into chart/daily views. Three Zustand stores hold settings (persisted), favorites (persisted to localStorage), and Home-tab blocks (in-memory). Presentational components (card, chart, autocomplete, modal) are driven by a `useWeather` hook. Styling is plain CSS Modules + CSS custom properties for theming.

**Tech Stack:** React 18, TypeScript, Vite, Zustand (+persist), Chart.js v4, Vitest + React Testing Library + jsdom.

## Global Constraints

- No CSS frameworks, no UI libraries. Plain CSS only (CSS Modules + CSS custom properties).
- Charting library allowed: Chart.js (vanilla) only — never vue-chartjs.
- All HTTP via `fetch`.
- Responsive: main container `max-width: 1200px`, fluid to a `360px` minimum.
- Max 5 Home-tab blocks; max 5 favorites. Default 1 Home block.
- Free OWM tier = 3-hour forecast steps; "hourly today" = the current day's ~8 three-hour points.
- API key only via `import.meta.env.VITE_OPENWEATHER_API_KEY`. Never hardcode a key. Commit `.env.example`, never `.env`.
- TypeScript strict mode; no `any` in committed code.
- Commit after every task.

---

## File Structure

```
.env.example                      VITE_OPENWEATHER_API_KEY placeholder
.gitignore                        node_modules, dist, .env
index.html                        Vite entry
package.json / tsconfig*.json / vite.config.ts
vitest.setup.ts                   jest-dom + matchMedia mock
src/
  main.tsx                        React root
  App.tsx                         layout shell + active-tab state
  types/weather.ts                City, OWM response + view-model types
  services/
    constants.ts                  base URLs, units default
    weatherApi.ts                 searchCities, getCurrentWeather, getForecast
    geo.ts                        getLocationByIp
    transforms.ts                 toHourlyToday, toDailyForecast
  store/
    settingsStore.ts              language + theme (persisted)
    favoritesStore.ts             favorites[] (persisted, cap 5)
    blocksStore.ts                blocks[] (in-memory, cap 5)
  i18n/
    index.tsx                     I18nProvider + useT()
    en.ts / uk.ts                 dictionaries
  hooks/
    useDebounce.ts
    useWeather.ts                 loads current+forecast for a city
  components/
    common/Modal.tsx (+ .module.css)
    common/Spinner.tsx (+ .module.css)
    layout/Header.tsx (+ .module.css)
    layout/Tabs.tsx (+ .module.css)
    search/CityAutocomplete.tsx (+ .module.css)
    weather/PeriodToggle.tsx (+ .module.css)
    weather/TemperatureChart.tsx (+ .module.css)
    weather/WeatherCard.tsx (+ .module.css)
    weather/WeatherBlock.tsx (+ .module.css)
    home/HomeTab.tsx (+ .module.css)
    favorites/FavoritesTab.tsx (+ .module.css)
  styles/
    global.css                    reset + container
    theme.css                     CSS vars for [data-theme]
README.md
```

---

## Task 1: Project scaffold + tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `vitest.setup.ts`, `.gitignore`, `.env.example`, `src/styles/global.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `App` (default export React component) rendering a root container with `data-testid="app-root"`.

- [ ] **Step 1: Scaffold Vite React-TS project and install deps**

Run:
```bash
npm create vite@latest . -- --template react-ts
npm install
npm install zustand chart.js
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```
Expected: dependencies install; `src/` contains the Vite starter.

- [ ] **Step 2: Replace `vite.config.ts` with Vitest config**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    css: true,
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom';

// jsdom lacks matchMedia; Chart.js and theme code may read it.
window.matchMedia = window.matchMedia || ((query: string) => ({
  matches: false, media: query, onchange: null,
  addListener: () => {}, removeListener: () => {},
  addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;
```

- [ ] **Step 4: Create `.gitignore` and `.env.example`**

`.gitignore`:
```
node_modules
dist
.env
*.local
```
`.env.example`:
```
VITE_OPENWEATHER_API_KEY=your_openweathermap_api_key_here
```

- [ ] **Step 5: Create `src/styles/global.css`**

```css
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; }
.container { width: 100%; max-width: 1200px; min-width: 360px; margin-inline: auto; padding: 16px; }
```

- [ ] **Step 6: Replace `src/App.tsx` with a minimal shell**

```tsx
import './styles/global.css';

export default function App() {
  return <div data-testid="app-root" className="container">Weather App</div>;
}
```

- [ ] **Step 7: Replace `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
```

- [ ] **Step 8: Write smoke test `src/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the app root', () => {
  render(<App />);
  expect(screen.getByTestId('app-root')).toBeInTheDocument();
});
```

- [ ] **Step 9: Add test script and run**

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.
Run: `npm test`
Expected: 1 passing test.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite React-TS app with Vitest"
```

---

## Task 2: Domain types

**Files:**
- Create: `src/types/weather.ts`

**Interfaces:**
- Produces:
  - `City = { name: string; country: string; state?: string; lat: number; lon: number }`
  - `OwmCurrent` (subset of `/data/2.5/weather`)
  - `OwmForecast` (subset of `/data/2.5/forecast`)
  - `HourlyPoint = { time: string; temp: number }`
  - `DailyForecast = { date: string; avgTemp: number; min: number; max: number; icon: string; description: string }`
  - `WeatherData = { current: OwmCurrent; hourly: HourlyPoint[]; daily: DailyForecast[] }`
  - `Period = 'today' | '5day'`

- [ ] **Step 1: Create `src/types/weather.ts`**

```ts
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/weather.ts
git commit -m "feat: add domain types"
```

---

## Task 3: Forecast transforms (pure functions, TDD)

**Files:**
- Create: `src/services/transforms.ts`
- Test: `src/services/transforms.test.ts`

**Interfaces:**
- Consumes: `OwmForecast`, `HourlyPoint`, `DailyForecast` from `src/types/weather.ts`.
- Produces:
  - `toHourlyToday(forecast: OwmForecast): HourlyPoint[]` — points for the earliest calendar date present, `time` as `"HH:mm"` from `dt_txt`.
  - `toDailyForecast(forecast: OwmForecast): DailyForecast[]` — up to 5 days, `avgTemp` = mean of that date's temps (rounded to 1 dp), `min`/`max` from temp_min/temp_max, `icon`/`description` from the entry nearest 12:00.

- [ ] **Step 1: Write failing tests `src/services/transforms.test.ts`**

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/services/transforms.test.ts`
Expected: FAIL — `toHourlyToday`/`toDailyForecast` not exported.

- [ ] **Step 3: Implement `src/services/transforms.ts`**

```ts
import type { OwmForecast, HourlyPoint, DailyForecast } from '../types/weather';

const dateOf = (dtTxt: string) => dtTxt.slice(0, 10);
const timeOf = (dtTxt: string) => dtTxt.slice(11, 16);
const round1 = (n: number) => Math.round(n * 10) / 10;

export function toHourlyToday(forecast: OwmForecast): HourlyPoint[] {
  if (forecast.list.length === 0) return [];
  const firstDate = dateOf(forecast.list[0].dt_txt);
  return forecast.list
    .filter((i) => dateOf(i.dt_txt) === firstDate)
    .map((i) => ({ time: timeOf(i.dt_txt), temp: i.main.temp }));
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/services/transforms.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add src/services/transforms.ts src/services/transforms.test.ts
git commit -m "feat: add forecast transforms with tests"
```

---

## Task 4: API service layer

**Files:**
- Create: `src/services/constants.ts`, `src/services/weatherApi.ts`, `src/services/geo.ts`
- Test: `src/services/weatherApi.test.ts`

**Interfaces:**
- Consumes: `City`, `GeoSuggestion`, `OwmCurrent`, `OwmForecast` from types; `toHourlyToday`, `toDailyForecast`.
- Produces:
  - `searchCities(query: string, signal?: AbortSignal): Promise<GeoSuggestion[]>`
  - `getCurrentWeather(lat: number, lon: number, lang: string): Promise<OwmCurrent>`
  - `getForecast(lat: number, lon: number, lang: string): Promise<OwmForecast>`
  - `getLocationByIp(): Promise<City>` (geo.ts)
  - Error class `ApiError extends Error { status: number }`

- [ ] **Step 1: Create `src/services/constants.ts`**

```ts
export const OWM_BASE = 'https://api.openweathermap.org';
export const UNITS = 'metric';
export const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string;
```

- [ ] **Step 2: Write failing tests `src/services/weatherApi.test.ts`**

```ts
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/services/weatherApi.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `src/services/weatherApi.ts`**

```ts
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
```

- [ ] **Step 5: Implement `src/services/geo.ts`**

```ts
import type { City } from '../types/weather';

const FALLBACK: City = { name: 'Kyiv', country: 'UA', lat: 50.4501, lon: 30.5234 };

export async function getLocationByIp(): Promise<City> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return FALLBACK;
    const d = await res.json();
    if (typeof d.latitude !== 'number' || typeof d.longitude !== 'number') return FALLBACK;
    return { name: d.city ?? FALLBACK.name, country: d.country_code ?? '', lat: d.latitude, lon: d.longitude };
  } catch {
    return FALLBACK;
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/services/weatherApi.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/services/constants.ts src/services/weatherApi.ts src/services/geo.ts src/services/weatherApi.test.ts
git commit -m "feat: add OpenWeatherMap + IP-geo service layer"
```

---

## Task 5: Settings store (language + theme, persisted)

**Files:**
- Create: `src/store/settingsStore.ts`
- Test: `src/store/settingsStore.test.ts`

**Interfaces:**
- Produces: `useSettingsStore` with state `{ language: 'en'|'uk'; theme: 'day'|'night' }` and actions `setLanguage(l)`, `toggleTheme()`. Persist key `weather-settings`.

- [ ] **Step 1: Write failing test `src/store/settingsStore.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from './settingsStore';

beforeEach(() => useSettingsStore.setState({ language: 'en', theme: 'day' }));

describe('settingsStore', () => {
  it('toggles theme', () => {
    useSettingsStore.getState().toggleTheme();
    expect(useSettingsStore.getState().theme).toBe('night');
  });
  it('sets language', () => {
    useSettingsStore.getState().setLanguage('uk');
    expect(useSettingsStore.getState().language).toBe('uk');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/settingsStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/store/settingsStore.ts`**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'uk';
export type Theme = 'day' | 'night';

interface SettingsState {
  language: Language;
  theme: Theme;
  setLanguage: (l: Language) => void;
  toggleTheme: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      theme: 'day',
      setLanguage: (language) => set({ language }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'day' ? 'night' : 'day' })),
    }),
    { name: 'weather-settings' }
  )
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/store/settingsStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/settingsStore.ts src/store/settingsStore.test.ts
git commit -m "feat: add settings store (language + theme)"
```

---

## Task 6: Favorites store (persisted, cap 5)

**Files:**
- Create: `src/store/favoritesStore.ts`
- Test: `src/store/favoritesStore.test.ts`

**Interfaces:**
- Consumes: `City`.
- Produces: `useFavoritesStore` with `{ favorites: City[] }` and `addFavorite(c: City): boolean` (false if already at 5 or duplicate), `removeFavorite(c: City): void`, `isFavorite(c: City): boolean`. Identity = `"{lat},{lon}"`. Persist key `weather-favorites`. Exported helper `cityKey(c: City): string`.

- [ ] **Step 1: Write failing test `src/store/favoritesStore.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useFavoritesStore } from './favoritesStore';
import type { City } from '../types/weather';

const city = (n: string, lat: number): City => ({ name: n, country: 'UA', lat, lon: lat });

beforeEach(() => useFavoritesStore.setState({ favorites: [] }));

describe('favoritesStore', () => {
  it('adds and reports isFavorite', () => {
    const c = city('Kyiv', 1);
    expect(useFavoritesStore.getState().addFavorite(c)).toBe(true);
    expect(useFavoritesStore.getState().isFavorite(c)).toBe(true);
  });
  it('rejects duplicates', () => {
    const c = city('Kyiv', 1);
    useFavoritesStore.getState().addFavorite(c);
    expect(useFavoritesStore.getState().addFavorite(c)).toBe(false);
    expect(useFavoritesStore.getState().favorites).toHaveLength(1);
  });
  it('caps at 5 and rejects the 6th', () => {
    for (let i = 0; i < 5; i++) useFavoritesStore.getState().addFavorite(city('C' + i, i));
    expect(useFavoritesStore.getState().addFavorite(city('C6', 99))).toBe(false);
    expect(useFavoritesStore.getState().favorites).toHaveLength(5);
  });
  it('removes', () => {
    const c = city('Kyiv', 1);
    useFavoritesStore.getState().addFavorite(c);
    useFavoritesStore.getState().removeFavorite(c);
    expect(useFavoritesStore.getState().isFavorite(c)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/favoritesStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/store/favoritesStore.ts`**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { City } from '../types/weather';

export const MAX_FAVORITES = 5;
export const cityKey = (c: City) => `${c.lat},${c.lon}`;

interface FavoritesState {
  favorites: City[];
  addFavorite: (c: City) => boolean;
  removeFavorite: (c: City) => void;
  isFavorite: (c: City) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isFavorite: (c) => get().favorites.some((f) => cityKey(f) === cityKey(c)),
      addFavorite: (c) => {
        const { favorites, isFavorite } = get();
        if (isFavorite(c) || favorites.length >= MAX_FAVORITES) return false;
        set({ favorites: [...favorites, c] });
        return true;
      },
      removeFavorite: (c) =>
        set((s) => ({ favorites: s.favorites.filter((f) => cityKey(f) !== cityKey(c)) })),
    }),
    { name: 'weather-favorites' }
  )
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/store/favoritesStore.test.ts`
Expected: PASS (all 4).

- [ ] **Step 5: Commit**

```bash
git add src/store/favoritesStore.ts src/store/favoritesStore.test.ts
git commit -m "feat: add favorites store with 5-item cap"
```

---

## Task 7: Blocks store (in-memory, cap 5)

**Files:**
- Create: `src/store/blocksStore.ts`
- Test: `src/store/blocksStore.test.ts`

**Interfaces:**
- Consumes: `City`, `Period`.
- Produces: `Block = { id: string; city: City | null; period: Period }`; `useBlocksStore` with `{ blocks: Block[] }` initialized to one empty block, and `addBlock(): boolean` (false at 5), `removeBlock(id): void`, `setBlockCity(id, city): void`, `setBlockPeriod(id, period): void`. Export `MAX_BLOCKS`.

- [ ] **Step 1: Write failing test `src/store/blocksStore.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useBlocksStore, makeEmptyBlock } from './blocksStore';

beforeEach(() => useBlocksStore.setState({ blocks: [makeEmptyBlock()] }));

describe('blocksStore', () => {
  it('starts with one empty block', () => {
    expect(useBlocksStore.getState().blocks).toHaveLength(1);
    expect(useBlocksStore.getState().blocks[0].city).toBeNull();
  });
  it('adds up to 5 and rejects the 6th', () => {
    for (let i = 0; i < 4; i++) expect(useBlocksStore.getState().addBlock()).toBe(true);
    expect(useBlocksStore.getState().blocks).toHaveLength(5);
    expect(useBlocksStore.getState().addBlock()).toBe(false);
  });
  it('removes by id', () => {
    const id = useBlocksStore.getState().blocks[0].id;
    useBlocksStore.getState().addBlock();
    useBlocksStore.getState().removeBlock(id);
    expect(useBlocksStore.getState().blocks.find((b) => b.id === id)).toBeUndefined();
  });
  it('sets city and period', () => {
    const id = useBlocksStore.getState().blocks[0].id;
    useBlocksStore.getState().setBlockCity(id, { name: 'Kyiv', country: 'UA', lat: 1, lon: 2 });
    useBlocksStore.getState().setBlockPeriod(id, '5day');
    const b = useBlocksStore.getState().blocks[0];
    expect(b.city?.name).toBe('Kyiv');
    expect(b.period).toBe('5day');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/blocksStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/store/blocksStore.ts`**

```ts
import { create } from 'zustand';
import type { City, Period } from '../types/weather';

export const MAX_BLOCKS = 5;

export interface Block { id: string; city: City | null; period: Period; }

export const makeEmptyBlock = (): Block => ({
  id: (crypto.randomUUID?.() ?? String(Math.random())),
  city: null,
  period: 'today',
});

interface BlocksState {
  blocks: Block[];
  addBlock: () => boolean;
  removeBlock: (id: string) => void;
  setBlockCity: (id: string, city: City) => void;
  setBlockPeriod: (id: string, period: Period) => void;
}

export const useBlocksStore = create<BlocksState>((set, get) => ({
  blocks: [makeEmptyBlock()],
  addBlock: () => {
    if (get().blocks.length >= MAX_BLOCKS) return false;
    set((s) => ({ blocks: [...s.blocks, makeEmptyBlock()] }));
    return true;
  },
  removeBlock: (id) => set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) })),
  setBlockCity: (id, city) =>
    set((s) => ({ blocks: s.blocks.map((b) => (b.id === id ? { ...b, city } : b)) })),
  setBlockPeriod: (id, period) =>
    set((s) => ({ blocks: s.blocks.map((b) => (b.id === id ? { ...b, period } : b)) })),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/store/blocksStore.test.ts`
Expected: PASS (all 4).

- [ ] **Step 5: Commit**

```bash
git add src/store/blocksStore.ts src/store/blocksStore.test.ts
git commit -m "feat: add blocks store with 5-block cap"
```

---

## Task 8: i18n (dictionaries + provider)

**Files:**
- Create: `src/i18n/en.ts`, `src/i18n/uk.ts`, `src/i18n/index.tsx`
- Test: `src/i18n/i18n.test.tsx`

**Interfaces:**
- Consumes: `useSettingsStore`.
- Produces:
  - `dictionaries: Record<Language, Record<string, string>>`
  - `I18nProvider` (no props besides children) — reads language from settings.
  - `useT(): (key: string) => string` returning the translation for the current language.

- [ ] **Step 1: Create `src/i18n/en.ts`**

```ts
export const en = {
  appTitle: 'Weather',
  tabHome: 'Home',
  tabFavorites: 'Favorites',
  searchPlaceholder: 'Search city…',
  noMatches: 'No matches',
  addToFavorites: 'Add to favorites',
  removeFromFavorites: 'Remove from favorites',
  addBlock: 'Add block',
  today: 'Today',
  fiveDay: '5 days',
  deleteBlock: 'Delete block',
  confirmDeleteBlock: 'Delete this weather block?',
  cancel: 'Cancel',
  confirm: 'Delete',
  maxFavoritesTitle: 'Favorites limit reached',
  maxFavoritesBody: 'To add a city, remove one first — maximum is 5.',
  errorCityNotFound: 'City not found',
  errorGeneric: 'Could not load weather. Try again.',
  retry: 'Retry',
  feelsLike: 'Feels like',
  humidity: 'Humidity',
  wind: 'Wind',
  emptyFavorites: 'No favorite cities yet.',
} as const;
export type Dict = Record<keyof typeof en, string>;
```

- [ ] **Step 2: Create `src/i18n/uk.ts`**

```ts
import type { Dict } from './en';

export const uk: Dict = {
  appTitle: 'Погода',
  tabHome: 'Головна',
  tabFavorites: 'Вибране',
  searchPlaceholder: 'Пошук міста…',
  noMatches: 'Нічого не знайдено',
  addToFavorites: 'Додати у вибране',
  removeFromFavorites: 'Видалити з вибраного',
  addBlock: 'Додати блок',
  today: 'Сьогодні',
  fiveDay: '5 днів',
  deleteBlock: 'Видалити блок',
  confirmDeleteBlock: 'Видалити цей блок погоди?',
  cancel: 'Скасувати',
  confirm: 'Видалити',
  maxFavoritesTitle: 'Досягнуто ліміт вибраного',
  maxFavoritesBody: 'Щоб додати місто, спершу видаліть інше — максимум 5.',
  errorCityNotFound: 'Місто не знайдено',
  errorGeneric: 'Не вдалося завантажити погоду. Спробуйте ще раз.',
  retry: 'Повторити',
  feelsLike: 'Відчувається як',
  humidity: 'Вологість',
  wind: 'Вітер',
  emptyFavorites: 'Поки немає вибраних міст.',
};
```

- [ ] **Step 3: Write failing test `src/i18n/i18n.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider, useT } from './index';
import { useSettingsStore } from '../store/settingsStore';

const Probe = () => { const t = useT(); return <span>{t('tabFavorites')}</span>; };

beforeEach(() => useSettingsStore.setState({ language: 'en', theme: 'day' }));

describe('i18n', () => {
  it('renders English by default', () => {
    render(<I18nProvider><Probe /></I18nProvider>);
    expect(screen.getByText('Favorites')).toBeInTheDocument();
  });
  it('switches to Ukrainian', () => {
    useSettingsStore.setState({ language: 'uk', theme: 'day' });
    render(<I18nProvider><Probe /></I18nProvider>);
    expect(screen.getByText('Вибране')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/i18n/i18n.test.tsx`
Expected: FAIL — `./index` not found.

- [ ] **Step 5: Implement `src/i18n/index.tsx`**

```tsx
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { en, type Dict } from './en';
import { uk } from './uk';
import { useSettingsStore, type Language } from '../store/settingsStore';

export const dictionaries: Record<Language, Dict> = { en, uk };

const I18nContext = createContext<(key: keyof Dict) => string>((k) => k);

export function I18nProvider({ children }: { children: ReactNode }) {
  const language = useSettingsStore((s) => s.language);
  const t = useMemo(() => {
    const dict = dictionaries[language];
    return (key: keyof Dict) => dict[key] ?? String(key);
  }, [language]);
  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
}

export const useT = () => useContext(I18nContext);
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/i18n/i18n.test.tsx`
Expected: PASS (both).

- [ ] **Step 7: Commit**

```bash
git add src/i18n
git commit -m "feat: add en/uk i18n provider"
```

---

## Task 9: Theme CSS + theme application hook

**Files:**
- Create: `src/styles/theme.css`
- Modify: `src/App.tsx` (import theme.css, apply `data-theme`)
- Test: `src/styles/theme.test.tsx`

**Interfaces:**
- Produces: CSS custom properties under `:root` and `[data-theme="night"]`; `App` sets `document.documentElement.dataset.theme` from `useSettingsStore.theme`.

- [ ] **Step 1: Create `src/styles/theme.css`**

```css
:root {
  --bg: #f0f4f8; --surface: #ffffff; --text: #1a2330; --muted: #5b6b7c;
  --accent: #2f7ed8; --border: #d8e0e8; --shadow: rgba(0,0,0,0.08);
}
[data-theme="night"] {
  --bg: #0f1722; --surface: #1a2535; --text: #e6edf5; --muted: #9fb0c2;
  --accent: #5aa0ec; --border: #2a3a4f; --shadow: rgba(0,0,0,0.4);
}
body { background: var(--bg); color: var(--text); transition: background .2s, color .2s; }
```

- [ ] **Step 2: Write failing test `src/styles/theme.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';
import { useSettingsStore } from '../store/settingsStore';

beforeEach(() => useSettingsStore.setState({ language: 'en', theme: 'night' }));

describe('theme application', () => {
  it('sets data-theme on <html>', () => {
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('night');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/styles/theme.test.tsx`
Expected: FAIL — `data-theme` is undefined (App doesn't set it yet).

- [ ] **Step 4: Update `src/App.tsx`**

```tsx
import { useEffect } from 'react';
import './styles/global.css';
import './styles/theme.css';
import { useSettingsStore } from './store/settingsStore';

export default function App() {
  const theme = useSettingsStore((s) => s.theme);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  return <div data-testid="app-root" className="container">Weather App</div>;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/styles/theme.test.tsx src/App.test.tsx`
Expected: PASS (both).

- [ ] **Step 6: Commit**

```bash
git add src/styles/theme.css src/App.tsx src/styles/theme.test.tsx
git commit -m "feat: add day/night theme variables and application"
```

---

## Task 10: Spinner + Modal common components

**Files:**
- Create: `src/components/common/Spinner.tsx`, `src/components/common/Spinner.module.css`, `src/components/common/Modal.tsx`, `src/components/common/Modal.module.css`
- Test: `src/components/common/Modal.test.tsx`

**Interfaces:**
- Produces:
  - `Spinner()` → a `role="status"` element.
  - `Modal({ open, title, children, confirmLabel?, cancelLabel?, onConfirm?, onCancel, mode })` where `mode: 'confirm' | 'alert'`. Renders nothing when `!open`. Confirm mode shows confirm + cancel buttons; alert mode shows a single OK button calling `onCancel`. Backdrop click and the cancel button call `onCancel`.

- [ ] **Step 1: Create `src/components/common/Spinner.module.css`**

```css
.spinner { width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
```

- [ ] **Step 2: Create `src/components/common/Spinner.tsx`**

```tsx
import styles from './Spinner.module.css';
export default function Spinner() {
  return <div className={styles.spinner} role="status" aria-label="loading" />;
}
```

- [ ] **Step 3: Create `src/components/common/Modal.module.css`**

```css
.backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: var(--surface); color: var(--text); border-radius: 12px; padding: 24px; max-width: 90vw; width: 360px; box-shadow: 0 8px 30px var(--shadow); }
.title { margin: 0 0 12px; font-size: 1.1rem; }
.actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
.btn { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); cursor: pointer; background: var(--surface); color: var(--text); }
.confirm { background: var(--accent); color: #fff; border-color: var(--accent); }
```

- [ ] **Step 4: Write failing test `src/components/common/Modal.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<Modal open={false} title="X" onCancel={() => {}} mode="confirm" />);
    expect(container).toBeEmptyDOMElement();
  });
  it('confirm mode fires onConfirm and onCancel', async () => {
    const onConfirm = vi.fn(); const onCancel = vi.fn();
    render(<Modal open title="Delete?" mode="confirm" confirmLabel="Delete" cancelLabel="Cancel"
      onConfirm={onConfirm} onCancel={onCancel} />);
    await userEvent.click(screen.getByText('Delete'));
    await userEvent.click(screen.getByText('Cancel'));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx vitest run src/components/common/Modal.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `src/components/common/Modal.tsx`**

```tsx
import type { ReactNode } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  mode: 'confirm' | 'alert';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel: () => void;
}

export default function Modal({ open, title, children, mode, confirmLabel = 'OK', cancelLabel = 'Cancel', onConfirm, onCancel }: ModalProps) {
  if (!open) return null;
  return (
    <div className={styles.backdrop} onClick={onCancel} role="presentation">
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{title}</h2>
        {children && <div>{children}</div>}
        <div className={styles.actions}>
          {mode === 'confirm' ? (
            <>
              <button className={styles.btn} onClick={onCancel}>{cancelLabel}</button>
              <button className={`${styles.btn} ${styles.confirm}`} onClick={onConfirm}>{confirmLabel}</button>
            </>
          ) : (
            <button className={`${styles.btn} ${styles.confirm}`} onClick={onCancel}>{confirmLabel}</button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run src/components/common/Modal.test.tsx`
Expected: PASS (both).

- [ ] **Step 8: Commit**

```bash
git add src/components/common
git commit -m "feat: add Spinner and Modal components"
```

---

## Task 11: useDebounce + CityAutocomplete

**Files:**
- Create: `src/hooks/useDebounce.ts`, `src/components/search/CityAutocomplete.tsx`, `src/components/search/CityAutocomplete.module.css`
- Test: `src/components/search/CityAutocomplete.test.tsx`

**Interfaces:**
- Consumes: `searchCities` (mocked in test), `useT`, `GeoSuggestion`, `City`.
- Produces:
  - `useDebounce<T>(value: T, delay: number): T`
  - `CityAutocomplete({ onSelect }: { onSelect: (c: City) => void })` — debounced input that calls `searchCities`, shows a suggestion list, and calls `onSelect` with a `City` on click.

- [ ] **Step 1: Implement `src/hooks/useDebounce.ts`**

```ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
```

- [ ] **Step 2: Create `src/components/search/CityAutocomplete.module.css`**

```css
.wrap { position: relative; }
.input { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--text); font-size: 1rem; }
.list { position: absolute; z-index: 10; left: 0; right: 0; margin: 4px 0 0; padding: 0; list-style: none; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 6px 20px var(--shadow); max-height: 240px; overflow: auto; }
.item { padding: 8px 12px; cursor: pointer; }
.item:hover { background: var(--bg); }
.empty { padding: 8px 12px; color: var(--muted); }
```

- [ ] **Step 3: Write failing test `src/components/search/CityAutocomplete.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CityAutocomplete from './CityAutocomplete';
import { I18nProvider } from '../../i18n';
import * as api from '../../services/weatherApi';

beforeEach(() => vi.restoreAllMocks());

const renderC = (onSelect = vi.fn()) =>
  render(<I18nProvider><CityAutocomplete onSelect={onSelect} /></I18nProvider>);

describe('CityAutocomplete', () => {
  it('searches after typing and selects a suggestion', async () => {
    vi.spyOn(api, 'searchCities').mockResolvedValue([
      { name: 'London', country: 'GB', lat: 51.5, lon: -0.12 },
    ]);
    const onSelect = vi.fn();
    renderC(onSelect);
    await userEvent.type(screen.getByRole('textbox'), 'London');
    const option = await screen.findByText(/London/);
    await userEvent.click(option);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'London', lat: 51.5 }));
  });
  it('shows no-matches when search returns empty', async () => {
    vi.spyOn(api, 'searchCities').mockResolvedValue([]);
    renderC();
    await userEvent.type(screen.getByRole('textbox'), 'zzzz');
    await waitFor(() => expect(screen.getByText('No matches')).toBeInTheDocument());
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/components/search/CityAutocomplete.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 5: Implement `src/components/search/CityAutocomplete.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { searchCities } from '../../services/weatherApi';
import { useDebounce } from '../../hooks/useDebounce';
import { useT } from '../../i18n';
import type { City, GeoSuggestion } from '../../types/weather';
import styles from './CityAutocomplete.module.css';

const toCity = (s: GeoSuggestion): City => ({ name: s.name, country: s.country, state: s.state, lat: s.lat, lon: s.lon });
const label = (s: GeoSuggestion) => [s.name, s.state, s.country].filter(Boolean).join(', ');

export default function CityAutocomplete({ onSelect }: { onSelect: (c: City) => void }) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounced = useDebounce(query, 350);

  useEffect(() => {
    const q = debounced.trim();
    if (!q) { setResults([]); setSearched(false); return; }
    let active = true;
    searchCities(q).then((r) => { if (active) { setResults(r); setSearched(true); setOpen(true); } }).catch(() => { if (active) { setResults([]); setSearched(true); } });
    return () => { active = false; };
  }, [debounced]);

  const pick = (s: GeoSuggestion) => { onSelect(toCity(s)); setQuery(label(s)); setOpen(false); };

  return (
    <div className={styles.wrap}>
      <input className={styles.input} type="text" role="textbox" placeholder={t('searchPlaceholder')}
        value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} />
      {open && searched && (
        <ul className={styles.list}>
          {results.length === 0 ? (
            <li className={styles.empty}>{t('noMatches')}</li>
          ) : results.map((s) => (
            <li key={`${s.lat},${s.lon}`} className={styles.item} onClick={() => pick(s)}>{label(s)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/components/search/CityAutocomplete.test.tsx`
Expected: PASS (both).

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useDebounce.ts src/components/search
git commit -m "feat: add debounced city autocomplete"
```

---

## Task 12: useWeather hook

**Files:**
- Create: `src/hooks/useWeather.ts`
- Test: `src/hooks/useWeather.test.tsx`

**Interfaces:**
- Consumes: `getCurrentWeather`, `getForecast`, `toHourlyToday`, `toDailyForecast`, `useSettingsStore`, `ApiError`, `City`, `WeatherData`.
- Produces: `useWeather(city: City | null): { data: WeatherData | null; loading: boolean; error: 'notfound' | 'generic' | null; reload: () => void }`. Re-fetches when city identity or language changes.

- [ ] **Step 1: Write failing test `src/hooks/useWeather.test.tsx`**

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useWeather.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/hooks/useWeather.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/useWeather.test.tsx`
Expected: PASS (both).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useWeather.ts src/hooks/useWeather.test.tsx
git commit -m "feat: add useWeather data-loading hook"
```

---

## Task 13: PeriodToggle + TemperatureChart

**Files:**
- Create: `src/components/weather/PeriodToggle.tsx`, `src/components/weather/PeriodToggle.module.css`, `src/components/weather/TemperatureChart.tsx`, `src/components/weather/TemperatureChart.module.css`
- Test: `src/components/weather/PeriodToggle.test.tsx`

**Interfaces:**
- Consumes: `Period`, `useT`, Chart.js.
- Produces:
  - `PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void })`
  - `TemperatureChart({ labels, temps }: { labels: string[]; temps: number[] })` — renders a `<canvas>`, creates a Chart.js line chart, destroys/recreates on data change and unmount.

- [ ] **Step 1: Create `src/components/weather/PeriodToggle.module.css`**

```css
.toggle { display: inline-flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.btn { padding: 6px 14px; background: var(--surface); color: var(--text); border: none; cursor: pointer; }
.active { background: var(--accent); color: #fff; }
```

- [ ] **Step 2: Write failing test `src/components/weather/PeriodToggle.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PeriodToggle from './PeriodToggle';
import { I18nProvider } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';

beforeEach(() => useSettingsStore.setState({ language: 'en', theme: 'day' }));

describe('PeriodToggle', () => {
  it('calls onChange with the other period', async () => {
    const onChange = vi.fn();
    render(<I18nProvider><PeriodToggle value="today" onChange={onChange} /></I18nProvider>);
    await userEvent.click(screen.getByText('5 days'));
    expect(onChange).toHaveBeenCalledWith('5day');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/weather/PeriodToggle.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `src/components/weather/PeriodToggle.tsx`**

```tsx
import { useT } from '../../i18n';
import type { Period } from '../../types/weather';
import styles from './PeriodToggle.module.css';

export default function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const t = useT();
  return (
    <div className={styles.toggle} role="group">
      <button className={`${styles.btn} ${value === 'today' ? styles.active : ''}`} onClick={() => onChange('today')}>{t('today')}</button>
      <button className={`${styles.btn} ${value === '5day' ? styles.active : ''}`} onClick={() => onChange('5day')}>{t('fiveDay')}</button>
    </div>
  );
}
```

- [ ] **Step 5: Create `src/components/weather/TemperatureChart.module.css`**

```css
.wrap { position: relative; width: 100%; height: 240px; }
```

- [ ] **Step 6: Implement `src/components/weather/TemperatureChart.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler } from 'chart.js';
import styles from './TemperatureChart.module.css';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

export default function TemperatureChart({ labels, temps }: { labels: string[]; temps: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2f7ed8';
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: { labels, datasets: [{ data: temps, borderColor: accent, backgroundColor: accent + '33', fill: true, tension: 0.35, pointRadius: 3 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: (v) => `${v}°` } } } },
    });
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [labels, temps]);

  return <div className={styles.wrap}><canvas ref={canvasRef} /></div>;
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run src/components/weather/PeriodToggle.test.tsx`
Expected: PASS. (Chart is exercised via integration in Task 14; jsdom canvas is not unit-tested here.)

- [ ] **Step 8: Commit**

```bash
git add src/components/weather/PeriodToggle.tsx src/components/weather/PeriodToggle.module.css src/components/weather/TemperatureChart.tsx src/components/weather/TemperatureChart.module.css src/components/weather/PeriodToggle.test.tsx
git commit -m "feat: add period toggle and temperature chart"
```

---

## Task 14: WeatherCard

**Files:**
- Create: `src/components/weather/WeatherCard.tsx`, `src/components/weather/WeatherCard.module.css`
- Test: `src/components/weather/WeatherCard.test.tsx`

**Interfaces:**
- Consumes: `WeatherData`, `City`, `Period`, `useT`.
- Produces: `WeatherCard({ data, period, city, isFavorite, onToggleFavorite, showFavorite })` — in `today` mode shows current temp/desc/feels-like/humidity/wind; in `5day` mode shows the 5 daily averages. A favorite star button (when `showFavorite`) reflects `isFavorite` and calls `onToggleFavorite`. Owm icon via `https://openweathermap.org/img/wn/{icon}@2x.png`.

- [ ] **Step 1: Create `src/components/weather/WeatherCard.module.css`**

```css
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; box-shadow: 0 2px 10px var(--shadow); }
.favorited { outline: 2px solid var(--accent); }
.head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.temp { font-size: 2.4rem; font-weight: 700; }
.meta { color: var(--muted); font-size: .9rem; display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px; }
.star { background: none; border: none; cursor: pointer; font-size: 1.4rem; line-height: 1; }
.days { display: flex; gap: 8px; flex-wrap: wrap; }
.day { flex: 1 1 80px; text-align: center; background: var(--bg); border-radius: 8px; padding: 8px; }
```

- [ ] **Step 2: Write failing test `src/components/weather/WeatherCard.test.tsx`**

```tsx
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/weather/WeatherCard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `src/components/weather/WeatherCard.tsx`**

```tsx
import { useT } from '../../i18n';
import type { WeatherData, City, Period } from '../../types/weather';
import styles from './WeatherCard.module.css';

const iconUrl = (icon: string) => `https://openweathermap.org/img/wn/${icon}@2x.png`;

interface Props {
  data: WeatherData;
  period: Period;
  city: City;
  isFavorite: boolean;
  showFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function WeatherCard({ data, period, city, isFavorite, showFavorite, onToggleFavorite }: Props) {
  const t = useT();
  const { current, daily } = data;
  return (
    <div className={`${styles.card} ${isFavorite ? styles.favorited : ''}`}>
      <div className={styles.head}>
        <div>
          <strong>{city.name}{city.country ? `, ${city.country}` : ''}</strong>
        </div>
        {showFavorite && (
          <button className={styles.star} onClick={onToggleFavorite}
            aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
            aria-pressed={isFavorite}>{isFavorite ? '★' : '☆'}</button>
        )}
      </div>
      {period === 'today' ? (
        <>
          <div className={styles.head}>
            <span className={styles.temp}>{Math.round(current.main.temp)}°</span>
            <img src={iconUrl(current.weather[0].icon)} alt={current.weather[0].description} width={64} height={64} />
          </div>
          <div>{current.weather[0].description}</div>
          <div className={styles.meta}>
            <span>{t('feelsLike')}: {Math.round(current.main.feels_like)}°</span>
            <span>{t('humidity')}: {current.main.humidity}%</span>
            <span>{t('wind')}: {Math.round(current.wind.speed)} m/s</span>
          </div>
        </>
      ) : (
        <div className={styles.days}>
          {daily.map((d) => (
            <div key={d.date} className={styles.day}>
              <div>{d.date.slice(5)}</div>
              <img src={iconUrl(d.icon)} alt={d.description} width={40} height={40} />
              <div><strong>{Math.round(d.avgTemp)}°</strong></div>
              <div className={styles.meta}>{Math.round(d.min)}° / {Math.round(d.max)}°</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/weather/WeatherCard.test.tsx`
Expected: PASS (both).

- [ ] **Step 6: Commit**

```bash
git add src/components/weather/WeatherCard.tsx src/components/weather/WeatherCard.module.css src/components/weather/WeatherCard.test.tsx
git commit -m "feat: add weather card (today + 5-day)"
```

---

## Task 15: WeatherBlock (composition)

**Files:**
- Create: `src/components/weather/WeatherBlock.tsx`, `src/components/weather/WeatherBlock.module.css`
- Test: `src/components/weather/WeatherBlock.test.tsx`

**Interfaces:**
- Consumes: `useWeather`, `useFavoritesStore`, `Modal`, `Spinner`, `CityAutocomplete`, `PeriodToggle`, `WeatherCard`, `TemperatureChart`, `useT`, `City`, `Period`.
- Produces: `WeatherBlock({ city, period, onCityChange, onPeriodChange, onDelete, allowCityEdit, allowDelete })`. Shows autocomplete when `allowCityEdit`; loads weather via `useWeather`; renders Spinner while loading, error + retry on error, card + chart on success; favorite star toggles favorites (with max-5 alert modal); delete button (when `allowDelete`) opens a confirm modal.

- [ ] **Step 1: Write failing test `src/components/weather/WeatherBlock.test.tsx`**

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/weather/WeatherBlock.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/components/weather/WeatherBlock.module.css`**

```css
.block { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.row { display: flex; gap: 8px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
.delete { background: none; border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; cursor: pointer; color: var(--text); }
.center { display: flex; justify-content: center; padding: 24px; }
.error { color: var(--muted); text-align: center; padding: 16px; }
```

- [ ] **Step 4: Implement `src/components/weather/WeatherBlock.tsx`**

```tsx
import { useState } from 'react';
import { useWeather } from '../../hooks/useWeather';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useT } from '../../i18n';
import CityAutocomplete from '../search/CityAutocomplete';
import PeriodToggle from './PeriodToggle';
import WeatherCard from './WeatherCard';
import TemperatureChart from './TemperatureChart';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';
import type { City, Period } from '../../types/weather';
import styles from './WeatherBlock.module.css';

interface Props {
  city: City | null;
  period: Period;
  allowCityEdit: boolean;
  allowDelete: boolean;
  onCityChange: (c: City) => void;
  onPeriodChange: (p: Period) => void;
  onDelete: () => void;
}

export default function WeatherBlock({ city, period, allowCityEdit, allowDelete, onCityChange, onPeriodChange, onDelete }: Props) {
  const t = useT();
  const { data, loading, error, reload } = useWeather(city);
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [maxAlert, setMaxAlert] = useState(false);

  const favorited = city ? isFavorite(city) : false;
  const toggleFavorite = () => {
    if (!city) return;
    if (favorited) { removeFavorite(city); return; }
    if (!addFavorite(city)) setMaxAlert(true);
  };

  return (
    <div className={styles.block}>
      <div className={styles.row}>
        {allowCityEdit ? <div style={{ flex: 1 }}><CityAutocomplete onSelect={onCityChange} /></div>
          : <strong>{city?.name}</strong>}
        {allowDelete && <button className={styles.delete} onClick={() => setConfirmDelete(true)} aria-label={t('deleteBlock')}>✕</button>}
      </div>

      <div className={styles.row}>
        <PeriodToggle value={period} onChange={onPeriodChange} />
      </div>

      {!city && <div className={styles.error}>{t('searchPlaceholder')}</div>}
      {loading && <div className={styles.center}><Spinner /></div>}
      {error && !loading && (
        <div className={styles.error}>
          <p>{error === 'notfound' ? t('errorCityNotFound') : t('errorGeneric')}</p>
          <button className={styles.delete} onClick={reload}>{t('retry')}</button>
        </div>
      )}
      {data && !loading && !error && city && (
        <>
          <WeatherCard data={data} period={period} city={city}
            isFavorite={favorited} showFavorite onToggleFavorite={toggleFavorite} />
          <TemperatureChart
            labels={period === 'today' ? data.hourly.map((h) => h.time) : data.daily.map((d) => d.date.slice(5))}
            temps={period === 'today' ? data.hourly.map((h) => h.temp) : data.daily.map((d) => d.avgTemp)} />
        </>
      )}

      <Modal open={confirmDelete} mode="confirm" title={t('confirmDeleteBlock')}
        confirmLabel={t('confirm')} cancelLabel={t('cancel')}
        onConfirm={() => { setConfirmDelete(false); onDelete(); }} onCancel={() => setConfirmDelete(false)} />
      <Modal open={maxAlert} mode="alert" title={t('maxFavoritesTitle')}
        confirmLabel={t('cancel')} onCancel={() => setMaxAlert(false)}>
        {t('maxFavoritesBody')}
      </Modal>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/weather/WeatherBlock.test.tsx`
Expected: PASS (all 3).

- [ ] **Step 6: Commit**

```bash
git add src/components/weather/WeatherBlock.tsx src/components/weather/WeatherBlock.module.css src/components/weather/WeatherBlock.test.tsx
git commit -m "feat: add WeatherBlock composition with delete + favorites guards"
```

---

## Task 16: HomeTab (blocks list + add)

**Files:**
- Create: `src/components/home/HomeTab.tsx`, `src/components/home/HomeTab.module.css`
- Test: `src/components/home/HomeTab.test.tsx`

**Interfaces:**
- Consumes: `useBlocksStore`, `MAX_BLOCKS`, `WeatherBlock`, `useT`, `getLocationByIp`.
- Produces: `HomeTab()` — renders one `WeatherBlock` per store block, an "Add block" button disabled at `MAX_BLOCKS`, and on first mount (only if the single default block has no city) auto-loads the IP city into block 1.

- [ ] **Step 1: Write failing test `src/components/home/HomeTab.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomeTab from './HomeTab';
import { I18nProvider } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { useBlocksStore, makeEmptyBlock } from '../../store/blocksStore';
import * as geo from '../../services/geo';
import * as api from '../../services/weatherApi';

beforeEach(() => {
  useSettingsStore.setState({ language: 'en', theme: 'day' });
  useBlocksStore.setState({ blocks: [makeEmptyBlock()] });
  vi.restoreAllMocks();
  vi.spyOn(geo, 'getLocationByIp').mockResolvedValue({ name: 'Kyiv', country: 'UA', lat: 1, lon: 2 });
  vi.spyOn(api, 'getCurrentWeather').mockResolvedValue({
    name: 'Kyiv', dt: 0, main: { temp: 20, feels_like: 19, humidity: 50, temp_min: 18, temp_max: 22 },
    weather: [{ icon: '01d', description: 'clear', main: 'Clear' }], wind: { speed: 3 }, sys: { country: 'UA' } });
  vi.spyOn(api, 'getForecast').mockResolvedValue({ city: { name: 'Kyiv', country: 'UA' },
    list: [{ dt: 0, dt_txt: '2026-06-23 12:00:00', main: { temp: 21, temp_min: 20, temp_max: 22 }, weather: [{ icon: '01d', description: 'clear', main: 'Clear' }] }] });
});

const renderHome = () => render(<I18nProvider><HomeTab /></I18nProvider>);

describe('HomeTab', () => {
  it('auto-loads the IP city into the first block', async () => {
    renderHome();
    await waitFor(() => expect(useBlocksStore.getState().blocks[0].city?.name).toBe('Kyiv'));
  });
  it('adds blocks up to 5 then disables the button', async () => {
    renderHome();
    const addBtn = await screen.findByRole('button', { name: /add block/i });
    for (let i = 0; i < 4; i++) await userEvent.click(addBtn);
    expect(useBlocksStore.getState().blocks).toHaveLength(5);
    expect(addBtn).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/home/HomeTab.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/components/home/HomeTab.module.css`**

```css
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.addBar { margin: 16px 0; }
.add { padding: 10px 18px; border-radius: 8px; border: 1px solid var(--accent); background: var(--accent); color: #fff; cursor: pointer; }
.add:disabled { opacity: .5; cursor: not-allowed; }
```

- [ ] **Step 4: Implement `src/components/home/HomeTab.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import { useBlocksStore, MAX_BLOCKS } from '../../store/blocksStore';
import { getLocationByIp } from '../../services/geo';
import { useT } from '../../i18n';
import WeatherBlock from '../weather/WeatherBlock';
import styles from './HomeTab.module.css';

export default function HomeTab() {
  const t = useT();
  const { blocks, addBlock, removeBlock, setBlockCity, setBlockPeriod } = useBlocksStore();
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const only = useBlocksStore.getState().blocks;
    if (only.length === 1 && only[0].city === null) {
      getLocationByIp().then((city) => setBlockCity(only[0].id, city)).catch(() => {});
    }
  }, [setBlockCity]);

  return (
    <div>
      <div className={styles.addBar}>
        <button className={styles.add} onClick={addBlock} disabled={blocks.length >= MAX_BLOCKS}>
          + {t('addBlock')}
        </button>
      </div>
      <div className={styles.grid}>
        {blocks.map((b) => (
          <WeatherBlock key={b.id} city={b.city} period={b.period}
            allowCityEdit allowDelete={blocks.length > 1}
            onCityChange={(c) => setBlockCity(b.id, c)}
            onPeriodChange={(p) => setBlockPeriod(b.id, p)}
            onDelete={() => removeBlock(b.id)} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/home/HomeTab.test.tsx`
Expected: PASS (both).

- [ ] **Step 6: Commit**

```bash
git add src/components/home
git commit -m "feat: add HomeTab with IP default and add-block cap"
```

---

## Task 17: FavoritesTab

**Files:**
- Create: `src/components/favorites/FavoritesTab.tsx`, `src/components/favorites/FavoritesTab.module.css`
- Test: `src/components/favorites/FavoritesTab.test.tsx`

**Interfaces:**
- Consumes: `useFavoritesStore`, `WeatherBlock`, `useT`, `cityKey`, `Period`.
- Produces: `FavoritesTab()` — one read-only `WeatherBlock` per favorite (`allowCityEdit={false}`, `allowDelete={false}`), each with local period state; empty-state message when no favorites.

- [ ] **Step 1: Write failing test `src/components/favorites/FavoritesTab.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import FavoritesTab from './FavoritesTab';
import { I18nProvider } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import * as api from '../../services/weatherApi';

beforeEach(() => {
  useSettingsStore.setState({ language: 'en', theme: 'day' });
  useFavoritesStore.setState({ favorites: [] });
  vi.restoreAllMocks();
  vi.spyOn(api, 'getCurrentWeather').mockResolvedValue({
    name: 'Kyiv', dt: 0, main: { temp: 20, feels_like: 19, humidity: 50, temp_min: 18, temp_max: 22 },
    weather: [{ icon: '01d', description: 'clear', main: 'Clear' }], wind: { speed: 3 }, sys: { country: 'UA' } });
  vi.spyOn(api, 'getForecast').mockResolvedValue({ city: { name: 'Kyiv', country: 'UA' },
    list: [{ dt: 0, dt_txt: '2026-06-23 12:00:00', main: { temp: 21, temp_min: 20, temp_max: 22 }, weather: [{ icon: '01d', description: 'clear', main: 'Clear' }] }] });
});

describe('FavoritesTab', () => {
  it('shows empty message with no favorites', () => {
    render(<I18nProvider><FavoritesTab /></I18nProvider>);
    expect(screen.getByText(/No favorite cities yet/i)).toBeInTheDocument();
  });
  it('renders a block per favorite without a search input', async () => {
    useFavoritesStore.setState({ favorites: [{ name: 'Kyiv', country: 'UA', lat: 1, lon: 2 }] });
    render(<I18nProvider><FavoritesTab /></I18nProvider>);
    await waitFor(() => expect(screen.getByText(/20/)).toBeInTheDocument());
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/favorites/FavoritesTab.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/components/favorites/FavoritesTab.module.css`**

```css
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.empty { color: var(--muted); padding: 24px; text-align: center; }
```

- [ ] **Step 4: Implement `src/components/favorites/FavoritesTab.tsx`**

```tsx
import { useState } from 'react';
import { useFavoritesStore, cityKey } from '../../store/favoritesStore';
import { useT } from '../../i18n';
import WeatherBlock from '../weather/WeatherBlock';
import type { Period } from '../../types/weather';
import styles from './FavoritesTab.module.css';

export default function FavoritesTab() {
  const t = useT();
  const favorites = useFavoritesStore((s) => s.favorites);
  const [periods, setPeriods] = useState<Record<string, Period>>({});

  if (favorites.length === 0) return <div className={styles.empty}>{t('emptyFavorites')}</div>;

  return (
    <div className={styles.grid}>
      {favorites.map((c) => {
        const key = cityKey(c);
        return (
          <WeatherBlock key={key} city={c} period={periods[key] ?? 'today'}
            allowCityEdit={false} allowDelete={false}
            onCityChange={() => {}}
            onPeriodChange={(p) => setPeriods((prev) => ({ ...prev, [key]: p }))}
            onDelete={() => {}} />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/favorites/FavoritesTab.test.tsx`
Expected: PASS (both).

- [ ] **Step 6: Commit**

```bash
git add src/components/favorites
git commit -m "feat: add FavoritesTab"
```

---

## Task 18: Header + Tabs + App integration

**Files:**
- Create: `src/components/layout/Header.tsx`, `src/components/layout/Header.module.css`, `src/components/layout/Tabs.tsx`, `src/components/layout/Tabs.module.css`
- Modify: `src/App.tsx`, `src/main.tsx`
- Test: `src/App.integration.test.tsx`

**Interfaces:**
- Consumes: `useSettingsStore`, `useT`, `HomeTab`, `FavoritesTab`, `I18nProvider`.
- Produces:
  - `Header()` — logo/title, theme toggle button, en/uk language switch.
  - `Tabs({ active, onChange }: { active: 'home'|'favorites'; onChange: (t) => void })`.
  - `App` wraps everything in `I18nProvider`, holds active-tab state, renders Header + Tabs + the active tab.

- [ ] **Step 1: Create `src/components/layout/Header.module.css`**

```css
.header { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; gap: 12px; flex-wrap: wrap; }
.logo { font-size: 1.3rem; font-weight: 700; color: var(--accent); }
.controls { display: flex; gap: 8px; }
.btn { padding: 6px 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--text); cursor: pointer; }
.active { background: var(--accent); color: #fff; border-color: var(--accent); }
```

- [ ] **Step 2: Create `src/components/layout/Header.tsx`**

```tsx
import { useSettingsStore } from '../../store/settingsStore';
import { useT } from '../../i18n';
import styles from './Header.module.css';

export default function Header() {
  const t = useT();
  const { theme, toggleTheme, language, setLanguage } = useSettingsStore();
  return (
    <header className={styles.header}>
      <span className={styles.logo}>☀ {t('appTitle')}</span>
      <div className={styles.controls}>
        <button className={styles.btn} onClick={toggleTheme} aria-label="toggle theme">
          {theme === 'day' ? '🌙' : '☀'}
        </button>
        <button className={`${styles.btn} ${language === 'en' ? styles.active : ''}`} onClick={() => setLanguage('en')}>EN</button>
        <button className={`${styles.btn} ${language === 'uk' ? styles.active : ''}`} onClick={() => setLanguage('uk')}>UK</button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create `src/components/layout/Tabs.module.css`**

```css
.tabs { display: flex; gap: 8px; border-bottom: 1px solid var(--border); margin-bottom: 16px; }
.tab { padding: 10px 16px; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; color: var(--muted); font-size: 1rem; }
.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }
```

- [ ] **Step 4: Create `src/components/layout/Tabs.tsx`**

```tsx
import { useT } from '../../i18n';
import styles from './Tabs.module.css';

export type TabKey = 'home' | 'favorites';

export default function Tabs({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  const t = useT();
  return (
    <nav className={styles.tabs}>
      <button className={`${styles.tab} ${active === 'home' ? styles.active : ''}`} onClick={() => onChange('home')}>{t('tabHome')}</button>
      <button className={`${styles.tab} ${active === 'favorites' ? styles.active : ''}`} onClick={() => onChange('favorites')}>{t('tabFavorites')}</button>
    </nav>
  );
}
```

- [ ] **Step 5: Write failing test `src/App.integration.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { useSettingsStore } from './store/settingsStore';
import { useFavoritesStore } from './store/favoritesStore';
import { useBlocksStore, makeEmptyBlock } from './store/blocksStore';
import * as geo from './services/geo';

beforeEach(() => {
  useSettingsStore.setState({ language: 'en', theme: 'day' });
  useFavoritesStore.setState({ favorites: [] });
  useBlocksStore.setState({ blocks: [makeEmptyBlock()] });
  vi.restoreAllMocks();
  vi.spyOn(geo, 'getLocationByIp').mockResolvedValue({ name: 'Kyiv', country: 'UA', lat: 1, lon: 2 });
});

describe('App integration', () => {
  it('switches tabs and language', async () => {
    render(<App />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Favorites'));
    expect(screen.getByText(/No favorite cities yet/i)).toBeInTheDocument();
    await userEvent.click(screen.getByText('UK'));
    expect(screen.getByText('Вибране')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/App.integration.test.tsx`
Expected: FAIL — App has no tabs yet.

- [ ] **Step 7: Replace `src/App.tsx`**

```tsx
import { useEffect, useState } from 'react';
import './styles/global.css';
import './styles/theme.css';
import { useSettingsStore } from './store/settingsStore';
import { I18nProvider } from './i18n';
import Header from './components/layout/Header';
import Tabs, { type TabKey } from './components/layout/Tabs';
import HomeTab from './components/home/HomeTab';
import FavoritesTab from './components/favorites/FavoritesTab';

export default function App() {
  const theme = useSettingsStore((s) => s.theme);
  const [tab, setTab] = useState<TabKey>('home');
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  return (
    <I18nProvider>
      <div data-testid="app-root" className="container">
        <Header />
        <Tabs active={tab} onChange={setTab} />
        {tab === 'home' ? <HomeTab /> : <FavoritesTab />}
      </div>
    </I18nProvider>
  );
}
```

- [ ] **Step 8: Run the full suite**

Run: `npm test`
Expected: all tests pass (App smoke test still asserts `app-root`, integration test passes).

- [ ] **Step 9: Commit**

```bash
git add src/components/layout src/App.tsx src/App.integration.test.tsx
git commit -m "feat: wire Header, Tabs, and tab routing into App"
```

---

## Task 19: README + deployment config

**Files:**
- Create: `README.md`, `vercel.json`
- Modify: `package.json` (ensure `build` + `preview` scripts exist from Vite scaffold)

**Interfaces:**
- Produces: documentation + SPA rewrite config. No code interfaces.

- [ ] **Step 1: Create `vercel.json` (SPA rewrite)**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

- [ ] **Step 2: Create `README.md`**

````markdown
# Weather App

Responsive weather app on the OpenWeatherMap API. React + TypeScript + Vite, Zustand, Chart.js, plain CSS.

## Features
- City autocomplete (OWM Geocoding API)
- Current-day weather card + hourly (3-hour step) temperature chart
- Up to 5 independent weather blocks (add/remove with confirmation)
- Favorites tab (persisted to localStorage, max 5) with day / 5-day toggle
- **Bonus:** 5-day forecast (daily averages), IP-based default city, preloaders, en/uk i18n, day/night theme

## Setup
```bash
cp .env.example .env   # then set VITE_OPENWEATHER_API_KEY
npm install
npm run dev
```

## Scripts
- `npm run dev` — dev server
- `npm test` — run unit/integration tests
- `npm run build` — production build

## Notes
- The free OpenWeatherMap tier provides forecast in 3-hour steps, so the "hourly" chart plots the current day's ~8 three-hour points.

## Deployment
Deployed on Vercel. Set `VITE_OPENWEATHER_API_KEY` as an environment variable in the Vercel project.

Live: <DEPLOYED_URL>
````

- [ ] **Step 3: Verify build succeeds**

Run: `npm run build`
Expected: `dist/` produced, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add README.md vercel.json package.json
git commit -m "docs: add README and Vercel SPA config"
```

---

## Task 20: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all test files pass.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manual smoke (requires real API key in `.env`)**

Run: `npm run dev`, open the app, and verify: IP city loads in block 1; search + select a city; today/5-day toggle swaps card + chart; add up to 5 blocks (button disables); delete asks for confirmation; favoriting works and persists across reload; 6th favorite shows the limit modal; theme + language toggles work; layout holds at 360px width.

- [ ] **Step 5: Commit any fixes, then deploy**

Deploy to Vercel, set `VITE_OPENWEATHER_API_KEY`, update `README.md` `<DEPLOYED_URL>`, and commit.

```bash
git add -A
git commit -m "chore: finalize deploy URL in README"
```

---

## Self-Review Notes

- **Spec coverage:** autocomplete (T11), fetch (T4), current card (T14), hourly chart (T13/T15), multi-block max-5 (T7/T16), delete confirm modal (T10/T15), favorites tab + localStorage + max-5 + alert modal + read-only blocks (T6/T15/T17), responsive container (T1/T9/T16), #9 5-day toggle (T3/T13/T14/T15), #10 IP default (T4/T16), #11 preloaders (T10/T15), #12 i18n (T8/T18 + `lang` param in T4), #13 theme (T9/T18), #14 README (T19). All covered.
- **Type consistency:** `City`, `Block`, `Period`, `WeatherData`, `cityKey`, `MAX_FAVORITES`, `MAX_BLOCKS`, `ApiError` used consistently across tasks; store action names match between definition and consumers.
- **Placeholders:** none — every code step is complete; `<DEPLOYED_URL>` in the README is an intentional fill-in completed during deployment (T20).
