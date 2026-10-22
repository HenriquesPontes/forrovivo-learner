"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from "@/lib/validation";
import { useAuthLanguage } from "@/components/AuthLanguage";
import { authErrorText } from "@/lib/auth-copy";

type AuthMode = "login" | "register";
type AuthFormProps = {
  mode: AuthMode;
  returnTo?: "/home" | "/account";
  appearance?: "default" | "cartoon";
  showAccountLink?: boolean;
};

export function AuthForm({ mode, returnTo = "/home", appearance = "default", showAccountLink = true }: AuthFormProps) {
  const router = useRouter();
  const { locale, t } = useAuthLanguage();
  const fieldId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [errorStatus, setErrorStatus] = useState(0);
  const cartoon = appearance === "cartoon";
  const inputClass = cartoon ? "auth-input" : "mt-1.5 h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20";
  const labelClass = cartoon ? "auth-label" : "block text-sm font-medium text-[var(--foreground)]";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    setErrorStatus(0);
    try {
      const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, ...(mode === "register" ? { displayName: displayName.trim() } : {}) }),
      });
      const data: { status?: string; message?: string; pending?: boolean } = await response.json().catch(() => ({}));
      if (!response.ok || data.status !== "ok") {
        setStatus("error");
        setErrorStatus(response.status);
        setMessage(data.message || "Something went wrong. Please try again.");
        return;
      }
      if (data.pending) {
        setStatus("idle");
        setMessage(data.message || "Check your email to finish registration. If you already have an account, sign in or reset your password.");
        return;
      }
      router.replace(returnTo);
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return <form onSubmit={onSubmit} aria-busy={status === "loading"} className={cartoon ? "auth-form" : "mt-8 w-full max-w-sm space-y-4"}>
    {mode === "register" && <label className={labelClass}>
      {t.name} <span className={cartoon ? "auth-optional" : "font-normal text-[var(--muted)]"}>({t.optional})</span>
      <input type="text" name="displayName" autoComplete="name" maxLength={120} value={displayName} onChange={event => setDisplayName(event.target.value)} disabled={status === "loading"} className={inputClass} placeholder={t.namePlaceholder} />
    </label>}
    <label className={`${labelClass} auth-email-field`}>{t.email}
      <input type="email" name="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} disabled={status === "loading"} className={inputClass} placeholder={t.emailPlaceholder} />
    </label>
    <div>
      <label htmlFor={`${fieldId}-password`} className={labelClass}>{t.password}</label>
      <div className={cartoon ? "auth-password" : "relative"}>
        <input id={`${fieldId}-password`} type={showPassword ? "text" : "password"} name="password" required minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_LENGTH} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={event => setPassword(event.target.value)} disabled={status === "loading"} className={`${inputClass} ${cartoon ? "" : "pr-12"}`} placeholder={mode === "login" ? t.passwordPlaceholder : t.newPasswordPlaceholder} />
        <button type="button" aria-label={showPassword ? t.hidePassword : t.showPassword} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)} disabled={status === "loading"} className={cartoon ? "auth-eye" : "absolute right-1 top-1.5 grid h-11 w-11 place-items-center rounded-lg text-[var(--muted)] focus-visible:outline-2 focus-visible:outline-[var(--brand)]"}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />{showPassword && <path d="m4 3 16 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}</svg>
        </button>
      </div>
      {mode === "login" && <div className={cartoon ? "auth-forgot" : "mt-2 text-right text-sm"}><Link href="/forgot-password" className={cartoon ? "" : "text-[var(--muted)] underline-offset-4 hover:text-[var(--brand)] hover:underline"}>{t.forgot}</Link></div>}
    </div>
    {message && <p className={status === "error" ? "text-sm text-red-700" : "text-sm text-[var(--foreground)]"} role={status === "error" ? "alert" : "status"}>{status === "error" ? authErrorText(message, errorStatus, locale, mode) : locale === "pt" ? t.pending : message}</p>}
    <button type="submit" disabled={status === "loading"} className={cartoon ? "auth-submit" : "inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-white hover:bg-[var(--brand-ink)] disabled:opacity-60"}>
      {status === "loading" ? mode === "login" ? t.signingIn : t.creating : mode === "login" ? t.login : t.register}
      {cartoon && <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </button>
    {showAccountLink && <p className="text-sm text-[var(--muted)]">{mode === "login" ? t.formNewHere : t.formAlreadyHere}<Link href={mode === "login" ? "/create-account" : "/"} className="font-medium text-[var(--brand)] underline-offset-4 hover:underline">{mode === "login" ? t.register : t.login}</Link></p>}
  </form>;
}
