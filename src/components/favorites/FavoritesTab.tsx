import { useState } from 'react';
import { useFavoritesStore, cityKey } from '../../store/favoritesStore';
import { useT } from '../../i18n';
import WeatherBlock from '../weather/WeatherBlock';
import type { Period } from '../../types/weather';
import styles from './FavoritesTab.module.css';

export default function FavoritesTab() {
  const t = useT();
  const favorites = useFavoritesStore((s) => s.favorites);
  const [periods, setPeriods] = useState<Record<string, Period>>({});

  if (favorites.length === 0) return <div className={styles.empty}>{t('emptyFavorites')}</div>;

  return (
    <div className={styles.grid}>
      {favorites.map((c) => {
        const key = cityKey(c);
        return (
          <WeatherBlock key={key} city={c} period={periods[key] ?? 'today'}
            allowCityEdit={false} allowDelete={false}
            onCityChange={() => {}}
            onPeriodChange={(p) => setPeriods((prev) => ({ ...prev, [key]: p }))}
            onDelete={() => {}} />
        );
      })}
    </div>
  );
}
