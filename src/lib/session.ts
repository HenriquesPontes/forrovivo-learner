import { cookies } from "next/headers";
import { GUEST_COOKIE, SESSION_COOKIE } from "@/lib/auth";

export type LearnerAccess =
  | { kind: "account"; token: string }
  | { kind: "guest" }
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

/** Account session wins over guest. */
export async function readLearnerAccess(): Promise<LearnerAccess> {
  const token = await readSessionToken();
  if (token) return { kind: "account", token };
  if (await readGuestSession()) return { kind: "guest" };
  return { kind: null };
}

/** Guests may study Academy unit 1 only (matches native guest unlock). */
export const GUEST_MAX_UNIT = 1;
