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

export function learnOrigin(): string {
  const fromEnv = process.env.LEARN_ORIGIN?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "https://learn.forrovivo.com";
}

export function serviceKeyHeaders(): HeadersInit {
  const key = process.env.LEARNER_WEB_SERVICE_KEY?.trim();
  return key ? { "X-ForroVivo-Service-Key": key } : {};
}

export async function sendPasswordResetEmail(options: {
  to: string;
  resetUrl: string;
}): Promise<"sent" | "skipped" | "failed"> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "ForroVivo <noreply@forrovivo.com>";
  if (!apiKey) {
    console.info("[auth] RESEND_API_KEY not set; password reset email skipped.");
    if (process.env.NODE_ENV !== "production") {
      console.info(`[auth] Reset link for ${options.to}: ${options.resetUrl}`);
    }
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
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[auth] Resend failed:", response.status, detail.slice(0, 300));
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("[auth] Resend error:", err);
    return "failed";
  }
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
