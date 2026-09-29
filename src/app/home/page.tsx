import { redirect } from "next/navigation";
import { AppDownloadCtas } from "@/components/AppDownloadCtas";
import { CourseMap } from "@/components/academy/CourseMap";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { fetchForroCurriculum } from "@/lib/learning-path";
import { readLearnerAccess } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePortalPage() {
  const access = await readLearnerAccess();
  if (access.kind === null) redirect("/");

  const isGuest = access.kind === "guest";

  let units: Awaited<ReturnType<typeof fetchForroCurriculum>> = [];
  let catalogError = false;
  try {
    units = await fetchForroCurriculum();
  } catch {
    catalogError = true;
  }

  return (
    <div className="flex flex-1 flex-col bg-[#fafafa]">
      <SiteHeader signedIn={access.kind === "account"} guest={isGuest} />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-3xl">
            Forro
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {isGuest
              ? "Guest path · Unit 1 open"
              : "Select a lesson on the path"}
          </p>
        </div>

        <section className="mt-8 flex-1">
          {catalogError ? (
            <p className="text-center text-sm text-[var(--muted)]">
              Could not load the Academy catalog. Refresh the page, or continue
              in the native app.
            </p>
          ) : (
            <CourseMap units={units} guestMode={isGuest} />
          )}
        </section>

        <section className="mx-auto mt-10 max-w-sm border-t border-[var(--border)] pt-8 text-center">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--brand-ink)]">
            Also on the app
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Dictionary, audio, and offline study on iOS and Android.
          </p>
          <AppDownloadCtas className="mt-4 justify-center" />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
