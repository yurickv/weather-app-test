import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { en, type Dict } from './en';
import { uk } from './uk';
import { useSettingsStore, type Language } from '../store/settingsStore';

export const dictionaries: Record<Language, Dict> = { en, uk };

const I18nContext = createContext<(key: keyof Dict) => string>((k) => k);

export function I18nProvider({ children }: { children: ReactNode }) {
  const language = useSettingsStore((s) => s.language);
  const t = useMemo(() => {
    const dict = dictionaries[language];
    return (key: keyof Dict) => dict[key] ?? String(key);
  }, [language]);
  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
}

export const useT = () => useContext(I18nContext);
