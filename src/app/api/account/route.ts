import { AUTH_LOCALE_COOKIE } from "@/lib/auth-copy";
import { requireAccount } from "@/lib/session";
import { backend, bearer, isAccount } from "@/lib/backend";
import { clearSessionCookies, storageScope } from "@/lib/auth";
import { json, readJson, RequestError, routeError } from "@/lib/http";
import { validatePassword } from "@/lib/validation";

export async function PATCH(request: Request) {
  try {
    const body = await readJson(request);
    const { token, account, scope } = await requireAccount();
    if (body.scope !== scope) throw new RequestError(409, "Your account changed. Reload this page before saving.");
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    if (!displayName || displayName.length > 120 || /[\u0000-\u001f\u007f]/.test(displayName) || !["en", "pt"].includes(String(body.appLanguage))) {
      throw new RequestError(400, "Enter a name and choose an interface language.");
    }
    const result = await backend("/app/v1/account", { method: "PUT", headers: { ...bearer(token), "Content-Type": "application/json" },
      body: JSON.stringify({ schemaVersion: 1, displayName, appLanguage: body.appLanguage,
        email: account.email, studyLanguage: account.studyLanguage, updatedAt: new Date().toISOString() }) });
    if (!isAccount(result.account)) throw new RequestError(502, "Could not confirm the updated profile.");
    const response = json({ status: "ok", appLanguage: result.account.appLanguage });
    response.cookies.set(AUTH_LOCALE_COOKIE, result.account.appLanguage, { path: "/", maxAge: 31536000, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    return response;
  } catch (error) { return routeError(error); }
}

export async function DELETE(request: Request) {
  try {
    const body = await readJson(request);
    const { token, account, context, scope } = await requireAccount();
    if (body.scope !== scope) throw new RequestError(409, "Your account changed. Reload this page before deleting.");
    if (body.confirmation !== "DELETE") throw new RequestError(400, "Type DELETE to confirm account deletion.");
    if (!context) throw new RequestError(409, "Sign in again before deleting your account.");
    let authorizedToken = token;
    if (account.provider === "email") {
      const password = typeof body.password === "string" ? validatePassword(body.password) : null;
      if (!password || !account.email) throw new RequestError(400, "Enter your password to delete this account.");
      const proof = await backend("/app/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: account.email, password }) });
      if (proof.accountKey !== `email:${account.email.toLowerCase()}` || await storageScope(String(proof.accountKey)) !== context.scope || typeof proof.token !== "string" ||
        !/^fv_learn_[a-f0-9]{48}$/.test(proof.token)) throw new RequestError(401, "Could not confirm your account. Sign in again.");
      authorizedToken = proof.token;
    } else if (Date.now() - context.authenticatedAt > 300_000) {
      throw new RequestError(409, "Sign in again before deleting your account.");
    }
    const result = await backend("/app/v1/account", { method: "DELETE", headers: bearer(authorizedToken) });
    if (result.deleted !== true) throw new RequestError(502, "The service did not confirm account deletion.");
    return clearSessionCookies(json({ status: "ok", deleted: true }), true);
  } catch (error) { return routeError(error); }
}
