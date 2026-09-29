import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";

export async function readSessionToken(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(SESSION_COOKIE)?.value?.trim();
  return value || null;
}
