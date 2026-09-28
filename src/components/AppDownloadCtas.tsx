import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/constants";

function AppleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3.6 2.7c-.3.2-.5.5-.5.9v16.8c0 .4.2.7.5.9l.1.1 9.4-9.4v-.2L3.7 2.6l-.1.1zm11.1 6.3L12 11.7l-2.1 2.1 4.8 4.8c.4-.2 6.5-3.7 6.8-3.9.4-.2.6-.4.6-.8 0-.3-.2-.6-.5-.8l-6.9-4.1zm.2-1.1 6.6 3.8c.1 0 .1.1.2.1L8.5 2.3c.3 0 .5.1.7.2l5.7 5.4zM8.5 21.7l6.4-6.4-2.1-2.1-4.3 4.3v4.2z" />
    </svg>
  );
}

type AppDownloadCtasProps = {
  className?: string;
};

export function AppDownloadCtas({ className = "" }: AppDownloadCtasProps) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${className}`}>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-12 items-center justify-center gap-3 rounded-lg bg-[var(--foreground)] px-5 text-sm font-semibold text-white hover:bg-[var(--brand-ink)]"
      >
        <AppleGlyph className="h-5 w-5 shrink-0" />
        <span className="flex flex-col items-start leading-none">
          <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">
            Download on the
          </span>
          <span className="mt-0.5 text-base">App Store</span>
        </span>
      </a>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-12 items-center justify-center gap-3 rounded-lg border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface)]"
      >
        <PlayGlyph className="h-5 w-5 shrink-0 text-[var(--brand)]" />
        <span className="flex flex-col items-start leading-none">
          <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
            Get it on
          </span>
          <span className="mt-0.5 text-base">Google Play</span>
        </span>
      </a>
    </div>
  );
}
