"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border)] px-4 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-60"
    >
      {loading ? "Signing out…" : "Log out"}
    </button>
  );
}
