import type { Metadata } from "next";
import Link from "next/link";
import { AppDownloadCtas } from "@/components/AppDownloadCtas";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Log in",
  description:
    "Sign in to ForroVivo Learner. Use the Forro Vivo app on iOS or Android with Apple or Google.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-medium text-[var(--brand)]">Learner portal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
          Log in
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--muted)]">
          Learning accounts sign in with Apple or Google inside the Forro Vivo app.
          Download the app to continue, then return here for web progress when it opens.
        </p>

        <section className="mt-10 max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-sm font-semibold tracking-tight">Get the app</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            iOS and Android are the primary way to sign in and sync progress.
          </p>
          <AppDownloadCtas className="mt-5" />
        </section>

        <p className="mt-8 text-sm text-[var(--muted)]">
          New here?{" "}
          <Link
            href="/create-account"
            className="font-medium text-[var(--brand)] underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
