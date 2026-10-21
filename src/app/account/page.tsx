import { LearnerLanguage } from "@/components/LearnerLanguage";
import { authLocale } from "@/lib/auth-copy";
import { LearnerText } from "@/components/LearnerText";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { readLearnerAccess } from "@/lib/session";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AccountSettings } from "@/components/AccountSettings";

export default async function AccountPage() {
  const access = await readLearnerAccess();
  if (access.kind !== "account") redirect("/");
  return <LearnerLanguage initialLocale={authLocale(access.account.appLanguage)}><div className="learner-world learner-account"><SiteHeader signedIn />
    <main id="learner-main" tabIndex={-1} className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <Link href="/home" className="learner-back-link"><LearnerText text={"← Back to learning"} /></Link>
      <section className="profile-welcome">
        <div><p className="learner-eyebrow"><LearnerText text={"YOUR OWN LITTLE CORNER"} /></p><h1 className="text-3xl font-semibold text-[var(--brand-ink)]"><LearnerText text={"Your account"} /></h1>
        <p className="learner-account-intro"><LearnerText text={"Make yourself at home."} /><br /><LearnerText text={"Your profile, your preferences, your journey."} /></p></div>
        <div className="profile-mascot"><Image src="/images/onboarding/ready.png" width={160} height={160} alt="" priority /><span aria-hidden="true">✦</span></div>
      </section>
      <nav className="learner-account-sections" aria-label="Account sections"><a href="#profile"><LearnerText text={"Profile"} /></a><a href="#your-data"><LearnerText text={"Your data"} /></a><a href="#account-management"><LearnerText text={"Account management"} /></a></nav>
      <AccountSettings account={access.account} scope={access.scope} />
    </main><SiteFooter /></div></LearnerLanguage>;
}
