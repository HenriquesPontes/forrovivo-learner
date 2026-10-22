import { cookies } from "next/headers";
import { clearSessionCookies, SESSION_COOKIE } from "@/lib/auth";
import { backend, bearer } from "@/lib/backend";
import { json, sameOrigin, routeError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token && /^fv_learn_[a-f0-9]{48}$/.test(token)) {
      // Preserve cookies on an upstream outage so the user can retry revocation.
      await backend("/app/v1/session", { method: "DELETE", headers: bearer(token) });
    }
    return clearSessionCookies(json({ status: "ok" }), true);
  } catch (error) { return routeError(error); }
}
