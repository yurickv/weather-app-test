import { useEffect, useState } from 'react';
import { searchCities } from '../../services/weatherApi';
import { useDebounce } from '../../hooks/useDebounce';
import { useT } from '../../i18n';
import type { City, GeoSuggestion } from '../../types/weather';
import styles from './CityAutocomplete.module.css';

const toCity = (s: GeoSuggestion): City => ({ name: s.name, country: s.country, state: s.state, lat: s.lat, lon: s.lon });
const label = (s: GeoSuggestion) => [s.name, s.state, s.country].filter(Boolean).join(', ');

export default function CityAutocomplete({ onSelect }: { onSelect: (c: City) => void }) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounced = useDebounce(query, 350);

  useEffect(() => {
    const q = debounced.trim();
    if (!q) { setResults([]); setSearched(false); return; }
    const controller = new AbortController();
    searchCities(q, controller.signal)
      .then((r) => { setResults(r); setSearched(true); setOpen(true); })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setResults([]); setSearched(true);
      });
    return () => controller.abort();
  }, [debounced]);

  const pick = (s: GeoSuggestion) => { onSelect(toCity(s)); setQuery(label(s)); setOpen(false); };

  return (
    <div className={styles.wrap}>
      <input className={styles.input} type="text" role="textbox" placeholder={t('searchPlaceholder')}
        value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} />
      {open && searched && (
        <ul className={styles.list}>
          {results.length === 0 ? (
            <li className={styles.empty}>{t('noMatches')}</li>
          ) : results.map((s) => (
            <li key={`${s.lat},${s.lon}`} className={styles.item} onClick={() => pick(s)}>{label(s)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
