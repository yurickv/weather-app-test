import { useSettingsStore } from '../../store/settingsStore';
import { useT } from '../../i18n';
import styles from './Header.module.css';

export default function Header() {
  const t = useT();
  const { theme, toggleTheme, language, setLanguage } = useSettingsStore();
  return (
    <header className={styles.header}>
      <span className={styles.logo}>☀ {t('appTitle')}</span>
      <div className={styles.controls}>
        <button className={styles.btn} onClick={toggleTheme} aria-label="toggle theme">
          {theme === 'day' ? '🌙' : '☀'}
        </button>
        <button className={`${styles.btn} ${language === 'en' ? styles.active : ''}`} onClick={() => setLanguage('en')}>EN</button>
        <button className={`${styles.btn} ${language === 'uk' ? styles.active : ''}`} onClick={() => setLanguage('uk')}>UK</button>
      </div>
    </header>
  );
}
