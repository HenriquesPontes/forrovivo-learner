import { LearnerLanguage } from "@/components/LearnerLanguage";
import { authLocale } from "@/lib/auth-copy";
import { LearnerText } from "@/components/LearnerText";
import Image from "next/image";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/constants";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CourseMap } from "@/components/academy/CourseMap";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { fetchForroCurriculum } from "@/lib/catalog";
import { QUICK_ONBOARDING_COOKIE } from "@/lib/onboarding";
import { readLearnerAccess } from "@/lib/session";
import { AllSetGate } from "@/components/AllSetGate";
import { LearnerProgress, ProgressStatus } from "@/components/academy/LearnerProgress";

export const dynamic = "force-dynamic";

export default async function HomePortalPage() {
  const access = await readLearnerAccess();
  if (access.kind !== "account") redirect("/");
  const quickSeen = (await cookies()).get(QUICK_ONBOARDING_COOKIE)?.value === "1";

  let units: Awaited<ReturnType<typeof fetchForroCurriculum>> = [];
  let catalogError = false;
  try {
    units = await fetchForroCurriculum();
  } catch {
    catalogError = true;
  }

  return (
    <LearnerLanguage initialLocale={authLocale(access.account.appLanguage)}><AllSetGate show={!quickSeen}><div className="learner-world learner-home">
      <SiteHeader signedIn />

      <LearnerProgress key={access.scope} scope={access.scope} guest={false}>
      <main id="learner-main" tabIndex={-1} className="learner-dashboard">
        <div className="learner-path-panel" id="learning-path">
          <div className="learner-panel-heading">
            <div><p className="learner-eyebrow"><LearnerText text={"YOUR COURSE"} /></p><h1><LearnerText text={"Forro"} /></h1><p><LearnerText text={"One lesson at a time. Pick up where you left off."} /></p></div>
            <div className="learner-course-island"><Image src="/images/auth/forrovivo-island.webp" width={170} height={114} alt="Illustrated São Tomé island" /><span className="learner-language-badge"><LearnerText text={"São Tomé & Príncipe"} /></span></div>
          </div>
        <ProgressStatus />
        <details className="learner-app-float">
          <summary><LearnerText text="Try the app" /></summary>
          <div className="learner-app-float-menu"><a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M17.05 12.54c.03 3.17 2.78 4.22 2.81 4.24-.02.07-.44 1.5-1.45 2.98-.88 1.28-1.79 2.56-3.22 2.59-1.41.03-1.86-.84-3.47-.84-1.6 0-2.1.81-3.44.87-1.38.05-2.43-1.39-3.31-2.67-1.8-2.62-3.18-7.4-1.33-10.63a5.14 5.14 0 0 1 4.34-2.63c1.36-.03 2.64.92 3.47.92.83 0 2.39-1.14 4.02-.97.68.03 2.6.28 3.83 2.08-.1.06-2.28 1.33-2.25 4.06ZM14.4 4.68c.73-.89 1.22-2.12 1.08-3.35-1.05.04-2.32.7-3.08 1.59-.68.78-1.28 2.03-1.12 3.23 1.17.09 2.37-.6 3.12-1.47Z"/></svg><span>App Store</span></a><a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 2.5 14 12 3 21.5Z" fill="#4285F4"/><path d="m3 2.5 14.1 8.1L14 12Z" fill="#34A853"/><path d="m3 21.5 14.1-8.1L14 12Z" fill="#EA4335"/><path d="m17.1 10.6 3 1.7-3 1.7L14 12Z" fill="#FBBC04"/></svg><span>Google Play</span></a></div>
        </details>

        <section className="learner-course-section" aria-label="Forro course map">
          {catalogError ? (
            <p className="text-center text-sm text-[var(--muted)]"><LearnerText text={"Could not load the Academy catalog. Refresh the page, or continue in the native app."} /></p>
          ) : (
            <CourseMap units={units} />
          )}
        </section>

        </div>
      </main>
      </LearnerProgress>

      <SiteFooter />
    </div></AllSetGate></LearnerLanguage>
  );
}
