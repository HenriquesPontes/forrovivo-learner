"use client";

import { useEffect } from "react";
import { AuthLanguageProvider, useAuthLanguage } from "@/components/AuthLanguage";
import type { AuthLocale } from "@/lib/auth-copy";

function LanguageDocument() {
  const { locale } = useAuthLanguage();
  useEffect(() => { document.documentElement.lang = locale === "pt" ? "pt-PT" : "en"; }, [locale]);
  return null;
}

export function LearnerLanguage({ initialLocale, children }: { initialLocale: AuthLocale; children: React.ReactNode }) {
  return <AuthLanguageProvider initialLocale={initialLocale}><LanguageDocument />{children}</AuthLanguageProvider>;
}
