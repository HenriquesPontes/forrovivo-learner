"use client";

import { useEffect } from "react";
import { AuthLanguageSwitch, useAuthLanguage } from "@/components/AuthLanguage";
import Image from "next/image";
import Link from "next/link";
import { SocialSignIn } from "@/components/SocialSignIn";


function LeafSprig({ className }: { className: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 120 150" fill="none">
    <path d="M24 143C37 106 62 79 99 14" stroke="#466f3b" strokeWidth="5" strokeLinecap="round" />
    <g stroke="#466f3b" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M42 111C15 110 8 89 9 75c24-1 40 9 33 36Z" fill="#8caf58" />
      <path d="M54 93c1-28 19-39 39-34-4 25-18 38-39 34Z" fill="#b8d276" />
      <path d="M69 68C43 65 35 47 38 30c24 0 35 14 31 38Z" fill="#789e4d" />
      <path d="M82 48c-1-25 13-40 32-40 1 25-12 39-32 40Z" fill="#a2c767" />
      <path d="M33 128c8-22 23-27 41-20-8 20-21 27-41 20Z" fill="#a2c767" />
    </g>
  </svg>;
}

function Arrow() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="auth-arrow"><path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function AuthScreen({ mode, className }: { mode: "login" | "register"; className: string }) {
  const login = mode === "login";
  const { locale, t } = useAuthLanguage();
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = locale === "pt" ? "pt-PT" : "en";
    return () => { document.documentElement.lang = previous; };
  }, [locale]);
  return <div className={`auth-world ${className}`} data-auth-mode={mode} lang={locale === "pt" ? "pt-PT" : "en"}>
    <a href="#auth-form" className="auth-skip">{t.skip}</a>
    <header className="auth-header">
      <a href="/home" className="auth-brand" aria-label="ForroVivo Learner">
        <Image src="/images/app/forro-icon.png" alt="" width={44} height={44} priority />
        <span>Forro<span className="auth-brand-green">Vivo</span></span>
      </a>
      <nav aria-label={t.navigation}>
        <AuthLanguageSwitch />
      </nav>
    </header>

    <main className="auth-main">
      <div className="auth-column">
        <div className="auth-sign-wrap">
          <LeafSprig className="auth-sign-leaves auth-sign-leaves-left" />
          <LeafSprig className="auth-sign-leaves auth-sign-leaves-right" />
          <div className="auth-sign"><span className="auth-sign-pin" aria-hidden="true" /><h1>{login ? t.login : t.register}</h1><span className="auth-sign-pin" aria-hidden="true" /></div>
        </div>

        <section className="auth-card" aria-label={t.social}>
          <span className="auth-card-corner auth-card-corner-tl" aria-hidden="true" />
          <span className="auth-card-corner auth-card-corner-br" aria-hidden="true" />
          <p className="auth-welcome">{login ? t.welcome : t.registerWelcome}</p>
          <p className="auth-intro">{login ? t.intro : t.registerIntro}</p>
          <p className="auth-intro">{t.socialIntro}</p>
          <LeafSprig className="auth-card-leaves" />
        </section>

        <div id="auth-form" tabIndex={-1}><SocialSignIn appearance="cartoon" /></div>
        <p className="auth-switch">{login ? t.newHere : t.alreadyHere} <Link href={login ? "/create-account" : "/"}>{login ? t.register : t.login}<Arrow /></Link></p>
      </div>
    </main>
    <footer className="auth-footer">
      <span suppressHydrationWarning>© {new Date().getUTCFullYear()} LIVLU TECHNOLOGIES LTD · {t.rights}</span>
    </footer>
  </div>;
}
