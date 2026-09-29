import Image from "next/image";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { LogoutButton } from "@/components/LogoutButton";

type SiteHeaderProps = {
  /** Full account session */
  signedIn?: boolean;
  /** Guest Academy session (no account) */
  guest?: boolean;
};

function LessonsIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 9h8M8 12h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserPlusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="10" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.5 18.5c.8-2.6 2.9-4 5.5-4s4.7 1.4 5.5 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18 8v6M15 11h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const outlineBtn =
  "inline-flex h-9 items-center gap-2 rounded-md border bg-white px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/30";

export function SiteHeader({ signedIn = false, guest = false }: SiteHeaderProps) {
  const inPortal = signedIn || guest;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href={inPortal ? "/home" : "/"}
          className="flex shrink-0 items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/30"
        >
          <Image
            src="/images/app/forro-icon.png"
            alt=""
            width={40}
            height={40}
            className="rounded-full"
            priority
          />
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight text-[var(--brand-ink)] sm:text-lg">
              ForroVivo
            </div>
            <div className="hidden text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)] sm:block">
              {guest ? "Guest" : "Learner"}
            </div>
          </div>
        </Link>

        <nav
          aria-label="Primary"
          className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5"
        >
          {signedIn ? (
            <>
              <Link
                href="/home"
                className={`${outlineBtn} border-[var(--brand)] text-[var(--brand)] hover:bg-[#e8f6ee]`}
              >
                <LessonsIcon />
                <span>Academy</span>
              </Link>
              <a
                href={SITE_URL}
                className="hidden text-sm font-medium text-[var(--foreground)]/80 underline-offset-4 hover:text-[var(--foreground)] hover:underline sm:inline"
              >
                forrovivo.com
              </a>
              <LogoutButton />
            </>
          ) : guest ? (
            <>
              <Link
                href="/create-account"
                className="inline-flex h-9 items-center gap-2 rounded-md bg-[#c45c5c] px-3 text-sm font-medium text-white hover:bg-[#b43b3b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c45c5c]/35"
              >
                <UserPlusIcon className="h-4 w-4 text-white" />
                <span>Save Your Progress</span>
              </Link>
              <Link
                href="/home"
                className="inline-flex h-9 items-center gap-1.5 px-2 text-sm font-medium text-[var(--foreground)] hover:text-[var(--brand-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/30 rounded-sm"
              >
                <LessonsIcon />
                <span>Home</span>
              </Link>
              <LogoutButton label="Logout" />
            </>
          ) : (
            <>
              <Link
                href="/try"
                className={`${outlineBtn} border-[#c45c5c] text-[#b43b3b] hover:bg-[#fdf4f4]`}
              >
                <LessonsIcon />
                <span>Try lessons</span>
              </Link>
              <a
                href={SITE_URL}
                className="hidden h-9 items-center px-2 text-sm font-medium text-[var(--foreground)]/75 underline-offset-4 hover:text-[var(--foreground)] hover:underline sm:inline-flex"
              >
                Website
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
