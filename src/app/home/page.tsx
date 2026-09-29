import { redirect } from "next/navigation";
import { AppDownloadCtas } from "@/components/AppDownloadCtas";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LogoutButton } from "@/components/LogoutButton";
import { apiOrigin } from "@/lib/auth";
import { readSessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePortalPage() {
  const token = await readSessionToken();
  if (!token) redirect("/");

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
    // Profile is optional; the session cookie is enough to stay signed in.
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader signedIn />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
          {displayName ? `Welcome, ${displayName}` : "Welcome back"}
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--muted)]">
          {email
            ? `Signed in as ${email}.`
            : "You are signed in to your ForroVivo learning account."}
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
      </main>

      <SiteFooter />
    </div>
  );
}
