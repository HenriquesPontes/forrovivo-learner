import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { readSessionToken } from "@/lib/session";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a ForroVivo Learner account with email and password.",
  alternates: { canonical: "/create-account" },
};

export default async function CreateAccountPage() {
  const token = await readSessionToken();
  if (token) redirect("/home");

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-medium text-[var(--brand)]">Learner portal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
          Create account
        </h1>
        <p className="mt-3 max-w-md text-base leading-relaxed text-[var(--muted)]">
          Create a web learning account with email and password. Native apps still use Apple or
          Google on the device.
        </p>

        <AuthForm mode="register" />
      </main>

      <SiteFooter />
    </div>
  );
}
