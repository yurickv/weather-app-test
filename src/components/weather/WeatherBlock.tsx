import { useState } from 'react';
import { useWeather } from '../../hooks/useWeather';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useT } from '../../i18n';
import CityAutocomplete from '../search/CityAutocomplete';
import PeriodToggle from './PeriodToggle';
import WeatherCard from './WeatherCard';
import TemperatureChart from './TemperatureChart';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';
import type { City, Period } from '../../types/weather';
import styles from './WeatherBlock.module.css';

interface Props {
  city: City | null;
  period: Period;
  allowCityEdit: boolean;
  allowDelete: boolean;
  onCityChange: (c: City) => void;
  onPeriodChange: (p: Period) => void;
  onDelete: () => void;
}

export default function WeatherBlock({ city, period, allowCityEdit, allowDelete, onCityChange, onPeriodChange, onDelete }: Props) {
  const t = useT();
  const { data, loading, error, reload } = useWeather(city);
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [maxAlert, setMaxAlert] = useState(false);

  const favorited = city ? isFavorite(city) : false;
  const toggleFavorite = () => {
    if (!city) return;
    if (favorited) { removeFavorite(city); return; }
    if (!addFavorite(city)) setMaxAlert(true);
  };

  return (
    <div className={styles.block}>
      <div className={styles.row}>
        {allowCityEdit ? <div style={{ flex: 1 }}><CityAutocomplete onSelect={onCityChange} /></div>
          : <strong>{city?.name}</strong>}
        {allowDelete && <button className={styles.delete} onClick={() => setConfirmDelete(true)} aria-label={t('deleteBlock')}>✕</button>}
      </div>

      <div className={styles.row}>
        <PeriodToggle value={period} onChange={onPeriodChange} />
      </div>

      {!city && <div className={styles.error}>{t('searchPlaceholder')}</div>}
      {loading && <div className={styles.center}><Spinner /></div>}
      {error && !loading && (
        <div className={styles.error}>
          <p>{error === 'notfound' ? t('errorCityNotFound') : t('errorGeneric')}</p>
          <button className={styles.delete} onClick={reload}>{t('retry')}</button>
        </div>
      )}
      {data && !loading && !error && city && (
        <>
          <WeatherCard data={data} period={period} city={city}
            isFavorite={favorited} showFavorite onToggleFavorite={toggleFavorite} />
          <TemperatureChart
            labels={period === 'today' ? data.hourly.map((h) => h.time) : data.daily.map((d) => d.date.slice(5))}
            temps={period === 'today' ? data.hourly.map((h) => h.temp) : data.daily.map((d) => d.avgTemp)} />
        </>
      )}

      <Modal open={confirmDelete} mode="confirm" title={t('confirmDeleteBlock')}
        confirmLabel={t('confirm')} cancelLabel={t('cancel')}
        onConfirm={() => { setConfirmDelete(false); onDelete(); }} onCancel={() => setConfirmDelete(false)} />
      <Modal open={maxAlert} mode="alert" title={t('maxFavoritesTitle')}
        confirmLabel={t('ok')} onCancel={() => setMaxAlert(false)}>
        {t('maxFavoritesBody')}
      </Modal>
    </div>
  );
}
