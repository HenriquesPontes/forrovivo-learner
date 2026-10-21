"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LogoutButtonProps = {
  label?: string;
};

export function LogoutButton({ label = "Log out" }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.status !== "ok") throw new Error("logout failed");
      router.replace("/");
      router.refresh();
    } catch { setError("Could not log out. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <span className="inline-flex flex-col items-end"><button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--border)] bg-white px-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/30"
    >
      {loading ? "Signing out…" : label}
    </button>
    {error && <span role="alert" className="mt-1 text-xs text-red-700">{error}</span>}</span>
  );
}
