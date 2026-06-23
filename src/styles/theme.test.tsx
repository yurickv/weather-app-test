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
