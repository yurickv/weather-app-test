import { useT } from '../../i18n';
import styles from './Tabs.module.css';

export type TabKey = 'home' | 'favorites';

export default function Tabs({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  const t = useT();
  return (
    <nav className={styles.tabs}>
      <button className={`${styles.tab} ${active === 'home' ? styles.active : ''}`} onClick={() => onChange('home')}>{t('tabHome')}</button>
      <button className={`${styles.tab} ${active === 'favorites' ? styles.active : ''}`} onClick={() => onChange('favorites')}>{t('tabFavorites')}</button>
    </nav>
  );
}
