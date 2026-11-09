'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, SUPPORTED_LANGUAGES, getTranslation, translations } from '../lib/translations';

interface LanguageContextType {
  currentLang: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en'], params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  currentLang: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLang, setCurrentLang] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('resolvepay_lang') as Language | null;
      if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
        setCurrentLang(saved);
      }
    } catch (e) {}

    function handleLangChange(e: Event) {
      const customEvent = e as CustomEvent<Language>;
      if (customEvent.detail && SUPPORTED_LANGUAGES.some(l => l.code === customEvent.detail)) {
        setCurrentLang(customEvent.detail);
      }
    }

    window.addEventListener('resolvepay:language_changed', handleLangChange);
    return () => window.removeEventListener('resolvepay:language_changed', handleLangChange);
  }, []);

  function setLanguage(lang: Language) {
    setCurrentLang(lang);
    try {
      localStorage.setItem('resolvepay_lang', lang);
      window.dispatchEvent(new CustomEvent('resolvepay:language_changed', { detail: lang }));
    } catch (e) {}
  }

  const t = (key: keyof typeof translations['en'], params?: Record<string, string | number>) => {
    return getTranslation(currentLang, key, params);
  };

  return (
    <LanguageContext.Provider value={{ currentLang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
