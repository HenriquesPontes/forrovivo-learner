"use client";

import { LearnerText, useLearnerCopy } from "@/components/LearnerText";


import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
  const { tr } = useLearnerCopy();
  const inPortal = signedIn || guest;
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && menuRef.current && !menuRef.current.contains(event.target)) menuRef.current.open = false;
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuRef.current?.open) {
        menuRef.current.open = false;
        menuRef.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeOnEscape); };
  }, []);

  return (
    <header className="learner-header">
      <a href="#learner-main" className="learner-skip-link"><LearnerText text={"Skip to content"} /></a>
      <div className="learner-header-inner">
        <Link
          href={inPortal ? "/home" : "/"}
          className="learner-brand"
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
            <div className="text-base font-semibold tracking-tight text-[var(--brand-ink)] sm:text-lg"><LearnerText text={"ForroVivo"} /></div>
            <div className="hidden text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)] sm:block">
              {tr(guest ? "Guest" : "Learner")}
            </div>
          </div>
        </Link>

        <nav
          aria-label={tr("Primary")}
          className="learner-nav"
        >
          {inPortal && <details className="learner-course-switch" ref={menuRef}>
            <summary aria-label={tr("Choose a course")}><span className="learner-course-symbol" aria-hidden="true">🌴</span><span className="learner-course-switch-label"><small><LearnerText text={"MY COURSE"} /></small><strong><LearnerText text={"Forro"} /></strong></span><span className="learner-course-chevron" aria-hidden="true">⌄</span></summary>
            <div className="learner-course-dropdown">
              <p className="learner-course-dropdown-title"><LearnerText text={"Your courses"} /></p>
              <Link href="/home" onClick={() => { if (menuRef.current) menuRef.current.open = false; }} className="learner-selected-course"><span aria-hidden="true">🌴</span><span><strong><LearnerText text={"Forro"} /></strong><small><LearnerText text={"São Tomé & Príncipe"} /></small></span><span aria-hidden="true">✓</span><span className="sr-only"><LearnerText text={"Current course"} /></span></Link>
              <p className="learner-course-dropdown-note"><LearnerText text={"Forro is the course available on the web today. Discover more languages in the ForroVivo app."} /></p>
              <div className="learner-mobile-signout"><LogoutButton label={guest ? "Logout" : "Log out"} /></div>
            </div>
          </details>}
          {signedIn ? (
            <>
              <Link
                href="/home"
                aria-current={pathname === "/home" ? "page" : undefined}
                className={`${outlineBtn} border-[var(--brand)] text-[var(--brand)] hover:bg-[#e8f6ee]`}
              >
                <LessonsIcon />
                <span><LearnerText text={"Academy"} /></span>
              </Link>

              <LogoutButton />
              <Link href="/account" className="learner-account-link" aria-label={tr("Account")} title={tr("Account")} aria-current={pathname === "/account" ? "page" : undefined}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg><span><LearnerText text={"Account"} /></span></Link>
            </>
          ) : guest ? (
            <>
              <Link
                href="/"
                aria-label="Save Your Progress"
                className="inline-flex h-9 items-center gap-2 rounded-md bg-[#c45c5c] px-3 text-sm font-medium text-white hover:bg-[#b43b3b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c45c5c]/35"
              >
                <UserPlusIcon className="h-4 w-4 text-white" />
                <span><LearnerText text={"Save Your Progress"} /></span>
              </Link>
              <Link
                href="/home"
                className="inline-flex h-9 items-center gap-1.5 px-2 text-sm font-medium text-[var(--foreground)] hover:text-[var(--brand-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/30 rounded-sm"
              >
                <LessonsIcon />
                <span><LearnerText text={"Home"} /></span>
              </Link>
              <LogoutButton label="Logout" />
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
