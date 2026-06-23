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
