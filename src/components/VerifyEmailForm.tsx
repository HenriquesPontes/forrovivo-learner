"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useLearnerCopy } from "@/components/LearnerText";

function subscribeHash(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}
const readToken = () => new URLSearchParams(window.location.hash.slice(1)).get("token") || "";

export function VerifyEmailForm() {
  const { tr } = useLearnerCopy();
  const token = useSyncExternalStore(subscribeHash, readToken, () => "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const data = await response.json();
      if (!response.ok || data.status !== "ok") throw new Error(response.status === 400 ? "This verification link or password is invalid or expired." : "The service is unavailable. Please try again.");
      setDone(true); history.replaceState(null, "", location.pathname);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The service is unavailable. Please try again."); }
    finally { setBusy(false); setPassword(""); }
  }
  if (done) return <div role="status"><p>{tr("Registration checked. Sign in with your account password. Existing passwords have not been changed.")}</p><Link href="/">{tr("Back to log in")}</Link></div>;
  return <form onSubmit={submit} className="mt-8 w-full max-w-sm space-y-4" aria-busy={busy}>
    <p>{tr("Use the password you chose when requesting this verification email.")}</p>
    <label className="block">{tr("Password")}<input name="password" type="password" required minLength={8} maxLength={128} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} disabled={busy} className="mt-2 block h-11 w-full rounded-lg border px-3" /></label>
    {error && <p role="alert">{tr(error)}</p>}
    <button disabled={busy || !/^fv_verify_[a-f0-9]{48}$/.test(token)} className="rounded-lg bg-[var(--brand)] px-5 py-3 font-semibold text-white disabled:opacity-60">{tr(busy ? "Saving…" : "Verify email")}</button>
    <p><Link href="/create-account">{tr("Request a new verification email")}</Link></p>
  </form>;
}
