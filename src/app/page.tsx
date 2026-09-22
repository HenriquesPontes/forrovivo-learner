import Image from "next/image";
import { APP_STORE_URL, SITE_URL } from "@/lib/constants";
import { getLearningHealth } from "@/lib/health";

export const dynamic = "force-dynamic";

export default async function Home() {
  const health = await getLearningHealth();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/images/app/forro-icon.png"
              alt=""
              width={36}
              height={36}
              className="rounded-full"
              priority
            />
            <div>
              <div className="text-sm font-semibold tracking-tight">ForroVivo Learner</div>
              <div className="text-xs text-[var(--muted)]">learn.forrovivo.com</div>
            </div>
          </div>
          <a
            href={SITE_URL}
            className="text-sm text-[var(--muted)] underline-offset-4 hover:text-[var(--foreground)] hover:underline"
          >
            forrovivo.com
          </a>
        </div>
      </header>

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
          . Web sign-in and progress views ship here next.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={APP_STORE_URL}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-white hover:bg-[var(--brand-ink)]"
            rel="noopener noreferrer"
            target="_blank"
          >
            Open Forro Vivo on the App Store
          </a>
          <a
            href={`${SITE_URL}/dictionaries`}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)]"
          >
            Browse dictionaries
          </a>
        </div>

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

      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-1 px-4 py-6 text-xs text-[var(--muted)] sm:px-6">
          <span>LIVLU TECHNOLOGIES LTD</span>
          <span>Learner portal · forrovivo-learner · learn.forrovivo.com</span>
        </div>
      </footer>
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
