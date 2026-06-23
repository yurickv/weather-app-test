import { useT } from '../../i18n';
import type { Period } from '../../types/weather';
import styles from './PeriodToggle.module.css';

export default function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const t = useT();
  return (
    <div className={styles.toggle} role="group">
      <button className={`${styles.btn} ${value === 'today' ? styles.active : ''}`} onClick={() => onChange('today')}>{t('today')}</button>
      <button className={`${styles.btn} ${value === '5day' ? styles.active : ''}`} onClick={() => onChange('5day')}>{t('fiveDay')}</button>
    </div>
  );
}
