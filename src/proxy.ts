import { NextRequest, NextResponse } from "next/server";
import { learnerPageCsp, LEARNER_API_CSP } from "@/lib/csp";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = request.nextUrl.pathname.startsWith("/api/") ? LEARNER_API_CSP : learnerPageCsp(nonce);
  const headers = new Headers(request.headers);
  // Never allow a caller's CSP/nonce header to become our trusted script nonce.
  headers.delete("content-security-policy");
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:png|jpg|webp|svg|woff2?)$).*)"] };
