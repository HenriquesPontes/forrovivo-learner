export const SESSION_COOKIE = "fv_learner_session";
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

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
  return process.env.API_ORIGIN?.trim() || "https://api.forrovivo.com";
}

export function sessionCookieOptions(expiresAt: string) {
  const expires = new Date(expiresAt);
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: Number.isNaN(expires.getTime()) ? undefined : expires,
  };
}

export function validateEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email || email.length > 320) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function validatePassword(raw: string): string | null {
  if (raw.length < MIN_PASSWORD_LENGTH || raw.length > MAX_PASSWORD_LENGTH) {
    return null;
  }
  return raw;
}
