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
