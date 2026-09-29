import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { readSessionToken } from "@/lib/session";

export default async function Home() {
  const token = await readSessionToken();
  if (token) redirect("/home");

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-medium text-[var(--brand)]">Learner portal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
          Log in
        </h1>
        <p className="mt-3 max-w-md text-base leading-relaxed text-[var(--muted)]">
          Sign in with your email and password to open your ForroVivo learning account on the web.
        </p>

        <AuthForm mode="login" />
      </main>

      <SiteFooter />
    </div>
  );
}
