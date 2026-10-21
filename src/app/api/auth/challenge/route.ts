import { OAUTH_COOKIE } from "@/lib/auth";
import { json, routeError, RequestError } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") {
      throw new RequestError(403, "Reload this page and try again.");
    }
    const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex");
    const response = json({ status: "ok", nonce });
    response.cookies.set(OAUTH_COOKIE, `${nonce}.${Date.now()}`, { httpOnly: true,
      secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
    return response;
  } catch (error) { return routeError(error); }
}
