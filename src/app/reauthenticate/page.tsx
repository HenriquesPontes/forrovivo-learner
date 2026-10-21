import { LearnerLanguage } from "@/components/LearnerLanguage";
import { authLocale } from "@/lib/auth-copy";
import { LearnerText } from "@/components/LearnerText";
import { CartoonScene } from "@/components/CartoonScene";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/session";
import { BackendError } from "@/lib/backend";
import { AuthForm } from "@/components/AuthForm";
import { SocialSignIn } from "@/components/SocialSignIn";
import { SiteHeader } from "@/components/SiteHeader";
import { APPLE_WEB_CLIENT_ID, GOOGLE_WEB_CLIENT_ID, APP_STORE_URL, PLAY_STORE_URL } from "@/lib/constants";

export default async function ReauthenticatePage() {
  const access = await requireAccount({ allowLegacy: true }).catch(error => {
    if (error instanceof BackendError && [401, 403, 404].includes(error.status)) redirect("/api/auth/clear-invalid");
    throw error;
  });
  const socialAvailable = access.account.provider === "apple" ? Boolean(APPLE_WEB_CLIENT_ID) : Boolean(GOOGLE_WEB_CLIENT_ID);
  return <LearnerLanguage initialLocale={authLocale(access.account.appLanguage)}><div className="learner-world learner-recovery"><SiteHeader signedIn /><main id="learner-main" tabIndex={-1} className="mx-auto max-w-lg px-6 py-12">
    <CartoonScene scene="key" />
    <h1 className="text-2xl font-semibold"><LearnerText text={"Sign in again"} /></h1>
    <p className="mt-3 text-[var(--muted)]"><LearnerText text={"Sign in with your current account to continue. Your cloud lessons stay saved."} /></p>
    {access.account.provider === "email" ? <AuthForm mode="login" returnTo="/account" /> : socialAvailable ? <SocialSignIn returnTo="/account" /> :
      <p role="status" className="mt-6 text-sm"><LearnerText text={"Web sign-in for your provider is currently unavailable. You can continue with your existing account in an app that supports your provider: "} /><a href={APP_STORE_URL} className="text-[var(--brand)] underline"><LearnerText text={"iPhone app"} /></a><LearnerText text={" or "} /><a href={PLAY_STORE_URL} className="text-[var(--brand)] underline"><LearnerText text={"Android app"} /></a>.</p>}
  </main></div></LearnerLanguage>;
}
