import { useT } from '../../i18n';
import type { WeatherData, City, Period } from '../../types/weather';
import styles from './WeatherCard.module.css';

const iconUrl = (icon: string) => `https://openweathermap.org/img/wn/${icon}@2x.png`;

interface Props {
  data: WeatherData;
  period: Period;
  city: City;
  isFavorite: boolean;
  showFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function WeatherCard({ data, period, city, isFavorite, showFavorite, onToggleFavorite }: Props) {
  const t = useT();
  const { current, daily } = data;
  return (
    <div className={`${styles.card} ${isFavorite ? styles.favorited : ''}`}>
      <div className={styles.head}>
        <div>
          <strong>{city.name}{city.country ? `, ${city.country}` : ''}</strong>
        </div>
        {showFavorite && (
          <button className={styles.star} onClick={onToggleFavorite}
            aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
            aria-pressed={isFavorite}>{isFavorite ? '★' : '☆'}</button>
        )}
      </div>
      {period === 'today' ? (
        <>
          <div className={styles.head}>
            <span className={styles.temp}>{Math.round(current.main.temp)}°</span>
            <img src={iconUrl(current.weather[0].icon)} alt={current.weather[0].description} width={64} height={64} />
          </div>
          <div>{current.weather[0].description}</div>
          <div className={styles.meta}>
            <span>{t('feelsLike')}: {Math.round(current.main.feels_like)}°</span>
            <span>{t('humidity')}: {current.main.humidity}%</span>
            <span>{t('wind')}: {Math.round(current.wind.speed)} m/s</span>
          </div>
        </>
      ) : (
        <div className={styles.days}>
          {daily.map((d) => (
            <div key={d.date} className={styles.day}>
              <div>{d.date.slice(5)}</div>
              <img src={iconUrl(d.icon)} alt={d.description} width={40} height={40} />
              <div><strong>{Math.round(d.avgTemp)}°</strong></div>
              <div className={styles.meta}>{Math.round(d.min)}° / {Math.round(d.max)}°</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
