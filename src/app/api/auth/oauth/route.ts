import { NextResponse } from "next/server";
import {
  apiOrigin,
  SESSION_COOKIE,
  sessionCookieOptions,
  type AuthErrorBody,
} from "@/lib/auth";

type SessionSuccess = {
  status: "ok";
  token: string;
  expiresAt: string;
  accountKey: string;
  provider: string;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) return null;
  try {
    const padded =
      parts[1].replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (parts[1].length % 4)) % 4);
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function ensureAccountProfile(
  token: string,
  accountKey: string,
  idToken: string,
) {
  const claims = decodeJwtPayload(idToken);
  const email =
    typeof claims?.email === "string" ? claims.email.trim().toLowerCase() : null;
  const name =
    typeof claims?.name === "string" && claims.name.trim()
      ? claims.name.trim().slice(0, 120)
      : email?.split("@")[0] || "Learner";

  await fetch(`${apiOrigin()}/app/v1/account`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-ForroVivo-Account": accountKey,
    },
    body: JSON.stringify({
      schemaVersion: 1,
      displayName: name,
      email,
      appLanguage: "en",
      studyLanguage: "forro",
      updatedAt: new Date().toISOString(),
    }),
    cache: "no-store",
  }).catch(() => {
    // Profile upsert is best-effort; session cookie alone is enough to enter /home.
  });
}

export async function POST(request: Request) {
  let body: { idToken?: unknown };
  try {
    body = (await request.json()) as { idToken?: unknown };
  } catch {
    return NextResponse.json(
      { status: "error", message: "Request body must be JSON." },
      { status: 400 },
    );
  }

  const idToken = typeof body.idToken === "string" ? body.idToken.trim() : "";
  if (!idToken || idToken.length > 8192) {
    return NextResponse.json(
      { status: "error", message: "A valid Apple or Google identity token is required." },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${apiOrigin()}/app/v1/session`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: "{}",
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Could not reach the account service." },
      { status: 503 },
    );
  }

  const data = (await upstream.json().catch(() => ({}))) as
    | SessionSuccess
    | AuthErrorBody;

  if (!upstream.ok || data.status !== "ok" || !("token" in data)) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "message" in data && typeof data.message === "string"
            ? data.message
            : "Apple or Google sign-in failed.",
      },
      { status: upstream.status || 401 },
    );
  }

  await ensureAccountProfile(data.token, data.accountKey, idToken);

  const response = NextResponse.json({
    status: "ok",
    provider: data.provider,
    accountKey: data.accountKey,
  });
  response.cookies.set(
    SESSION_COOKIE,
    data.token,
    sessionCookieOptions(data.expiresAt),
  );
  return response;
}
