"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Account } from "@/lib/backend";
import { forgetLocalProgress } from "@/lib/browser-progress";

export function AccountSettings({ account, scope }: { account: Account; scope: string }) {
  const router = useRouter();
  const [name, setName] = useState(account.displayName);
  const [language, setLanguage] = useState(account.appLanguage);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(method: "PATCH" | "DELETE") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account", { method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(method === "PATCH" ? { scope, displayName: name, appLanguage: language } : { scope, confirmation, password }) });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.status !== "ok") throw new Error(data?.message || "Could not update your account.");
      if (method === "DELETE") {
        if (!data.deleted) throw new Error("Account deletion was not confirmed.");
        try { forgetLocalProgress(scope); } catch { /* Remote deletion succeeded; the browser may block storage access. */ }
        router.replace("/");
      } else { setMessage("Profile saved."); }
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); setPassword(""); }
  }

  return <div className="mt-8 space-y-10">
    <p className="text-sm text-[var(--muted)]">Signed in with {account.provider}{account.email ? ` · ${account.email}` : ""}.</p>
    <p className="text-sm text-[var(--muted)]">For Apple or Google sync, use the same provider on an app that supports it. Email/password accounts currently work on the website and are separate from Apple and Google accounts.</p>
    <form className="space-y-4" onSubmit={event => { event.preventDefault(); void submit("PATCH"); }}>
      <label className="block">Name<input required maxLength={120} value={name} onChange={event => setName(event.target.value)} className="mt-2 block h-11 w-full rounded-lg border border-[var(--border)] px-3" /></label>
      <label className="block">Preferred interface language<select value={language} onChange={event => setLanguage(event.target.value)} className="mt-2 block h-11 w-full rounded-lg border border-[var(--border)] px-3"><option value="en">English</option><option value="pt">Português</option></select></label>
      <button disabled={busy} className="rounded-lg bg-[var(--brand)] px-5 py-3 font-semibold text-white disabled:opacity-60">Save profile</button>
    </form>
    <section><h2 className="text-xl font-semibold">Your data</h2><p className="mt-2 text-sm text-[var(--muted)]">Download your account profile and cloud study snapshots for all six languages.</p>
      <a href={`/api/account/export?scope=${scope}`} download className="mt-3 inline-block font-medium text-[var(--brand)] underline">Download account and study data</a>
    </section>
    <form className="space-y-4 border-t border-[var(--border)] pt-8" onSubmit={event => { event.preventDefault(); void submit("DELETE"); }}>
      <h2 className="text-xl font-semibold">Delete account</h2>
      <p className="text-sm text-[var(--muted)]">This permanently removes this account and its cloud data, and signs out its devices. This cannot be undone.</p>
      {account.provider === "email" ? <label className="block">Current password<input required type="password" autoComplete="current-password" maxLength={128} value={password} onChange={event => setPassword(event.target.value)} className="mt-2 block h-11 w-full rounded-lg border border-[var(--border)] px-3" /></label> :
        <p className="text-sm">Sign-in must be from the last five minutes. <Link href="/reauthenticate" className="text-[var(--brand)] underline">Sign in again</Link></p>}
      <label className="block">Type DELETE to confirm<input required autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)} className="mt-2 block h-11 w-full rounded-lg border border-[var(--border)] px-3" /></label>
      <button disabled={busy || confirmation !== "DELETE"} className="rounded-lg bg-red-700 px-5 py-3 font-semibold text-white disabled:opacity-50">Delete my account</button>
    </form>
    {message && <p role="status" className="text-sm">{message}</p>}
  </div>;
}
