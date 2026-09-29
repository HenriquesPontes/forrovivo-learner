import { NextResponse } from "next/server";
import {
  apiOrigin,
  SESSION_COOKIE,
  sessionCookieOptions,
  validateEmail,
  validatePassword,
  type AuthErrorBody,
  type AuthSuccess,
} from "@/lib/auth";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; password?: unknown };
  } catch {
    return NextResponse.json(
      { status: "error", message: "Request body must be JSON." },
      { status: 400 },
    );
  }

  const email = typeof body.email === "string" ? validateEmail(body.email) : null;
  const password =
    typeof body.password === "string" ? validatePassword(body.password) : null;
  if (!email || !password) {
    return NextResponse.json(
      { status: "error", message: "Enter a valid email and password." },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${apiOrigin()}/app/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Could not sign in. Please try again." },
      { status: 503 },
    );
  }

  const data = (await upstream.json().catch(() => ({}))) as AuthSuccess | AuthErrorBody;
  if (!upstream.ok || data.status !== "ok" || !("token" in data)) {
    const code = "code" in data ? data.code : undefined;
    const message =
      code === "ACCOUNT_SUSPENDED"
        ? "This account is unavailable."
        : upstream.status === 401 || code === "AUTH_INVALID"
          ? "Email or password is incorrect."
          : "Could not sign in. Please try again.";
    return NextResponse.json(
      { status: "error", message },
      { status: upstream.status === 401 ? 401 : upstream.status === 403 ? 403 : 400 },
    );
  }

  const response = NextResponse.json({
    status: "ok",
    email: data.email,
    displayName: data.displayName,
  });
  response.cookies.set(
    SESSION_COOKIE,
    data.token,
    sessionCookieOptions(data.expiresAt),
  );
  return response;
}
