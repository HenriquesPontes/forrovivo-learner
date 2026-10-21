import { createHmac, timingSafeEqual } from "node:crypto";
import { RequestError, json } from "@/lib/http";
export { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, validateEmail, validatePassword } from "@/lib/validation";

export const SESSION_COOKIE = "fv_learner_session";
export const GUEST_COOKIE = "fv_learner_guest";
export const SCOPE_COOKIE = "fv_learner_context";
export const OAUTH_COOKIE = "fv_learner_oauth";

export type AuthSuccess = {
  status: "ok";
  token: string;
  expiresAt: string;
  accountKey: string;
  provider: string;
  email: string;
  displayName: string;
};

export type AuthErrorBody = {
  status?: string;
  code?: string;
  message?: string;
};

export function apiOrigin(): string {
  return configuredOrigin(process.env.API_ORIGIN?.trim() || "https://api.forrovivo.com");
}

export function learnOrigin(): string {
  return configuredOrigin(process.env.LEARN_ORIGIN?.trim() || "https://learn.forrovivo.com");
}

function configuredOrigin(raw: string) {
  const url = new URL(raw);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/" ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) {
    throw new Error("Invalid configured service origin");
  }
  return url.origin;
}

export function serviceKeyHeaders(): HeadersInit {
  const key = process.env.LEARNER_WEB_SERVICE_KEY?.trim();
  return key ? { "X-ForroVivo-Service-Key": key } : {};
}

export function resetDeliveryConfigured() {
  return Boolean(process.env.LEARNER_WEB_SERVICE_KEY?.trim() && process.env.RESEND_API_KEY?.trim());
}

export function requireWebSessionConfiguration() {
  if (!process.env.LEARNER_WEB_SERVICE_KEY?.trim()) throw new RequestError(503, "Sign-in is unavailable. Please try again later.");
}

export async function sendPasswordResetEmail(options: {
  to: string;
  resetUrl: string;
}): Promise<"sent" | "skipped" | "failed"> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "ForroVivo <hello@forrovivo.com>";
  if (!apiKey) {
    console.error("[auth] Password reset delivery is not configured.");
    return "skipped";
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [options.to],
        subject: "Reset your ForroVivo password",
        text: [
          "Reset your ForroVivo Learner password using this link:",
          options.resetUrl,
          "",
          "This link expires in one hour. If you did not ask for a reset, you can ignore this email.",
        ].join("\n"),
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error("[auth] Password reset delivery failed:", response.status);
      return "failed";
    }
    return "sent";
  } catch {
    console.error("[auth] Password reset delivery request failed.");
    return "failed";
  }
}

export function sessionCookieOptions(expiresAt: string) {
  const expires = new Date(expiresAt);
  if (!Number.isFinite(expires.getTime()) || expires.getTime() <= Date.now()) throw new RequestError(502, "The account service returned an invalid session.");
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

export function guestCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function clearGuestCookie(response: {
  cookies: { set: (name: string, value: string, options: object) => void };
}) {
  response.cookies.set(GUEST_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export const clearCookieOptions = {
  httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 0,
};

export function clearSessionCookies(response: ReturnType<typeof json>, guest = false) {
  for (const name of [SESSION_COOKIE, SCOPE_COOKIE, OAUTH_COOKIE, ...(guest ? [GUEST_COOKIE] : [])]) {
    response.cookies.set(name, "", clearCookieOptions);
  }
  return response;
}

export async function storageScope(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Buffer.from(bytes).toString("hex");
}

function contextSignature(value: string) {
  const key = process.env.LEARNER_WEB_SERVICE_KEY?.trim();
  return key ? createHmac("sha256", key).update(`forrovivo-learner-context:v1:${value}`).digest("hex") : null;
}

/** Signed cache identity and recent-auth time, bound to this exact session. */
export async function readSessionContext(value: string | undefined, token: string) {
  if (!value || value.length > 400) return null;
  const parts = value.split(".");
  if (parts.length !== 4 || !/^[a-f0-9]{64}$/.test(parts[0]) || !/^\d{13}$/.test(parts[1]) ||
    !/^[a-f0-9]{64}$/.test(parts[2]) || !/^[a-f0-9]{64}$/.test(parts[3])) return null;
  const signature = contextSignature(parts.slice(0, 3).join("."));
  if (!signature || !timingSafeEqual(Buffer.from(signature), Buffer.from(parts[3])) ||
    parts[2] !== await storageScope(token) || Number(parts[1]) > Date.now()) return null;
  return { scope: parts[0], authenticatedAt: Number(parts[1]) };
}

export async function authResponse(data: Record<string, unknown>) {
  requireWebSessionConfiguration();
  if (typeof data.token !== "string" || !/^fv_learn_[a-f0-9]{48}$/.test(data.token) ||
    typeof data.expiresAt !== "string" || !["apple", "google", "email"].includes(String(data.provider)) ||
    typeof data.accountKey !== "string" || !data.accountKey.startsWith(`${data.provider}:`) ||
    !/^(apple|google|email):[^\s\u0000-\u001f\u007f]{1,512}$/.test(data.accountKey)) {
    throw new RequestError(502, "The account service returned an invalid session.");
  }
  const options = sessionCookieOptions(data.expiresAt);
  const scope = await storageScope(data.accountKey);
  const context = `${scope}.${Date.now()}.${await storageScope(data.token)}`;
  const signature = contextSignature(context);
  const response = json({ status: "ok", provider: data.provider });
  response.cookies.set(SESSION_COOKIE, data.token, options);
  response.cookies.set(SCOPE_COOKIE, `${context}.${signature}`, options);
  clearGuestCookie(response);
  return response;
}
