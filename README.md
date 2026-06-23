# Weather App

Responsive weather app on the OpenWeatherMap API. React + TypeScript + Vite, Zustand, Chart.js, plain CSS (no CSS/UI frameworks).

## Features

- City autocomplete (OWM Geocoding API)
- Current-day weather card + hourly (3-hour step) temperature chart
- Up to 5 independent weather blocks (add via "+", remove with a confirmation modal)
- Favorites tab — favorited cities persisted to `localStorage`, max 5, with an over-limit modal;
  favorited state highlighted on the card; favorites-tab blocks have no city picker, only the period toggle
- Responsive layout: main container 1200px, fluid down to 360px

### Bonus features implemented

- **Today / 5-day toggle** — the card and chart switch between the current day (3-hour points) and a
  5-day forecast built from each day's **average** temperature.
- **IP-based default city** — on first load the app detects your city by IP (ipapi.co) and shows its weather.
- **Preloaders** — a spinner is shown while each block loads its data.
- **i18n (en/uk)** — the whole UI plus the OpenWeatherMap descriptions switch language (OWM `lang` param).
- **Day / Night theme** — light/dark toggle via CSS custom properties, persisted across reloads.

## Setup

```bash
cp .env.example .env          # then set VITE_OPENWEATHER_API_KEY
npm install
npm run dev
```

Get a free API key at https://openweathermap.org/api (the Current Weather, 5-day/3-hour Forecast, and
Geocoding endpoints used here are all on the free tier).

## Scripts

- `npm run dev` — start the dev server
- `npm test` — run the unit/integration tests (Vitest)
- `npm run build` — type-check and produce a production build
- `npm run preview` — preview the production build locally

## Notes

- The free OpenWeatherMap tier provides forecast data in **3-hour steps**, so the "hourly" chart plots
  the current day's ~8 three-hour points.
- The API key is read client-side from `VITE_OPENWEATHER_API_KEY`, which is standard for the free tier.

## Architecture

- `src/services/` — typed `fetch` wrappers for OWM (geocoding, current, forecast), IP geolocation, and
  pure forecast transforms (today's hourly points, 5-day daily averages).
- `src/store/` — Zustand stores: settings (language + theme, persisted), favorites (persisted, capped at 5),
  and Home-tab blocks (in-memory, capped at 5).
- `src/hooks/` — `useWeather` (loads current + forecast, exposes loading/error/retry) and `useDebounce`.
- `src/components/` — layout (Header, Tabs), search (CityAutocomplete), weather (WeatherBlock, WeatherCard,
  TemperatureChart, PeriodToggle), tabs (HomeTab, FavoritesTab), and common (Modal, Spinner).
- `src/i18n/` — lightweight `t()` context with `en` / `uk` dictionaries.

## Deployment

Deployed on Vercel. Set `VITE_OPENWEATHER_API_KEY` as an environment variable in the Vercel project;
`vercel.json` provides the SPA rewrite.

Live: <DEPLOYED_URL>
