import { LearnerText } from "@/components/LearnerText";
import { CartoonScene } from "@/components/CartoonScene";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your ForroVivo Learner password.",
  alternates: { canonical: "/forgot-password" },
};

export default function ForgotPasswordPage() {
  return (
    <div className="learner-world learner-recovery">
      <SiteHeader />

      <main id="learner-main" tabIndex={-1} className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
        <CartoonScene scene="key" />
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-4xl"><LearnerText text={"Forgot password"} /></h1>
        <p className="mt-3 max-w-md text-base leading-relaxed text-[var(--muted)]"><LearnerText text={"Enter your email and we will send a link to reset your password."} /></p>

        <ForgotPasswordForm />
      </main>

      <SiteFooter />
    </div>
  );
}
