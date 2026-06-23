import { useEffect } from 'react';
import './styles/global.css';
import './styles/theme.css';
import { useSettingsStore } from './store/settingsStore';

export default function App() {
  const theme = useSettingsStore((s) => s.theme);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  return <div data-testid="app-root" className="container">Weather App</div>;
}
