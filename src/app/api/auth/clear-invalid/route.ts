import { NextResponse } from "next/server";
import { readSessionToken } from "@/lib/session";
import { accountForToken, BackendError } from "@/lib/backend";
import { clearSessionCookies } from "@/lib/auth";
import { routeError } from "@/lib/http";

export async function GET(request: Request) {
  const token = await readSessionToken();
  if (token) {
    try {
      await accountForToken(token);
      return NextResponse.redirect(new URL("/home", request.url));
    } catch (error) {
      if (!(error instanceof BackendError) || ![401, 403, 404].includes(error.status)) return routeError(error);
    }
  }
  const response = NextResponse.redirect(new URL("/", request.url));
  response.headers.set("Cache-Control", "no-store");
  return clearSessionCookies(response);
}
