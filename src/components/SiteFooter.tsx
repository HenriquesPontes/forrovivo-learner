import { LearnerText } from "@/components/LearnerText";
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-[var(--muted)] sm:px-6 lg:px-8">
        <span suppressHydrationWarning>
          © {year}{" "}<LearnerText text={"LIVLU TECHNOLOGIES LTD · All rights reserved."} /></span>
      </div>
    </footer>
  );
}
