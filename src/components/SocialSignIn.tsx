"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { APPLE_WEB_CLIENT_ID, APPLE_WEB_REDIRECT_URI, GOOGLE_WEB_CLIENT_ID } from "@/lib/constants";
import { useAuthLanguage } from "@/components/AuthLanguage";
import { authErrorText, type AuthLocale } from "@/lib/auth-copy";

declare global {
  interface Window {
    google?: { accounts: { id: {
      initialize: (config: { client_id: string; nonce: string; callback: (response: { credential?: string }) => void; auto_select: boolean }) => void;
      renderButton: (parent: HTMLElement, options: { type?: string; theme: string; size: string; text: string; width: number; shape?: string; locale?: string }) => void;
    } } };
    AppleID?: { auth: {
      init: (config: { clientId: string; scope: string; redirectURI: string; usePopup: boolean; nonce: string; state: string }) => void;
      signIn: () => Promise<{ authorization?: { id_token?: string; state?: string } }>;
    } };
  }
}

const scripts = new Map<string, Promise<void>>();
let pendingChallenge: Promise<string> | null = null;
function challengeNonce() {
  // Share overlapping mounts (including React Strict Mode) so competing
  // responses cannot replace the cookie with a nonce different from the SDK's.
  if (!pendingChallenge) pendingChallenge = (async () => {
    const response = await fetch("/api/auth/challenge", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || typeof data.nonce !== "string" || !/^[a-f0-9]{64}$/.test(data.nonce)) throw new Error("Could not prepare sign-in.");
    return data.nonce as string;
  })().finally(() => { pendingChallenge = null; });
  return pendingChallenge;
}

function loadScript(src: string) {
  const existing = scripts.get(src);
  if (existing) return existing;
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    const failed = () => {
      window.clearTimeout(timer);
      scripts.delete(src);
      script.remove();
      reject(new Error("Could not load sign-in."));
    };
    const timer = window.setTimeout(failed, 15_000);
    script.src = src;
    script.async = true;
    script.onload = () => { window.clearTimeout(timer); resolve(); };
    script.onerror = failed;
    document.head.appendChild(script);
  });
  scripts.set(src, promise);
  return promise;
}

function AppleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M17.05 12.54c.03 3.13 2.75 4.17 2.78 4.18-.02.07-.43 1.49-1.43 2.96-.86 1.27-1.75 2.53-3.16 2.56-1.39.03-1.84-.83-3.43-.83-1.58 0-2.08.8-3.39.86-1.36.05-2.4-1.37-3.27-2.64-1.78-2.6-3.15-7.35-1.32-10.56a5.08 5.08 0 0 1 4.3-2.6c1.34-.03 2.61.91 3.43.91.83 0 2.37-1.13 3.99-.96.68.03 2.59.28 3.82 2.09-.1.06-2.29 1.33-2.32 4.03ZM14.43 4.68c.72-.88 1.2-2.1 1.07-3.31-1.03.04-2.28.69-3.02 1.57-.66.77-1.24 2.01-1.08 3.2 1.15.09 2.31-.59 3.03-1.46Z" /></svg>;
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" /><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.97-3.38.97-2.6 0-4.8-1.76-5.59-4.13H3.07v2.59A10 10 0 0 0 12 22Z" /><path fill="#FBBC05" d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.59Z" /><path fill="#EA4335" d="M12 5.95c1.47 0 2.78.5 3.82 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.71 9.4 5.95 12 5.95Z" /></svg>;
}

