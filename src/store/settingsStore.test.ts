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
