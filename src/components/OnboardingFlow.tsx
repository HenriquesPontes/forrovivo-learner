"use client";

import { useState } from "react";
import Image from "next/image";
import { AuthLanguageSwitch, useAuthLanguage } from "@/components/AuthLanguage";
import { quickOnboarding, connectionOnboarding, onboardingSteps, type OnboardingStep } from "@/lib/onboarding";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/constants";

export function OnboardingFlow({ onDone }: { onDone: () => void }) {
  const { locale } = useAuthLanguage();
  const copy = quickOnboarding[locale];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<NonNullable<OnboardingStep["question"]>, string>>>({});
  const connection = answers.mode === "connection";
  const steps = onboardingSteps(locale, answers.mode);
  const current: OnboardingStep = steps[step];
  const last = step === steps.length - 1;
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  function finish(openSolo = true) {
    setSaveError(false);
    const relevant = connection ? answers : { mode: "solo", level: answers.level, goal: answers.goal };
    try { localStorage.setItem("fv_learner_introduction", JSON.stringify({ version: 2, ...relevant })); }
    catch {
      if (!openSolo) { setSaveError(true); return; }
    }
    if (openSolo) onDone();
    else setSaved(true);
  }

  return <div className={`auth-world onboard ${current.question ? "onboard-question" : "onboard-app"} ${current.question === "mode" ? "onboard-mode" : ""}`} lang={locale === "pt" ? "pt-PT" : "en"}>
    <header className="auth-header">
      <a href="/home" className="auth-brand" aria-label="ForroVivo Learner">
        <Image src="/images/app/forro-icon.png" alt="" width={44} height={44} priority />
        <span>Forro<span className="auth-brand-green">Vivo</span><span className="auth-brand-star" aria-hidden="true">✦</span></span>
      </a>
      <AuthLanguageSwitch />
    </header>
    <div className="onboard-stage">
    <div className="onboard-bar">
      <button type="button" className="onboard-back" disabled={step === 0} aria-label={locale === "pt" ? "Voltar" : "Go back"} onClick={() => setStep(value => Math.max(0, value - 1))}>←</button>
      <div className="onboard-progress" role="progressbar" aria-label={locale === "pt" ? "Progresso" : "Progress"} aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={step + 1}><span style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
      <span className="onboard-step-label">{step + 1} / {steps.length}</span>
    </div>
    <main className="onboard-body" aria-live="polite">
      <div className="onboard-art" aria-hidden="true">
        <span className="onboard-spark onboard-spark-one">✦</span>
        <Image src={last ? "/images/onboarding/ready.png" : "/images/onboarding/welcome.png"} alt="" width={280} height={280} priority className="onboard-mascot" />
        <span className="onboard-spark onboard-spark-two">✧</span>
      </div>
      <p className="onboard-count">{step + 1} / {steps.length} · FORROVIVO</p>
      <h1>{current.title}</h1>
      <p>{current.body}</p>
      {step > 0 && <span className="onboard-path-badge">{connection ? (locale === "pt" ? "Forro Conexão · Aulas pagas" : "Forro Conexão · Paid lessons") : (locale === "pt" ? "Solo · Ao teu ritmo" : "Solo · At your own pace")}</span>}
      {current.question && <fieldset className="onboard-choices">
        <legend className="sr-only">{current.title}</legend>
        {current.options?.map(option => <label key={option.value} className="onboard-choice">
          <input type="radio" name={current.question} value={option.value} checked={answers[current.question!] === option.value} onChange={() => setAnswers(value => ({ ...value, [current.question!]: option.value }))} />
          <span className="onboard-option-icon" aria-hidden="true">{option.icon}</span>
          <span className="onboard-option-text"><span className="onboard-option-title">{option.label}</span>{option.description && <span className="onboard-option-description">{option.description}</span>}{option.badge && <span className="onboard-option-badge">{option.badge}</span>}</span>
          <span className="onboard-choice-check" aria-hidden="true">✓</span>
        </label>)}
      </fieldset>}
      {last && connection && <p className="onboard-coming-soon">{connectionOnboarding[locale].notice}</p>}
      {last && saved && <p role="status" className="onboard-saved">{locale === "pt" ? "Preferências guardadas neste dispositivo." : "Preferences saved on this device."}</p>}
      {last && saveError && <p role="alert">{locale === "pt" ? "Não foi possível guardar neste browser. Tenta novamente ou continua com Solo." : "Could not save in this browser. Try again or continue with Solo."}</p>}
      {last && !connection && <div className="onboard-downloads" aria-label={copy.app}>
        <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">App Store ↗</a>
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">Google Play ↗</a>
      </div>}
    </main>
    <div className="onboard-footer">
      <button type="button" className="auth-submit onboard-cta" disabled={Boolean((current.question && !answers[current.question]) || (last && connection && saved))} onClick={() => last ? finish(!connection) : setStep(step + 1)}>{last ? (connection ? connectionOnboarding[locale].primary : copy.start) : copy.next}<span aria-hidden="true">→</span></button>
      {!last && current.question !== "mode" && <><button type="button" className="onboard-skip" onClick={() => setStep(step + 1)}>{copy.skip}</button><p className="onboard-storage-note">{copy.note}</p></>}
      {last && connection && <button type="button" className="onboard-skip" onClick={() => finish(true)}>{connectionOnboarding[locale].later}</button>}
    </div>
    </div>
  </div>;
}
