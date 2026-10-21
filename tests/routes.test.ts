import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
const state = vi.hoisted(() => ({ jar: new Map<string, string>() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (key: string) => state.jar.has(key) ? { value: state.jar.get(key) } : undefined }) }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as reset } from "@/app/api/auth/reset-password/route";
import { POST as forgot } from "@/app/api/auth/forgot-password/route";
import { POST as oauth } from "@/app/api/auth/oauth/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as clearInvalid } from "@/app/api/auth/clear-invalid/route";
import { DELETE as deleteAccount, PATCH as patchAccount } from "@/app/api/account/route";
import { GET as exportAccount } from "@/app/api/account/export/route";
import { readLearnerAccess } from "@/lib/session";
import { authResponse, OAUTH_COOKIE, readSessionContext, SCOPE_COOKIE, SESSION_COOKIE, storageScope } from "@/lib/auth";

const origin = "https://learn.example.test";
const token = `fv_learn_${"a".repeat(48)}`;
const account = { provider: "email", email: "learner@example.test", displayName: "Learner", appLanguage: "en", studyLanguage: "forro", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };
const success = () => ({ status: "ok", token, accountKey: "email:learner@example.test", provider: "email", expiresAt: new Date(Date.now() + 60_000).toISOString() });
let requestScope = "";
const request = (body: unknown, headers: Record<string, string> = {}) => new Request(`${origin}/api/auth/login`, {
  method: "POST", headers: { Origin: origin, "Content-Type": "application/json", ...headers },
  body: JSON.stringify(body && typeof body === "object" && !Array.isArray(body) ? { scope: requestScope, ...body } : body),
});
let fetcher: Mock<typeof fetch>;
beforeEach(async () => {
  state.jar.clear();
  vi.stubEnv("API_ORIGIN", "https://api.example.test");
  vi.stubEnv("LEARN_ORIGIN", origin);
  vi.stubEnv("LEARNER_WEB_SERVICE_KEY", "test-only-service-key");
  vi.stubEnv("RESEND_API_KEY", "test-only-mail-key");
  vi.stubEnv("NEXT_PUBLIC_APPLE_WEB_CLIENT_ID", "");
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID", "");
  fetcher = vi.fn(async () => { throw new Error("Unexpected external request in test"); });
  vi.stubGlobal("fetch", fetcher);
  requestScope = await storageScope(token);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("browser auth boundary", () => {
  it("rejects null, arrays, malformed, oversized and cross-origin requests before any upstream call", async () => {
    for (const body of [null, [], "text"]) expect((await login(request(body))).status).toBe(400);
    expect((await login(request({ email: "x" }, { Origin: "https://other.example.test" }))).status).toBe(403);
    expect((await login(request({ email: "x" }, { "Content-Type": "text/plain" }))).status).toBe(415);
    expect((await login(request({ value: "é".repeat(7000) }))).status).toBe(413);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("sets a validated HttpOnly session and binds signed context to the actual token", async () => {
    fetcher.mockResolvedValue(Response.json(success()));
    const response = await login(request({ email: account.email, password: "test-password" }));
    expect(response.status).toBe(200);
    expect(response.cookies.get(SESSION_COOKIE)?.value).toBe(token);
    const context = response.cookies.get(SCOPE_COOKIE)?.value;
    expect(await readSessionContext(context, token)).toMatchObject({ scope: await storageScope("email:learner@example.test") });
    expect(await readSessionContext(context, `${token.slice(0, -1)}b`)).toBeNull();
    expect(await readSessionContext(context?.replace(/^./, "f"), token)).toBeNull();
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).not.toHaveProperty("token");
  });
  it("rejects malformed successful upstream sessions and preserves lockout/outage statuses", async () => {
    for (const patch of [{ expiresAt: "bad" }, { expiresAt: "2001-01-01T00:00:00Z" }, { token: "invalid" }]) {
      fetcher.mockResolvedValue(Response.json({ ...success(), ...patch }));
      const response = await login(request({ email: account.email, password: "test-password" }));
      expect(response.status).toBe(502);
      expect(response.cookies.get(SESSION_COOKIE)).toBeUndefined();
    }
    fetcher.mockResolvedValue(Response.json({ status: "error", code: "AUTH_LOCKED" }, { status: 429 }));
    expect((await login(request({ email: account.email, password: "test-password" }))).status).toBe(429);
    fetcher.mockResolvedValue(Response.json({ status: "error" }, { status: 503 }));
    expect((await login(request({ email: account.email, password: "test-password" }))).status).toBe(503);
  });
  it("does not promise a registration email when the backend only reports pending", async () => {
    fetcher.mockResolvedValue(Response.json({ status: "ok", pending: true }));
    const response = await register(request({ email: account.email, password: "test-password" }));
    expect(response.cookies.get(SESSION_COOKIE)).toBeUndefined();
    expect((await response.json()).message).not.toContain("we sent");
  });
  it("does not accept arbitrary, revoked or banned cookie values and clears only invalid sessions", async () => {
    state.jar.set(SESSION_COOKIE, "arbitrary");
    await expect(readLearnerAccess()).rejects.toThrow("REDIRECT:/api/auth/clear-invalid");
    expect(fetcher).not.toHaveBeenCalled();
    for (const status of [401, 403]) {
      state.jar.set(SESSION_COOKIE, token);
      fetcher.mockImplementation(async () => Response.json({ status: "error" }, { status }));
      await expect(readLearnerAccess()).rejects.toThrow("REDIRECT:/api/auth/clear-invalid");
      const response = await clearInvalid(new Request(`${origin}/api/auth/clear-invalid`));
      expect(response.cookies.get(SESSION_COOKIE)?.value).toBe("");
    }
    fetcher.mockImplementation(async () => Response.json({ status: "error" }, { status: 503 }));
    const unavailable = await clearInvalid(new Request(`${origin}/api/auth/clear-invalid`));
    expect(unavailable.status).toBe(503);
    expect(unavailable.cookies.get(SESSION_COOKIE)).toBeUndefined();
    fetcher.mockResolvedValue(Response.json({ status: "ok", account }));
    state.jar.set(SCOPE_COOKIE, (await authResponse(success())).cookies.get(SCOPE_COOKIE)!.value);
    expect((await readLearnerAccess()).kind).toBe("account");
  });
  it("requires the web signer before creating a new upstream session and upgrades legacy web sessions", async () => {
    vi.stubEnv("LEARNER_WEB_SERVICE_KEY", "");
    expect((await login(request({ email: account.email, password: "test-password" }))).status).toBe(503);
    expect(fetcher).not.toHaveBeenCalled();
    vi.stubEnv("LEARNER_WEB_SERVICE_KEY", "test-only-service-key");
    state.jar.set(SESSION_COOKIE, token);
    fetcher.mockImplementation(async () => Response.json({ status: "ok", account }));
    await expect(readLearnerAccess()).rejects.toThrow("REDIRECT:/reauthenticate");
  });
  it("requires same-origin logout and clears account, context and guest cookies", async () => {
    expect((await logout(request({}, { Origin: "https://other.example.test" }))).status).toBe(403);
    const response = await logout(request({}));
    expect(response.cookies.get(SESSION_COOKIE)?.value).toBe("");
    expect(response.cookies.get(SCOPE_COOKIE)?.value).toBe("");
  });
});

describe("recovery delivery", () => {
  it("does not replace tokens if either required sending credential is missing", async () => {
    for (const key of ["RESEND_API_KEY", "LEARNER_WEB_SERVICE_KEY"]) {
      vi.stubEnv(key, "");
      expect((await forgot(request({ email: account.email }))).status).toBe(503);
      vi.stubEnv(key, "test-key");
    }
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("keeps unknown-address responses generic without sending, but reports actual delivery failures", async () => {
    fetcher.mockResolvedValue(Response.json({ status: "ok" }));
    expect((await forgot(request({ email: account.email }))).status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const resetToken = `fv_reset_${"b".repeat(48)}`;
    fetcher.mockResolvedValueOnce(Response.json({ status: "ok", resetToken, email: account.email }));
    fetcher.mockResolvedValueOnce(Response.json({ error: "fixture provider failure" }, { status: 503 }));
    expect((await forgot(request({ email: account.email }))).status).toBe(503);
    expect(fetcher.mock.calls.at(-1)?.[0]).toBe("https://api.resend.com/emails");
  });
  it("builds the canonical reset origin and never returns a reset token to the browser", async () => {
    const resetToken = `fv_reset_${"b".repeat(48)}`;
    fetcher.mockResolvedValueOnce(Response.json({ status: "ok", resetToken, email: account.email }));
    fetcher.mockResolvedValueOnce(Response.json({ id: "test-only" }));
    const response = await forgot(request({ email: account.email }));
    expect(response.status).toBe(200);
    expect(JSON.parse(String(fetcher.mock.calls.at(-1)?.[1]?.body)).text).toContain(`${origin}/reset-password?token=${resetToken}`);
    expect(await response.text()).not.toContain(resetToken);
    expect((await reset(request({ token: "invalid", password: "test-password" }))).status).toBe(400);
  });
});

describe("web OAuth nonce and existing-profile safety", () => {
  const nonce = "c".repeat(64);
  function jwt(claims: Record<string, unknown>) { return `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`; }
  function configure() {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID", "fixture-web-client");
    state.jar.set(OAUTH_COOKIE, `${nonce}.${Date.now()}`);
  }
  it("refuses missing/mismatched/expired nonce and wrong audience before creating any session", async () => {
    configure();
    for (const claims of [{ nonce: "wrong", aud: "fixture-web-client" }, { nonce, aud: "native-client" }]) {
      expect((await oauth(request({ idToken: jwt({ iss: "https://accounts.google.com", ...claims }) }))).status).toBe(401);
    }
    state.jar.set(OAUTH_COOKIE, `${nonce}.${Date.now() - 700_000}`);
    expect((await oauth(request({ idToken: jwt({ iss: "https://accounts.google.com", nonce, aud: "fixture-web-client" }) }))).status).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("requires Worker token verification and retains an existing native profile", async () => {
    configure();
    fetcher.mockResolvedValueOnce(Response.json({ ...success(), provider: "google", accountKey: "google:fixture-user" }));
    fetcher.mockResolvedValueOnce(Response.json({ status: "ok", account: { ...account, provider: "google", studyLanguage: "lungie" } }));
    const response = await oauth(request({ idToken: jwt({ iss: "https://accounts.google.com", nonce, aud: "fixture-web-client", name: "Different" }) }));
    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.some(call => call[1]?.method === "PUT")).toBe(false);
    expect(response.cookies.get(OAUTH_COOKIE)?.value).toBe("");
  });
  it("never treats a provider error or malformed response as successful sign-in", async () => {
    configure();
    fetcher.mockResolvedValue(Response.json({ status: "error", code: "LEARNER_AUTH_INVALID" }, { status: 401 }));
    const response = await oauth(request({ idToken: jwt({ iss: "https://accounts.google.com", nonce, aud: "fixture-web-client" }) }));
    expect(response.status).toBe(401);
    expect(response.cookies.get(SESSION_COOKIE)).toBeUndefined();
  });
  it("accepts a verified Apple web audience and preserves its existing native profile", async () => {
    vi.stubEnv("NEXT_PUBLIC_APPLE_WEB_CLIENT_ID", "com.example.fixture.web");
    state.jar.set(OAUTH_COOKIE, `${nonce}.${Date.now()}`);
    const appleClaims = { iss: "https://appleid.apple.com", nonce, aud: "com.example.fixture.web" };
    fetcher.mockResolvedValueOnce(Response.json({ ...success(), provider: "apple", accountKey: "apple:fixture-user" }));
    fetcher.mockResolvedValueOnce(Response.json({ status: "ok", account: { ...account, provider: "apple", studyLanguage: "lungie" } }));
    const response = await oauth(request({ idToken: jwt(appleClaims) }));
    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.some(call => call[1]?.method === "PUT")).toBe(false);
    expect(response.cookies.get(SESSION_COOKIE)?.value).toBe(token);
    fetcher.mockClear();
    expect((await oauth(request({ idToken: jwt({ ...appleClaims, aud: "com.forrovivo.app" }) }))).status).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("account lifecycle", () => {
  async function signIn(provider = "email", key = "email:learner@example.test") {
    const response = await authResponse({ ...success(), provider, accountKey: key });
    state.jar.set(SESSION_COOKIE, token);
    state.jar.set(SCOPE_COOKIE, response.cookies.get(SCOPE_COOKIE)!.value);
    requestScope = (await readSessionContext(state.jar.get(SCOPE_COOKIE), token))!.scope;
  }
  it("profile edits retain the server's email and language namespace", async () => {
    await signIn();
    fetcher.mockResolvedValueOnce(Response.json({ status: "ok", account: { ...account, studyLanguage: "lungie" } }));
    fetcher.mockResolvedValueOnce(Response.json({ status: "ok", account }));
    const response = await patchAccount(request({ displayName: "New name", appLanguage: "pt", email: "attacker@example.test", studyLanguage: "forro" }));
    expect(response.status).toBe(200);
    expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body))).toMatchObject({ email: account.email, studyLanguage: "lungie" });
  });
  it("requires confirmation and password reauthentication before erasing an email account", async () => {
    await signIn();
    fetcher.mockImplementation(async () => Response.json({ status: "ok", account }));
    expect((await deleteAccount(request({ confirmation: "no" }))).status).toBe(400);
    expect((await deleteAccount(request({ confirmation: "DELETE" }))).status).toBe(400);
    expect(fetcher.mock.calls.some(call => call[1]?.method === "DELETE")).toBe(false);
    fetcher.mockReset();
    fetcher.mockResolvedValueOnce(Response.json({ status: "ok", account }));
    fetcher.mockResolvedValueOnce(Response.json(success()));
    fetcher.mockResolvedValueOnce(Response.json({ status: "ok", deleted: true }));
    const response = await deleteAccount(request({ confirmation: "DELETE", password: "test-password" }));
    expect(response.status).toBe(200);
    expect(fetcher.mock.calls[2][1]?.method).toBe("DELETE");
    expect(response.cookies.get(SESSION_COOKIE)?.value).toBe("");
  });
  it("cannot use a mutable contact address to delete a different password account", async () => {
    await signIn();
    fetcher.mockResolvedValueOnce(Response.json({ status: "ok", account: { ...account, email: "different@example.test" } }));
    fetcher.mockResolvedValueOnce(Response.json({ ...success(), accountKey: "email:different@example.test" }));
    expect((await deleteAccount(request({ confirmation: "DELETE", password: "test-password" }))).status).toBe(401);
    expect(fetcher.mock.calls.some(call => call[1]?.method === "DELETE")).toBe(false);
  });
  it("requires signed recent authentication for social deletion and does not clear cookies on failed erase", async () => {
    state.jar.set(SESSION_COOKIE, token);
    fetcher.mockImplementation(async () => Response.json({ status: "ok", account: { ...account, provider: "google" } }));
    expect((await deleteAccount(request({ confirmation: "DELETE" }))).status).toBe(409);
    expect(fetcher.mock.calls.some(call => call[1]?.method === "DELETE")).toBe(false);
    await signIn("google", "google:fixture-user");
    fetcher.mockReset();
    fetcher.mockResolvedValueOnce(Response.json({ status: "ok", account: { ...account, provider: "google" } }));
    fetcher.mockResolvedValueOnce(Response.json({ status: "error" }, { status: 503 }));
    const response = await deleteAccount(request({ confirmation: "DELETE" }));
    expect(response.status).toBe(503);
    expect(response.cookies.get(SESSION_COOKIE)).toBeUndefined();
  });
  it("exports only the authenticated account and learning snapshots, with private caching", async () => {
    await signIn();
    fetcher.mockImplementation(async input => String(input).endsWith("/account") ? Response.json({ status: "ok", account }) :
      Response.json({ status: "error", code: "PROGRESS_NOT_FOUND" }, { status: 404 }));
    const response = await exportAccount(new Request(`${origin}/api/account/export?scope=${requestScope}`));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain("attachment;");
    expect(response.headers.get("cache-control")).toBe("no-store");
    const data = await response.text();
    expect(data).not.toContain(token);
    expect(data).not.toContain("test-password");
    expect(Object.keys(JSON.parse(data).progress)).toHaveLength(6);
  });
  it("rejects stale-page edits, deletion and export after an account switch", async () => {
    await signIn();
    fetcher.mockImplementation(async () => Response.json({ status: "ok", account }));
    const oldScope = "d".repeat(64);
    expect((await patchAccount(request({ scope: oldScope, displayName: "Wrong account", appLanguage: "en" }))).status).toBe(409);
    expect((await deleteAccount(request({ scope: oldScope, confirmation: "DELETE", password: "test-password" }))).status).toBe(409);
    expect((await exportAccount(new Request(`${origin}/api/account/export?scope=${oldScope}`))).status).toBe(409);
    expect(fetcher.mock.calls.some(call => ["PUT", "DELETE", "POST"].includes(call[1]?.method ?? ""))).toBe(false);
  });
});
