import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GUEST_COOKIE, SESSION_COOKIE, SCOPE_COOKIE, storageScope, readSessionContext } from "@/lib/auth";
import { accountForToken, BackendError, type Account } from "@/lib/backend";
import { RequestError } from "@/lib/http";
export { GUEST_MAX_UNIT } from "@/lib/validation";

export type LearnerAccess =
  | { kind: "account"; token: string; scope: string; account: Account }
  | { kind: "guest"; scope: "guest" }
  | { kind: null };

export async function readSessionToken(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(SESSION_COOKIE)?.value?.trim();
  return value || null;
}

export async function readGuestSession(): Promise<boolean> {
  const jar = await cookies();
  const value = jar.get(GUEST_COOKIE)?.value?.trim();
  return value === "1";
}

export async function requireAccount({ allowLegacy = false }: { allowLegacy?: boolean } = {}) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value?.trim();
  if (!token) throw new BackendError(401, "LEARNER_AUTH_INVALID");
  const account = await accountForToken(token);
  const context = await readSessionContext(jar.get(SCOPE_COOKIE)?.value, token);
  if (!context && !allowLegacy) throw new RequestError(409, "Please sign in again to continue safely.");
  return { token, account, scope: context?.scope ?? await storageScope(token), context };
}

/** Per-render memoization only; no cross-user or persistent session cache. */
export const readLearnerAccess = cache(async (): Promise<LearnerAccess> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value?.trim();
  if (token) {
    let account: Account;
    try { account = await accountForToken(token); }
    catch (error) {
      if (error instanceof BackendError && [401, 403, 404].includes(error.status)) redirect("/api/auth/clear-invalid");
      throw error;
    }
    const savedContext = await readSessionContext(jar.get(SCOPE_COOKIE)?.value, token);
    // Older web sessions have no verified stable cache identity. Upgrade before
    // recording lessons so pending work remains recoverable after signing out.
    if (!savedContext) redirect("/reauthenticate");
    return { kind: "account", token, account,
      scope: savedContext.scope };
  }
  if (jar.get(GUEST_COOKIE)?.value === "1") return { kind: "guest", scope: "guest" };
  return { kind: null };
});
