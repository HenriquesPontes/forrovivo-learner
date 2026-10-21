import { cookies } from "next/headers";
import { authResponse, OAUTH_COOKIE, clearCookieOptions, requireWebSessionConfiguration } from "@/lib/auth";
import { backend, bearer, BackendError, isAccount } from "@/lib/backend";
import { readJson, RequestError, routeError } from "@/lib/http";

export function jwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const value: unknown = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}

export async function oauth(request: Request) {
  let consume = false;
  try {
    const body = await readJson(request);
    requireWebSessionConfiguration();
    consume = true;
    const token = typeof body.idToken === "string" ? body.idToken : "";
    const claims = token.length <= 8192 ? jwtClaims(token) : null;
    const challenge = (await cookies()).get(OAUTH_COOKIE)?.value?.split(".");
    if (!claims || !challenge || challenge.length !== 2 || !/^[a-f0-9]{64}$/.test(challenge[0]) ||
      !/^\d{13}$/.test(challenge[1]) || Date.now() - Number(challenge[1]) > 600_000 ||
      Number(challenge[1]) > Date.now() || claims.nonce !== challenge[0]) {
      throw new RequestError(401, "Sign-in expired. Reload the page and try again.");
    }
    const provider = claims.iss === "https://appleid.apple.com" ? "apple" :
      ["accounts.google.com", "https://accounts.google.com"].includes(String(claims.iss)) ? "google" : null;
    const clientId = provider === "apple" ? process.env.NEXT_PUBLIC_APPLE_WEB_CLIENT_ID?.trim() :
      provider === "google" ? process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() : "";
    if (!clientId || claims.aud !== clientId) throw new RequestError(401, "This sign-in provider is not configured for the website.");
    // Only the Worker establishes identity; decoded claims above are nonce/audience hints.
    const session = await backend("/app/v1/session", { method: "POST",
      headers: { ...bearer(token), "Content-Type": "application/json" }, body: "{}" });
    if (session.provider !== provider || typeof session.token !== "string") throw new RequestError(502, "Could not verify the sign-in response.");
    try {
      const profile = await backend("/app/v1/account", { headers: bearer(session.token) });
      if (!isAccount(profile.account)) throw new RequestError(502, "Could not load the account profile.");
    }
    catch (error) {
      if (!(error instanceof BackendError) || error.status !== 404 || error.code !== "ACCOUNT_NOT_FOUND") throw error;
      // Create a missing profile only; never replace existing native name/language settings.
      const emailVerified = claims.email_verified === true || claims.email_verified === "true";
      const profile = await backend("/app/v1/account", { method: "PUT", headers: { ...bearer(session.token), "Content-Type": "application/json" },
        body: JSON.stringify({ schemaVersion: 1, displayName: typeof claims.name === "string" && claims.name.trim() ? claims.name.trim().slice(0, 120) : "Learner",
          ...(emailVerified && typeof claims.email === "string" ? { email: claims.email } : {}),
          appLanguage: "en", studyLanguage: "forro", updatedAt: new Date().toISOString() }) });
      if (!isAccount(profile.account)) throw new RequestError(502, "Could not create the account profile.");
    }
    const response = await authResponse(session);
    response.cookies.set(OAUTH_COOKIE, "", clearCookieOptions);
    return response;
  } catch (error) {
    const response = routeError(error);
    if (consume) response.cookies.set(OAUTH_COOKIE, "", clearCookieOptions);
    return response;
  }
}
