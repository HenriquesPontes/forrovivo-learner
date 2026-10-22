"use client";

import { LearnerText } from "@/components/LearnerText";


import { useAuthLanguage } from "@/components/AuthLanguage";
import { useLearnerCopy } from "@/components/LearnerText";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Account } from "@/lib/backend";
import { forgetLocalProgress } from "@/lib/browser-progress";

export function AccountSettings({ account, scope }: { account: Account; scope: string }) {
  const router = useRouter();
  const { setLocale } = useAuthLanguage();
  const { tr } = useLearnerCopy();
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
      } else { setLocale(data.appLanguage === "pt" || data.appLanguage === "en" ? data.appLanguage : language === "pt" ? "pt" : "en"); setMessage("Profile saved."); }
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); setPassword(""); }
  }

  return <div className="profile-settings-grid">
    <details className="profile-signin"><summary><LearnerText text={"Sign-in details "} /><span aria-hidden="true">⌄</span></summary><p className="text-sm text-[var(--muted)]"><LearnerText text={"Signed in with "} />{account.provider}{account.email ? ` · ${account.email}` : ""}.</p>
    <p className="text-sm text-[var(--muted)]"><LearnerText text={"Use the same Apple or Google account on the website and in the apps to keep your progress together."} /></p></details>
    {message && <p role="status" className="profile-feedback">{tr(message)}</p>}
    <form id="profile" className="profile-settings-card space-y-4" onSubmit={event => { event.preventDefault(); void submit("PATCH"); }}>
      <div className="profile-card-heading"><span className="profile-card-symbol" aria-hidden="true">☺</span><div><h2 className="text-xl font-semibold"><LearnerText text={"Profile"} /></h2><p><LearnerText text={"A little more you."} /></p></div></div>
      <label className="block"><LearnerText text={"Name"} /><input required maxLength={120} value={name} onChange={event => setName(event.target.value)} className="mt-2 block h-11 w-full rounded-lg border border-[var(--border)] px-3" /></label>
      <label className="block"><LearnerText text={"Preferred interface language"} /><select value={language} onChange={event => setLanguage(event.target.value)} className="mt-2 block h-11 w-full rounded-lg border border-[var(--border)] px-3"><option value="en"><LearnerText text={"English"} /></option><option value="pt"><LearnerText text={"Português"} /></option></select></label>
      <button disabled={busy} className="rounded-lg bg-[var(--brand)] px-5 py-3 font-semibold text-white disabled:opacity-60"><LearnerText text={"Save profile"} /></button>
    </form>
    <section id="your-data" className="profile-data-card"><div className="profile-card-heading"><span className="profile-card-symbol" aria-hidden="true">↓</span><div><h2 className="text-xl font-semibold"><LearnerText text={"Your data"} /></h2><p><LearnerText text={"Your learning, to keep."} /></p></div></div><p className="mt-2 text-sm text-[var(--muted)]"><LearnerText text={"Download your account profile and cloud study snapshots for all six languages."} /></p>
      <a href={`/api/account/export?scope=${scope}`} download className="profile-download-link"><LearnerText text={"Download account and study data"} /></a>
    </section>
    <form id="account-management" className="profile-danger-card space-y-4" onSubmit={event => { event.preventDefault(); void submit("DELETE"); }}>
      <div className="profile-card-heading"><span className="profile-card-symbol" aria-hidden="true">!</span><div><h2 className="text-xl font-semibold"><LearnerText text={"Delete account"} /></h2><p><LearnerText text={"Manage your account carefully."} /></p></div></div>
      <p className="text-sm text-[var(--muted)]"><LearnerText text={"This permanently removes this account and its cloud data, and signs out its devices. This cannot be undone."} /></p>
      {account.provider === "email" ? <label className="block"><LearnerText text={"Current password"} /><input required type="password" autoComplete="current-password" maxLength={128} value={password} onChange={event => setPassword(event.target.value)} className="mt-2 block h-11 w-full rounded-lg border border-[var(--border)] px-3" /></label> :
        <p className="text-sm"><LearnerText text={"Sign-in must be from the last five minutes. "} /><Link href="/reauthenticate" className="text-[var(--brand)] underline"><LearnerText text={"Sign in again"} /></Link></p>}
      <label className="block"><LearnerText text={"Type DELETE to confirm"} /><input required autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)} className="mt-2 block h-11 w-full rounded-lg border border-[var(--border)] px-3" /></label>
      <button disabled={busy || confirmation !== "DELETE"} className="rounded-lg bg-red-700 px-5 py-3 font-semibold text-white disabled:opacity-50"><LearnerText text={"Delete my account"} /></button>
    </form>
  </div>;
}
