"use client";

import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data: { message?: string } = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus("error");
        setMessage(data.message || "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
      setMessage(
        data.message ||
          "If an account exists for that email, we sent reset instructions.",
      );
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-8 w-full max-w-sm space-y-4">
        <p className="text-sm leading-relaxed text-[var(--muted)]">{message}</p>
        <p className="text-sm text-[var(--muted)]">
          <Link
            href="/"
            className="font-medium text-[var(--brand)] underline-offset-4 hover:underline"
          >
            Back to log in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 w-full max-w-sm space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-[var(--foreground)]">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={status === "loading"}
          className="mt-1.5 h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
          placeholder="you@example.com"
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
        {status === "loading" ? "Sending…" : "Send reset link"}
      </button>

      <p className="text-sm text-[var(--muted)]">
        <Link
          href="/"
          className="font-medium text-[var(--brand)] underline-offset-4 hover:underline"
        >
          Back to log in
        </Link>
      </p>
    </form>
  );
}
