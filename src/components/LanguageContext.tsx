"use client";

import React, { createContext, useContext, useEffect } from "react";

export type Locale = "ar" | "en";

const LanguageContext = createContext<Locale>("ar");

export function LanguageProvider({
  lang,
  children,
}: {
  lang: Locale;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  return (
    <LanguageContext.Provider value={lang}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): Locale {
  return useContext(LanguageContext);
}
