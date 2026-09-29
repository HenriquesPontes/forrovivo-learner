import { NextResponse } from "next/server";
import { GUEST_COOKIE, SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ status: "ok" });
  const clear = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
  response.cookies.set(SESSION_COOKIE, "", clear);
  response.cookies.set(GUEST_COOKIE, "", clear);
  return response;
}
