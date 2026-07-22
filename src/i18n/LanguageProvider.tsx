/* eslint-disable react-refresh/only-export-components */

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type LanguageContextValue = {
  locale: string;
  setLocale: (locale: string) => void;
  t: ReturnType<typeof useTranslation>['t'];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const [locale, setLocaleState] = useState(i18n.language);

  const setLocale = useCallback(
    (next: string) => {
      void i18n.changeLanguage(next);
      window.localStorage.setItem('banfe-language', next);
      setLocaleState(next);
    },
    [i18n],
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
}
