export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-1 px-4 py-6 text-xs text-[var(--muted)] sm:px-6">
        <span suppressHydrationWarning>
          © {year} LIVLU TECHNOLOGIES LTD
        </span>
      </div>
    </footer>
  );
}
