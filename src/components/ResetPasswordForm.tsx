"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data: { message?: string } = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus("error");
        setMessage(data.message || "Something went wrong. Please try again.");
        return;
      }
      router.replace("/home");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (!token) {
    return (
      <div className="mt-8 w-full max-w-sm space-y-4">
        <p className="text-sm text-red-700" role="alert">
          This reset link is invalid or has expired.
        </p>
        <p className="text-sm text-[var(--muted)]">
          <Link
            href="/forgot-password"
            className="font-medium text-[var(--brand)] underline-offset-4 hover:underline"
          >
            Request a new link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 w-full max-w-sm space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-[var(--foreground)]">New password</span>
        <input
          type="password"
          name="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={status === "loading"}
          className="mt-1.5 h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
          placeholder="Password"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-[var(--foreground)]">Confirm password</span>
        <input
          type="password"
          name="confirm"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          disabled={status === "loading"}
          className="mt-1.5 h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
          placeholder="Password"
        />
      </label>

      {status === "error" ? (
        <p className="text-sm text-red-700" role="alert">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-white hover:bg-[var(--brand-ink)] disabled:opacity-60"
      >
        {status === "loading" ? "Saving…" : "Reset password"}
      </button>
    </form>
  );
}
