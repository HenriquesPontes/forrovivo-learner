import { VerifyEmailForm } from "@/components/VerifyEmailForm";
import { LearnerText } from "@/components/LearnerText";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function VerifyEmailPage() {
  return <div className="learner-world learner-recovery"><SiteHeader />
    <main id="learner-main" tabIndex={-1} className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12">
      <h1 className="text-3xl font-semibold"><LearnerText text="Verify email" /></h1><VerifyEmailForm />
    </main><SiteFooter /></div>;
}
