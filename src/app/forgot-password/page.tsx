import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { readSessionToken } from "@/lib/session";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your ForroVivo Learner password.",
  alternates: { canonical: "/forgot-password" },
};

export default async function ForgotPasswordPage() {
  const token = await readSessionToken();
  if (token) redirect("/home");

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
          Forgot password
        </h1>
        <p className="mt-3 max-w-md text-base leading-relaxed text-[var(--muted)]">
          Enter your email and we will send a link to reset your password.
        </p>

        <ForgotPasswordForm />
      </main>

      <SiteFooter />
    </div>
  );
}
