import { redirect } from "next/navigation";
import { AppDownloadCtas } from "@/components/AppDownloadCtas";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LogoutButton } from "@/components/LogoutButton";
import { apiOrigin } from "@/lib/auth";
import { readSessionToken } from "@/lib/session";
import { getLearningHealth } from "@/lib/health";

export const dynamic = "force-dynamic";

export default async function HomePortalPage() {
  const token = await readSessionToken();
  if (!token) redirect("/");

  const health = await getLearningHealth();

  let email: string | null = null;
  let displayName = "";
  try {
    const response = await fetch(`${apiOrigin()}/app/v1/account`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (response.ok) {
      const data = (await response.json()) as {
        account?: { email?: string | null; displayName?: string };
      };
      email = data.account?.email ?? null;
      displayName = data.account?.displayName?.trim() || "";
    }
  } catch {
    // Account profile is optional on this screen; session cookie is enough to stay signed in.
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader signedIn />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-medium text-[var(--brand)]">Learner portal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
          {displayName ? `Welcome, ${displayName}` : "Welcome back"}
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--muted)]">
          {email
            ? `Signed in as ${email}. Progress views and recovery tools ship here next.`
            : "You are signed in. Progress views and recovery tools ship here next."}
        </p>

        <div className="mt-6">
          <LogoutButton />
        </div>

        <section className="mt-10 max-w-lg">
          <h2 className="text-sm font-semibold tracking-tight">Continue in the app</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Lessons and daily practice stay on iOS and Android.
          </p>
          <AppDownloadCtas className="mt-4" />
        </section>

        <section className="mt-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-sm font-semibold tracking-tight">Learning API status</h2>
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
