"use client";

import { useLearnerCopy } from "@/components/LearnerText";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LogoutButtonProps = {
  label?: string;
};

export function LogoutButton({ label = "Log out" }: LogoutButtonProps) {
  const { tr } = useLearnerCopy();
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
      aria-label={tr(loading ? "Signing out…" : label)}
      title={tr(loading ? "Signing out…" : label)}
      aria-busy={loading}
      className="learner-logout-icon"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m10 3 4 2v14l-4 2V3Z" fill="currentColor" fillOpacity=".14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M15 12h6m-3-3 3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
    {error && <span role="alert" className="mt-1 text-xs text-red-700">{tr(error)}</span>}</span>
  );
}
