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
      { status: "error", message: "Could not reach the account service." },
      { status: 503 },
    );
  }

  const data = (await upstream.json().catch(() => ({}))) as AuthSuccess | AuthErrorBody;
  if (!upstream.ok || data.status !== "ok" || !("token" in data)) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "message" in data && typeof data.message === "string"
            ? data.message
            : "Could not create the account.",
      },
      { status: upstream.status || 400 },
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
