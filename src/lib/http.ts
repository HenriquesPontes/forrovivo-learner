import { NextResponse } from "next/server";

export class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: {
    "Cache-Control": "no-store", "Referrer-Policy": "no-referrer",
  } });
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new RequestError(403, "Reload this page and try again.");
  }
}

/** Bound the actual UTF-8 body, including requests without Content-Length. */
export async function readJson(request: Request, maxBytes = 12_288): Promise<Record<string, unknown>> {
  sameOrigin(request);
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new RequestError(415, "Request body must be JSON.");
  }
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) {
    throw new RequestError(413, "Request body is too large.");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, "Request body must be a JSON object.");
  const decoder = new TextDecoder();
  let text = "", bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new RequestError(413, "Request body is too large.");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const body: unknown = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("object required");
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError(400, "Request body must be a JSON object.");
  } finally { reader.releaseLock(); }
}

export function routeError(error: unknown) {
  if (error instanceof RequestError) return json({ status: "error", message: error.message }, error.status);
  return json({ status: "error", message: "The service is unavailable. Please try again." }, 503);
}
