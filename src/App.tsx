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
