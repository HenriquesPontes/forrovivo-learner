import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { readSessionToken } from "@/lib/session";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new ForroVivo Learner password.",
  alternates: { canonical: "/reset-password" },
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const session = await readSessionToken();
  if (session) redirect("/home");

  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token.trim() : "";

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
          Reset password
        </h1>
        <p className="mt-3 max-w-md text-base leading-relaxed text-[var(--muted)]">
          Choose a new password for your account.
        </p>

        <ResetPasswordForm token={token} />
      </main>

      <SiteFooter />
    </div>
  );
}
