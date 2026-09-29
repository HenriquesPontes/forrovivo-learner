import Image from "next/image";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";

type SiteHeaderProps = {
  signedIn?: boolean;
};

export function SiteHeader({ signedIn = false }: SiteHeaderProps) {
  return (
    <header className="border-b border-[var(--border)]">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href={signedIn ? "/home" : "/"}
          className="flex items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/30"
        >
          <Image
            src="/images/app/forro-icon.png"
            alt=""
            width={36}
            height={36}
            className="rounded-full"
            priority
          />
          <div>
            <div className="text-sm font-semibold tracking-tight">ForroVivo Learner</div>
            <div className="text-xs text-[var(--muted)]">learn.forrovivo.com</div>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {signedIn ? (
            <Link
              href="/home"
              className="font-medium text-[var(--brand)] underline-offset-4 hover:underline"
            >
              Home
            </Link>
          ) : (
            <>
              <Link
                href="/"
                className="text-[var(--muted)] underline-offset-4 hover:text-[var(--foreground)] hover:underline"
              >
                Log in
              </Link>
              <Link
                href="/create-account"
                className="font-medium text-[var(--brand)] underline-offset-4 hover:underline"
              >
                Create account
              </Link>
            </>
          )}
          <a
            href={SITE_URL}
            className="hidden text-[var(--muted)] underline-offset-4 hover:text-[var(--foreground)] hover:underline sm:inline"
          >
            forrovivo.com
          </a>
        </nav>
      </div>
    </header>
  );
}
