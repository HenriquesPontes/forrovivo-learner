import { NextResponse } from "next/server";
import {
  apiOrigin,
  SESSION_COOKIE,
  sessionCookieOptions,
  validatePassword,
  type AuthErrorBody,
  type AuthSuccess,
} from "@/lib/auth";

export async function POST(request: Request) {
  let body: { token?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { token?: unknown; password?: unknown };
  } catch {
    return NextResponse.json(
      { status: "error", message: "Request body must be JSON." },
      { status: 400 },
    );
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password =
    typeof body.password === "string" ? validatePassword(body.password) : null;
  if (!token || !password) {
    return NextResponse.json(
      {
        status: "error",
        message: "Enter a new password of at least 8 characters.",
      },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${apiOrigin()}/app/v1/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ token, password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Could not reset the password. Please try again." },
      { status: 503 },
    );
  }

  const data = (await upstream.json().catch(() => ({}))) as AuthSuccess | AuthErrorBody;
  if (!upstream.ok || data.status !== "ok" || !("token" in data)) {
    const code = "code" in data ? data.code : undefined;
    const message =
      code === "ACCOUNT_SUSPENDED"
        ? "This account is unavailable."
        : "This reset link is invalid or has expired.";
    return NextResponse.json(
      { status: "error", message },
      { status: upstream.status === 403 ? 403 : 400 },
    );
  }

  const response = NextResponse.json({
    status: "ok",
    email: data.email,
  });
  response.cookies.set(
    SESSION_COOKIE,
    data.token,
    sessionCookieOptions(data.expiresAt),
  );
  return response;
}
