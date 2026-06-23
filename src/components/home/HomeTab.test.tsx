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
