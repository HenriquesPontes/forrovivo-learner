"use client";

import { LogoutButton } from "@/components/LogoutButton";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-lg px-6 py-16">
    <h1 className="text-2xl font-semibold">We could not load your account</h1>
    <p className="mt-3 text-[var(--muted)]">Your access could not be checked. Please try again shortly.</p>
    <button type="button" onClick={reset} className="mt-6 rounded-lg bg-[var(--brand)] px-5 py-3 font-semibold text-white">Try again</button>
    <div className="mt-4"><LogoutButton label="Log out of this browser" /></div>
  </main>;
}
