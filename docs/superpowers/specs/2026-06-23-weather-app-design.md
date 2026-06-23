# Weather App — Design Spec

**Date:** 2026-06-23
**Context:** Test task for a job application (pandateam.net). Source requirements: `dcs/ТЗ Додаток Weather.docx (2).pdf`.
**Deliverable:** Public repository link + deployed app link, emailed to `job@pandateam.net`.

## 1. Goal

Build a responsive weather application on the OpenWeatherMap API. Users search cities with
autocomplete, view a current-day weather card plus an hourly temperature chart, manage multiple
independent weather blocks (max 5), and maintain a persisted list of favorite cities (max 5) on a
separate tab.

## 2. Constraints (hard)

- **No CSS frameworks, no UI libraries.** Plain CSS only (CSS Modules + CSS custom properties).
- A charting JS library is allowed (Chart.js, vanilla — **not** vue-chartjs).
- Requests via `fetch` (or axios). We use `fetch`.
- Responsive: main container `max-width: 1200px`, fluid down to a **360px** minimum.

## 3. Tech Stack

- **React 18 + TypeScript + Vite** (SPA).
- **Plain CSS:** CSS Modules per component + a global theme layer using CSS custom properties.
- **Chart.js** (vanilla) for the temperature chart.
- **Zustand** with `persist` middleware for state + localStorage.
- **Vitest + React Testing Library** for focused tests.
- **Deployment:** Vercel (Vite SPA + env var).

## 4. Scope

### In scope — core (required)

1. City input with autocomplete.
2. `fetch` for all API requests.
3. Current-day weather card.
4. Hourly temperature chart for the current day (Chart.js).
5. Multiple weather blocks, different cities; default 1; "+" adds a fully-functional block; **max 5**.
6. Delete a block via a confirmation modal.
7. Favorites tab: add/remove favorite cities; favorited state highlighted on the card (icon/frame);
   favorites persisted in localStorage; **max 5** with an over-limit alert modal; favorites-tab blocks
   show only a day/period toggle (no city picker).
8. Responsive layout (1200px → 360px).

### In scope — bonus (all selected)

- **#9** Toggle today (hourly) ↔ 5-day forecast (card + chart by day, using the **average** temperature
  from that day's 3-hour statistics).
- **#10** Default to the user's city via IP geolocation on first load.
- **#11** Preloaders during API requests.
- **#12** i18n en/uk for both UI and API responses (OWM `lang` param).
- **#13** Day/Night theme toggle.
- **#14** (satisfied by documenting the implemented bonus items in the README.)

### Out of scope (YAGNI)

- °C/°F unit toggle — fixed to metric.
- Accounts / login.
- Persisting Home-tab blocks across reloads (only favorites persist, per spec).

## 5. Data / API Layer

**Important constraint:** the free OpenWeatherMap tier returns forecast in **3-hour steps**, not true
per-hour. The "hourly chart for today" plots the current day's ~8 three-hour points. This is the
standard, accepted interpretation for this task and is documented in the README.

API key supplied via `VITE_OPENWEATHER_API_KEY` (`.env`, with a committed `.env.example`). A client-side
key is standard and acceptable for the free tier.

### `src/services/weatherApi.ts` (typed; all accept `units` + `lang`)

- `searchCities(query)` → Geocoding `GET /geo/1.0/direct?q={query}&limit=5` → suggestions
  `{ name, country, state?, lat, lon }`.
- `getCurrentWeather(lat, lon)` → `GET /data/2.5/weather` → current-day card data.
- `getForecast(lat, lon)` → `GET /data/2.5/forecast` → 5-day / 3-hour list (powers both views).

### `src/services/geo.ts`

- `getLocationByIp()` → `ipapi.co` (HTTPS, no key) → `{ city, lat, lon }` for #10.

### `src/services/transforms.ts`

