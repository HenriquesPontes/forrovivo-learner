import { NextResponse } from "next/server";
import {
  apiOrigin,
  learnOrigin,
  sendPasswordResetEmail,
  serviceKeyHeaders,
  validateEmail,
  type AuthErrorBody,
} from "@/lib/auth";

export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = (await request.json()) as { email?: unknown };
  } catch {
    return NextResponse.json(
      { status: "error", message: "Request body must be JSON." },
      { status: 400 },
    );
  }

  const email = typeof body.email === "string" ? validateEmail(body.email) : null;
  if (!email) {
    return NextResponse.json(
      { status: "error", message: "Enter a valid email." },
      { status: 400 },
    );
  }

  const generic = NextResponse.json({
    status: "ok",
    message: "If an account exists for that email, we sent reset instructions.",
  });

  let upstream: Response;
  try {
    upstream = await fetch(`${apiOrigin()}/app/v1/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...serviceKeyHeaders(),
      },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Could not start password reset. Please try again." },
      { status: 503 },
    );
  }

  const data = (await upstream.json().catch(() => ({}))) as AuthErrorBody & {
    resetToken?: string;
    email?: string;
  };

  if (!upstream.ok) {
    if (upstream.status === 503) {
      return NextResponse.json(
        { status: "error", message: "Could not start password reset. Please try again." },
        { status: 503 },
      );
    }
    return generic;
  }

  if (typeof data.resetToken === "string" && data.resetToken) {
    const resetUrl = `${learnOrigin()}/reset-password?token=${encodeURIComponent(data.resetToken)}`;
    const mail = await sendPasswordResetEmail({
      to: typeof data.email === "string" ? data.email : email,
      resetUrl,
    });
    if (mail === "failed") {
      return NextResponse.json(
        { status: "error", message: "Could not send the reset email. Please try again." },
        { status: 503 },
      );
    }
  }

  return generic;
}
