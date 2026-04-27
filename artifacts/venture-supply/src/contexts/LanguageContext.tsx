import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, type Language } from "@/data/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
  formatPrice: (amount: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "vs.language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "ar" || stored === "en" ? stored : "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    window.localStorage.setItem(STORAGE_KEY, lang);
  };

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    document.documentElement.classList.toggle("font-arabic", language === "ar");
  }, [language]);

  const t = (key: string) => translations[language][key] ?? key;

  const formatPrice = (amount: number) => {
    const rounded = amount.toFixed(2);
    return language === "ar" ? `${rounded} ${translations.ar["common.currency"]}` : `${translations.en["common.currency"]} ${rounded}`;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL: language === "ar", formatPrice }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