- `toHourlyToday(forecast)` → filter to today's date → `{ time, temp }[]` (≤8) for the chart.
- `toDailyForecast(forecast)` → group by calendar date → per day `{ date, avgTemp, min, max, icon }`
  (avg = mean of that day's 3-hour temps; icon = midday/most-frequent), 5 days.

## 6. State (Zustand)

- **`settingsStore`** *(persisted)* — `{ language: 'en'|'uk', theme: 'day'|'night' }`;
  actions `setLanguage`, `toggleTheme`.
- **`favoritesStore`** *(persisted → localStorage)* — `{ favorites: City[] }`;
  `addFavorite` (rejects when length ≥ 5 → caller shows alert modal), `removeFavorite`,
  `isFavorite(city)`. City identity by `"{lat},{lon}"`.
- **`blocksStore`** *(in-memory)* — `{ blocks: Block[] }`,
  `Block = { id: string, city: City | null, period: 'today' | '5day' }`; initialized with 1 empty block;
  `addBlock` (rejects when length ≥ 5), `removeBlock`, `setBlockCity`, `setBlockPeriod`.

`City = { name: string, country: string, state?: string, lat: number, lon: number }`.

## 7. Component Architecture

```
App                         layout shell, active-tab state
 layout/Header              logo · theme toggle · en/uk switch
 layout/Tabs                Home / Favorites navigation
 home/HomeTab               block list + "+" add button (disabled at 5)
 favorites/FavoritesTab     blocks derived from favorites (read-only city)
 weather/WeatherBlock       one block: [CityAutocomplete?] · PeriodToggle · card · chart · delete
 weather/WeatherCard        current/daily card + favorite star; loading/error states
 weather/TemperatureChart   Chart.js line wrapper (creates/destroys chart on data/unmount)
 weather/PeriodToggle       today / 5-day
 search/CityAutocomplete    debounced input + suggestions dropdown
 common/Modal               generic confirm (delete block) + alert (max favorites)
 common/Spinner             preloader (#11)
hooks/  useWeather          loads current + forecast for a city; exposes { data, loading, error, retry }
hooks/  useDebounce
i18n/   index.ts (t() context/hook) · en.ts · uk.ts
store/  settingsStore.ts · favoritesStore.ts · blocksStore.ts
services/ weatherApi.ts · geo.ts · transforms.ts
styles/ global.css · theme.css (CSS vars; [data-theme="night"])
types/  weather.ts
```

i18n is a lightweight custom context (`t(key)` + two dictionaries) — no library needed for this scope.
The OWM `lang` param localizes API-returned descriptions.

## 8. Data Flow

1. App mounts → `settingsStore` hydrates → theme + language applied (`data-theme`, dictionary).
2. Home tab first load → `getLocationByIp()` → resolve city → block 1 auto-loads current + forecast
   (Spinner during).
3. User types in `CityAutocomplete` → `useDebounce` → `searchCities` → suggestions → select →
   `setBlockCity` → `useWeather` loads current + forecast → card + chart render.
4. `PeriodToggle` switches card + chart between today (3-hour points) and 5-day (daily averages).
5. "+" → `addBlock` (disabled / no-op at 5). Delete → confirm `Modal` → `removeBlock`.
6. Favorite star → `addFavorite` / `removeFavorite`; at 5, `addFavorite` rejects → alert `Modal`
   ("to add, remove a city — max 5"). Persisted to localStorage.
7. Favorites tab → one read-only `WeatherBlock` per favorite (no `CityAutocomplete`), period toggle only.

## 9. Error Handling

- Per-block inline error state with a retry action, distinguishing:
  - 404 city-not-found, 401 bad/missing key, 429 rate-limit, network/other service errors.
- Autocomplete with no results → "no matches" message.
- IP-geolocation failure → fallback city (Kyiv) + prompt to search.
- Corrupt/unparseable localStorage → reset that store to defaults gracefully.
- Missing API key → clear UI message + console error.

## 10. Responsive & Theming

- Container `max-width: 1200px`, fluid to a 360px minimum.
- Blocks in a CSS Grid that collapses to a single column on narrow screens (`clamp()` / media queries).
- Day/Night: `data-theme` on `<html>`, CSS custom properties for colors, persisted via `settingsStore`.

## 11. Testing (focused)

- `favoritesStore`: add up to 5, reject the 6th, remove, `isFavorite`.
- `blocksStore`: default 1 block, add up to 5, reject the 6th, remove.
- `transforms`: `toHourlyToday` filters to today and maps points; `toDailyForecast` groups and averages.
- `CityAutocomplete`: debounce → `searchCities` call → render suggestions → select.
- `Modal`: confirm / cancel callbacks fire correctly.

## 12. Deployment & Deliverable

- Deploy to **Vercel** (env var `VITE_OPENWEATHER_API_KEY`).
- README documents: setup, `.env` configuration, implemented bonus items (#9/#10/#11/#12/#13 → satisfies
  req. #14), and the live deployment link.
- Final email to `job@pandateam.net` with the repo link + live link.

## 13. Open Prerequisites

- A free OpenWeatherMap API key must be provided in `.env` before the app can fetch data.
