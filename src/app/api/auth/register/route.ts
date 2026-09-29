import { NextResponse } from "next/server";
import {
  apiOrigin,
  GUEST_COOKIE,
  SESSION_COOKIE,
  sessionCookieOptions,
  validateEmail,
  validatePassword,
  type AuthErrorBody,
  type AuthSuccess,
} from "@/lib/auth";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown; displayName?: unknown };
  try {
    body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
      displayName?: unknown;
    };
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
      {
        status: "error",
        message: "Enter a valid email and a password of at least 8 characters.",
      },
      { status: 400 },
    );
  }

  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim().slice(0, 120) : "";

  let upstream: Response;
  try {
    upstream = await fetch(`${apiOrigin()}/app/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password, displayName }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Could not create the account. Please try again." },
      { status: 503 },
    );
  }

  const data = (await upstream.json().catch(() => ({}))) as AuthSuccess | AuthErrorBody;
  if (!upstream.ok || data.status !== "ok" || !("token" in data)) {
    const code = "code" in data ? data.code : undefined;
    const message =
      code === "AUTH_EXISTS"
        ? "An account with this email already exists."
        : code === "ACCOUNT_SUSPENDED"
          ? "This account is unavailable."
          : upstream.status === 401 || code === "AUTH_INVALID"
            ? "Email or password is incorrect."
            : "Could not create the account. Please try again.";
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
  response.cookies.set(GUEST_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
