import { useEffect, useRef } from 'react';
import { useBlocksStore, MAX_BLOCKS } from '../../store/blocksStore';
import { getLocationByIp } from '../../services/geo';
import { useT } from '../../i18n';
import WeatherBlock from '../weather/WeatherBlock';
import styles from './HomeTab.module.css';

export default function HomeTab() {
  const t = useT();
  const { blocks, addBlock, removeBlock, setBlockCity, setBlockPeriod } = useBlocksStore();
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const only = useBlocksStore.getState().blocks;
    if (only.length === 1 && only[0].city === null) {
      getLocationByIp().then((city) => setBlockCity(only[0].id, city)).catch(() => {});
    }
  }, [setBlockCity]);

  return (
    <div>
      <div className={styles.addBar}>
        <button className={styles.add} onClick={addBlock} disabled={blocks.length >= MAX_BLOCKS}>
          + {t('addBlock')}
        </button>
      </div>
      <div className={styles.grid}>
        {blocks.map((b) => (
          <WeatherBlock key={b.id} city={b.city} period={b.period}
            allowCityEdit allowDelete={blocks.length > 1}
            onCityChange={(c) => setBlockCity(b.id, c)}
            onPeriodChange={(p) => setBlockPeriod(b.id, p)}
            onDelete={() => removeBlock(b.id)} />
        ))}
      </div>
    </div>
  );
}
