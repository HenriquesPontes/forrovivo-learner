import { clearSessionCookies } from "@/lib/auth";
import { json, sameOrigin, routeError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    return clearSessionCookies(json({ status: "ok" }), true);
  } catch (error) { return routeError(error); }
}
