import { apiOrigin } from "@/lib/auth";
import { RequestError } from "@/lib/http";

export class BackendError extends RequestError {
  constructor(status: number, public code: string) {
    super(status, status === 401 ? "Please sign in again." : status === 403 ? "This account is unavailable." :
      status === 429 ? "Too many requests. Please wait and try again." :
      status === 409 ? "Progress changed. Please try saving again." :
      "The account service is unavailable. Please try again.");
  }
}

export async function backend(path: string, options: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(`${apiOrigin()}${path}`, { ...options, redirect: "error", cache: "no-store",
      signal: AbortSignal.timeout(10_000), headers: { Accept: "application/json", ...options.headers } });
  } catch { throw new BackendError(503, "UPSTREAM_UNAVAILABLE"); }
  let data: Record<string, unknown>;
  try {
    const value: unknown = await response.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("object required");
    data = value as Record<string, unknown>;
  } catch { throw new BackendError(502, "UPSTREAM_INVALID"); }
  if (!response.ok || data.status !== "ok") {
    const status = [400, 401, 403, 404, 409, 413, 429].includes(response.status) ? response.status : 503;
    throw new BackendError(status, typeof data.code === "string" ? data.code : "UPSTREAM_INVALID");
  }
  return data;
}

export function bearer(token: string) { return { Authorization: `Bearer ${token}` }; }

export type Account = {
  provider: "email" | "apple" | "google";
  email: string | null;
  displayName: string;
  appLanguage: string;
  studyLanguage: string;
  createdAt: string;
  updatedAt: string;
};

export function isAccount(value: unknown): value is Account {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return ["email", "apple", "google"].includes(String(row.provider)) && typeof row.displayName === "string" &&
    (row.email === null || typeof row.email === "string") && typeof row.studyLanguage === "string" &&
    ["pt", "en"].includes(String(row.appLanguage)) && typeof row.createdAt === "string" && typeof row.updatedAt === "string";
}

export async function accountForToken(token: string): Promise<Account> {
  if (!/^fv_learn_[a-f0-9]{48}$/.test(token)) throw new BackendError(401, "LEARNER_AUTH_INVALID");
  const data = await backend("/app/v1/account", { headers: bearer(token) });
  if (!isAccount(data.account)) throw new BackendError(502, "UPSTREAM_INVALID");
  return data.account;
}
