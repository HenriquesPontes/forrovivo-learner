import { NextResponse } from "next/server";
import { GUEST_COOKIE, guestCookieOptions } from "@/lib/auth";

/** Enter Academy as guest (unit 1 only). Used by “Try lessons”. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const dest = new URL("/home", url.origin);
  const response = NextResponse.redirect(dest);
  response.cookies.set(GUEST_COOKIE, "1", guestCookieOptions());
  return response;
}