export function SocialSignIn({ returnTo = "/home", appearance = "default", showDivider = false }: { returnTo?: "/home" | "/account"; appearance?: "default" | "cartoon"; showDivider?: boolean }) {
  const router = useRouter();
  const { locale, t } = useAuthLanguage();
  const googleRef = useRef<HTMLDivElement>(null);
  const nonceRef = useRef("");
  const processing = useRef(false);
  const [generation, setGeneration] = useState(0);
  const [appleReady, setAppleReady] = useState<AuthLocale | null>(null);
  const [googleReady, setGoogleReady] = useState<AuthLocale | null>(null);
  const [appleWebOnly, setAppleWebOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(0);
  const googleVisible = googleReady === locale;
  const enabled = Boolean(APPLE_WEB_CLIENT_ID || GOOGLE_WEB_CLIENT_ID);

  const retry = useCallback(() => {
    setAppleReady(null);
    setGoogleReady(null);
    setError("");
    setGeneration(value => value + 1);
  }, []);

  const finish = useCallback(async (idToken: string) => {
    if (processing.current) return;
    processing.current = true;
    setBusy(true);
    setError("");
    setErrorStatus(0);
    try {
      const response = await fetch("/api/auth/oauth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) });
      const data = await response.json().catch(() => null);
      setErrorStatus(response.status);
      if (!response.ok || data?.status !== "ok") throw new Error(data?.message || "Sign-in failed. Please try again.");
      router.replace(returnTo);
      router.refresh();
    } catch (failure) {
      setAppleReady(null);
      setGoogleReady(null);
      setError(failure instanceof Error ? failure.message : "Sign-in failed. Please try again.");
      setGeneration(value => value + 1);
    } finally { processing.current = false; setBusy(false); }
  }, [returnTo, router]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const nonce = await challengeNonce();
        if (cancelled) return;
        nonceRef.current = nonce;
        const tasks: Promise<void>[] = [];
        if (GOOGLE_WEB_CLIENT_ID) tasks.push((async () => {
          if (!window.google) await loadScript("https://accounts.google.com/gsi/client");
          if (cancelled) return;
          if (!googleRef.current || !window.google) throw new Error("Google sign-in did not load.");
          window.google.accounts.id.initialize({ client_id: GOOGLE_WEB_CLIENT_ID, nonce, auto_select: false,
            callback: result => { if (!cancelled && result.credential) void finish(result.credential); } });
          googleRef.current.replaceChildren();
          // Width below 200px keeps Google's button generic (no name/email).
          const width = Math.min(199, Math.max(120, (googleRef.current.parentElement?.clientWidth || 199) - 4));
          window.google.accounts.id.renderButton(googleRef.current, { theme: "outline", size: "large", text: "continue_with", width, shape: "pill", locale: locale === "pt" ? "pt-PT" : "en" });
          setGoogleReady(locale);
        })());
        if (APPLE_WEB_CLIENT_ID) tasks.push((async () => {
          if (window.location.origin !== new URL(APPLE_WEB_REDIRECT_URI).origin || window.location.protocol !== "https:") {
            setAppleWebOnly(true);
            return;
          }
          if (!window.AppleID) await loadScript("https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js");
          if (cancelled) return;
          if (!window.AppleID) throw new Error("Apple sign-in did not load.");
          window.AppleID.auth.init({ clientId: APPLE_WEB_CLIENT_ID, scope: "name email", redirectURI: APPLE_WEB_REDIRECT_URI,
            usePopup: true, nonce, state: nonce });
          setAppleReady(locale);
        })());
        const outcomes = await Promise.allSettled(tasks);
        if (!cancelled && outcomes.some(result => result.status === "rejected")) setError("A sign-in provider could not load. Please try again.");
      } catch { if (!cancelled) setError("Could not load social sign-in. Please try again."); }
    })();
    return () => { cancelled = true; };
  }, [appearance, enabled, finish, generation, locale]);

  async function signInWithApple() {
    if (appleReady !== locale || busy || !window.AppleID) return;
    setBusy(true);
    setError("");
    setErrorStatus(0);
    try {
      const result = await window.AppleID.auth.signIn();
      if (!result.authorization?.id_token || result.authorization.state !== nonceRef.current) throw new Error("Apple sign-in was cancelled or expired.");
      await finish(result.authorization.id_token);
    } catch {
      setError("Apple sign-in was cancelled or failed. Please try again.");
    } finally { setBusy(false); }
  }

  if (!enabled) return null;

  return <section aria-label={t.social} aria-busy={busy} className={appearance === "cartoon" ? "auth-social" : "mt-6 w-full max-w-sm space-y-3"}>
    {showDivider && <div className="social-divider flex items-center gap-3 py-1 text-xs text-[var(--muted)]"><span className="h-px flex-1 bg-[var(--border)]" />{t.orContinue}<span className="h-px flex-1 bg-[var(--border)]" /></div>}
    <div className="social-provider social-provider-apple">
      {appleWebOnly ? <a href={APPLE_WEB_REDIRECT_URI} className="social-apple flex h-11 w-full items-center justify-center gap-3 rounded-lg" aria-label={locale === "pt" ? "Continuar com Apple no site seguro" : "Continue with Apple on the secure site"}><AppleMark />{t.apple}</a> : <button type="button" disabled={appleReady !== locale || busy} onClick={() => void signInWithApple()}
        aria-describedby={!APPLE_WEB_CLIENT_ID ? "apple-signin-unavailable" : undefined}
        className="social-apple flex h-11 w-full items-center justify-center gap-3 rounded-lg bg-black px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 disabled:cursor-not-allowed disabled:opacity-60"><AppleMark />{t.apple}</button>}
      {!APPLE_WEB_CLIENT_ID && <span id="apple-signin-unavailable" className="sr-only">{t.appleUnavailable}</span>}
    </div>
    {GOOGLE_WEB_CLIENT_ID && <div className="social-provider social-provider-google">
      {!googleVisible && <button type="button" disabled aria-describedby={!GOOGLE_WEB_CLIENT_ID ? "google-signin-unavailable" : undefined}
        className="social-google-placeholder flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-60"><GoogleMark />{t.google}</button>}
      <div ref={googleRef} inert={busy} className={`social-google-mounted ${googleVisible ? "" : "hidden"} ${busy ? "pointer-events-none opacity-60" : ""}`} />
    </div>}
    {error && <div className="social-error"><p className="text-sm text-red-700" role="alert">{authErrorText(error, errorStatus, locale, "oauth")}</p><button type="button" disabled={busy} onClick={retry} className="mt-2 text-sm font-medium text-[var(--brand)] underline disabled:opacity-60">{t.retrySocial}</button></div>}
  </section>;
}
