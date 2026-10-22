import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { passwordAuth, verifyEmail } from "@/lib/password-routes";
const origin = "https://learn.example.test";
const payload = { email: "mailbox@example.test", password: "chosen-password", displayName: "Mailbox" };
const verificationToken = `fv_verify_${"a".repeat(48)}`;
const request = (body: unknown) => new Request(`${origin}/api/auth/register`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => { vi.stubEnv("LEARNER_WEB_SERVICE_KEY", "test-service-key"); vi.stubEnv("RESEND_API_KEY", "test-mail-key"); vi.stubEnv("LEARN_ORIGIN", origin); vi.stubEnv("API_ORIGIN", "https://api.example.test"); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("requires delivery configuration before issuing a registration challenge", async () => {
  vi.stubEnv("RESEND_API_KEY", ""); const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  expect((await passwordAuth(request(payload), "register")).status).toBe(503);
  expect(fetcher).not.toHaveBeenCalled();
});
it("delivers a fragment link, hides the challenge and returns pending without a session", async () => {
  const fetcher = vi.fn(async (url: string, options: RequestInit) => {
    if (url.startsWith("https://api.example.test")) {
      expect(options.headers).toMatchObject({ "X-ForroVivo-Service-Key": "test-service-key" });
      return Response.json({ status: "ok", pending: true, verificationToken, email: payload.email });
    }
    const email = JSON.parse(options.body as string);
    expect(email.text).toContain(`${origin}/verify-email#token=${verificationToken}`);
    expect(email.text).not.toContain(payload.password);
    return Response.json({ id: "test-message" });
  }); vi.stubGlobal("fetch", fetcher);
  const response = await passwordAuth(request(payload), "register");
  expect(response.status).toBe(200); expect(fetcher).toHaveBeenCalledTimes(2);
  expect(response.headers.get("set-cookie")).toBeNull();
  const body = await response.json(); expect(body.pending).toBe(true); expect(JSON.stringify(body)).not.toContain(verificationToken);
});
it("rejects old immediate-session backends and malformed challenges", async () => {
  for (const data of [{ status: "ok", token: "legacy" }, { status: "ok", pending: true, verificationToken, email: "other@example.test" }]) {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(data)));
    const response = await passwordAuth(request(payload), "register");
    expect(response.status).toBe(502); expect(response.headers.get("set-cookie")).toBeNull();
  }
});
it("surfaces mail-provider failure without creating a browser session", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json({ status: "ok", pending: true, verificationToken, email: payload.email })).mockResolvedValueOnce(Response.json({}, { status: 503 })));
  const response = await passwordAuth(request(payload), "register");
  expect(response.status).toBe(503); expect(response.headers.get("set-cookie")).toBeNull();
});
it("consumes verification by POST without automatically signing in", async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ status: "ok" })); vi.stubGlobal("fetch", fetcher);
  const response = await verifyEmail(request({ token: verificationToken, password: payload.password }));
  expect(response.status).toBe(200); expect(response.headers.get("set-cookie")).toBeNull();
  expect(fetcher.mock.calls[0][0]).toBe("https://api.example.test/app/v1/auth/verify-email");
});
