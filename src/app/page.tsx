import Link from "next/link";
import { AppDownloadCtas } from "@/components/AppDownloadCtas";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_URL } from "@/lib/constants";
import { getLearningHealth } from "@/lib/health";

export const dynamic = "force-dynamic";

export default async function Home() {
  const health = await getLearningHealth();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-medium text-[var(--brand)]">Learner portal</p>
        <h1 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
          Your Forro Vivo learning account, on the web.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--muted)]">
          This host is the web companion for learners. Lessons, progress sync, and account
          recovery stay on the Forro Vivo apps and{" "}
          <code className="rounded bg-[var(--surface)] px-1.5 py-0.5 text-sm">
            api.forrovivo.com
          </code>
          . Sign in or create an account in the app, then return here for web progress.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-white hover:bg-[var(--brand-ink)]"
          >
            Log in
          </Link>
          <Link
            href="/create-account"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)]"
          >
            Create account
          </Link>
          <a
            href={`${SITE_URL}/dictionaries`}
            className="inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-medium text-[var(--muted)] underline-offset-4 hover:text-[var(--foreground)] hover:underline"
          >
            Browse dictionaries
          </a>
        </div>

        <section className="mt-10 max-w-lg">
          <h2 className="text-sm font-semibold tracking-tight">Download the app</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            iOS and Android — sign in with Apple or Google.
          </p>
          <AppDownloadCtas className="mt-4" />
        </section>

        <section className="mt-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-sm font-semibold tracking-tight">Learning API status</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Live probes against the Learning catalog Worker. No invented metrics.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center justify-between gap-3">
              <span>Catalog health</span>
              <Status ok={health.probes.catalog.ok} status={health.probes.catalog.status} />
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Account health</span>
              <Status ok={health.probes.account.ok} status={health.probes.account.status} />
            </li>
          </ul>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Status({ ok, status }: { ok: boolean; status: number | null }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
      }`}
    >
      {ok ? `OK${status != null ? ` · ${status}` : ""}` : `Down${status != null ? ` · ${status}` : ""}`}
    </span>
  );
}
