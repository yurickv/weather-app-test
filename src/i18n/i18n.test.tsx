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
