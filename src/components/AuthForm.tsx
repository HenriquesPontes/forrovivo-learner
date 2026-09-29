"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(
        mode === "login" ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            ...(mode === "register" ? { displayName: displayName.trim() } : {}),
          }),
        },
      );
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

  return (
    <form onSubmit={onSubmit} className="mt-8 w-full max-w-sm space-y-4">
      {mode === "register" ? (
        <label className="block">
          <span className="text-sm font-medium text-[var(--foreground)]">Name</span>
          <input
            type="text"
            name="displayName"
            autoComplete="name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            disabled={status === "loading"}
            className="mt-1.5 h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
            placeholder="Optional"
          />
        </label>
      ) : null}

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

      <label className="block">
        <span className="text-sm font-medium text-[var(--foreground)]">Password</span>
        <input
          type="password"
          name="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
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
        {status === "loading"
          ? mode === "login"
            ? "Signing in…"
            : "Creating account…"
          : mode === "login"
            ? "Log in"
            : "Create account"}
      </button>

      <p className="text-sm text-[var(--muted)]">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link
              href="/create-account"
              className="font-medium text-[var(--brand)] underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href="/"
              className="font-medium text-[var(--brand)] underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
