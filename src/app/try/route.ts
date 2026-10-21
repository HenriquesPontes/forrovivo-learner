import { NextResponse } from "next/server";
import { GUEST_COOKIE } from "@/lib/auth";

/** Old guest entry. Learning now requires a signed-in account. */
export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(GUEST_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
