"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AUTH_LOCALE_COOKIE, authCopy, type AuthLocale } from "@/lib/auth-copy";

type LanguageContext = { locale: AuthLocale; setLocale: (locale: AuthLocale) => void; t: typeof authCopy[AuthLocale] };
const Context = createContext<LanguageContext>({ locale: "en", setLocale: () => {}, t: authCopy.en });

export function AuthLanguageProvider({ initialLocale, children }: { initialLocale: AuthLocale; children: React.ReactNode }) {
  const [locale, updateLocale] = useState(initialLocale);
  const setLocale = useCallback((next: AuthLocale) => {
    updateLocale(next);
    try { document.cookie = `${AUTH_LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`; }
    catch { /* The page can still change language if preference storage is blocked. */ }
  }, []);
  const value = useMemo(() => ({ locale, setLocale, t: authCopy[locale] }), [locale, setLocale]);
  return <Context value={value}>{children}</Context>;
}

export const useAuthLanguage = () => useContext(Context);

export function AuthLanguageSwitch() {
  const { locale, setLocale, t } = useAuthLanguage();
  return <div className="auth-language-switch" role="group" aria-label={t.language}>
    <button type="button" lang="en" aria-label="English" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
    <button type="button" lang="pt-PT" aria-label="Português" aria-pressed={locale === "pt"} onClick={() => setLocale("pt")}>PT</button>
  </div>;
}
