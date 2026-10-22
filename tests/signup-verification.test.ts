import { afterEach, expect, it, vi } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as forgot } from "@/app/api/auth/forgot-password/route";
import { POST as reset } from "@/app/api/auth/reset-password/route";
import { POST as verify } from "@/app/api/auth/verify-email/route";

afterEach(() => vi.unstubAllGlobals());
it.each([login, register, forgot, reset, verify])("retired password endpoints return 410 without reading credentials, sending mail or changing sessions", async handler => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  const request = new Request("https://learn.example.test/api/auth/login", { method: "POST", body: "malformed credentials" });
  const response = await handler(request);
  expect(response.status).toBe(410);
  expect(await response.json()).toMatchObject({ status: "error", message: expect.stringContaining("Apple or Google") });
  expect(response.headers.get("set-cookie")).toBeNull();
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(request.bodyUsed).toBe(false);
  expect(fetcher).not.toHaveBeenCalled();
});
