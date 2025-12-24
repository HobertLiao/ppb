import React, { createContext, useState, useContext, useCallback } from 'react';
import { en } from '../locales/en';
import { zhTW } from '../locales/zh-TW';

type Locale = 'en' | 'zh-TW';

const translations: { [key in Locale]: { [key: string]: string } } = {
  en,
  'zh-TW': zhTW,
};

interface LocalizationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const storedLocale = localStorage.getItem('pickleball-locale');
      return (storedLocale === 'en' || storedLocale === 'zh-TW') ? storedLocale : 'en';
    } catch {
      return 'en';
    }
  });

  const setLocale = (newLocale: Locale) => {
    try {
      localStorage.setItem('pickleball-locale', newLocale);
    } catch (error) {
        console.error("Could not save locale to localStorage", error);
    }
    setLocaleState(newLocale);
  };
  
  const t = useCallback((key: string, replacements?: { [key: string]: string | number }): string => {
    let translation = translations[locale][key] || translations['en'][key] || key;
    if (replacements) {
        Object.entries(replacements).forEach(([placeholder, value]) => {
            translation = translation.replace(`{${placeholder}}`, String(value));
        });
    }
    return translation;
  }, [locale]);

  return (
    <LocalizationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
