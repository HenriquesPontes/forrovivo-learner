import type { Metadata } from "next";
import Link from "next/link";
import { AppDownloadCtas } from "@/components/AppDownloadCtas";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create a ForroVivo learning account in the iOS or Android app with Apple or Google.",
  alternates: { canonical: "/create-account" },
};

export default function CreateAccountPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-medium text-[var(--brand)]">Learner portal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
          Create account
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--muted)]">
          Open Forro Vivo on your phone and choose Sign in with Apple or Google.
          That creates your learning account and keeps progress with the catalog on{" "}
          <code className="rounded bg-[var(--surface)] px-1.5 py-0.5 text-sm">
            api.forrovivo.com
          </code>
          .
        </p>

        <section className="mt-10 max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-sm font-semibold tracking-tight">Download Forro Vivo</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Available for iPhone and Android.
          </p>
          <AppDownloadCtas className="mt-5" />
        </section>

        <p className="mt-8 text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--brand)] underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
