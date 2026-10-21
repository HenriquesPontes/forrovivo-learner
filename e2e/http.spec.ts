import { test, expect, type APIRequestContext, type APIResponse } from "@playwright/test";

// Test-only cookie forwarding on loopback. Cookie attributes are asserted;
// actual browser transport and storage are separate WebKit/Safari checks.
const jars = new WeakMap<APIRequestContext, Map<string, string>>();
const origin = "https://localhost:4318";
function jar(context: APIRequestContext) {
  let value = jars.get(context);
  if (!value) { value = new Map(); jars.set(context, value); }
  return value;
}
function scope(context: APIRequestContext) { return jar(context).get("fv_learner_context")?.split(".")[0] ?? ""; }
function remember(context: APIRequestContext, response: APIResponse) {
  for (const header of response.headersArray().filter(header => header.name.toLowerCase() === "set-cookie")) {
    const [cookie] = header.value.split(";");
    const separator = cookie.indexOf("=");
    const name = cookie.slice(0, separator), value = cookie.slice(separator + 1);
    if (!value || /max-age=0(?:;|$)/i.test(header.value)) jar(context).delete(name);
    else jar(context).set(name, value);
  }
}
async function call(context: APIRequestContext, method: string, path: string, data?: Record<string, unknown>, headers: Record<string, string> = {}) {
  const response = await context.fetch(`${origin}${path}`, { method, maxRedirects: 0,
    headers: { Cookie: [...jar(context)].map(([name, value]) => `${name}=${value}`).join("; "),
      Origin: origin, "X-ForroVivo-Web-Scope": scope(context), ...headers },
    ...(data ? { data: { scope: scope(context), ...data } } : {}) });
  remember(context, response);
  return response;
}
async function register(context: APIRequestContext, email = "http-first@example.test") {
  const response = await call(context, "POST", "/api/auth/register", { email, password: "fixture-password", displayName: "HTTP fixture learner" });
  expect(response.status(), await response.text()).toBe(200);
  expect(response.headersArray().some(header => /set-cookie/i.test(header.name) && /HttpOnly/.test(header.value) && /Secure/.test(header.value))).toBe(true);
  expect(scope(context)).toMatch(/^[a-f0-9]{64}$/);
}
const result = (level = 1) => ({ unit: 1, level, score: 80, completedAt: new Date().toISOString() });

test.beforeEach(async ({ request }) => { await request.post("http://127.0.0.1:4319/_test/reset"); });

test("HTTP: invalid-cookie access clears safely; recovery remains reachable with stale cookies", async ({ request }) => {
  jar(request).set("fv_learner_session", "arbitrary");
  const restricted = await call(request, "GET", "/home");
  expect(restricted.status()).toBe(307);
  expect(restricted.headers().location).toContain("/api/auth/clear-invalid");
  const clear = await call(request, "GET", "/api/auth/clear-invalid");
  expect(clear.status()).toBe(307);
  expect(jar(request).has("fv_learner_session")).toBe(false);
  const loginPage = await call(request, "GET", "/");
  expect(loginPage.status()).toBe(200);
  expect(loginPage.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(loginPage.headers()["cross-origin-opener-policy"]).toBe("same-origin-allow-popups");
  const portuguese = await call(request, "GET", "/", undefined, { Cookie: "fv_learner_locale=pt" });
  expect(portuguese.status()).toBe(200);
  const portugueseHtml = await portuguese.text();
  expect(portugueseHtml).toContain("Palavra-passe");
  expect(portugueseHtml).toContain("Continuar com Apple");
  expect(portugueseHtml).toContain('lang="pt-PT"');
  const portugueseRegistration = await call(request, "GET", "/create-account", undefined, { Cookie: "fv_learner_locale=pt" });
  expect(portugueseRegistration.status()).toBe(200);
  expect(await portugueseRegistration.text()).toContain("Criar conta");
  jar(request).set("fv_learner_session", "arbitrary");
  const reset = await call(request, "GET", `/reset-password?token=fv_reset_${"b".repeat(48)}`);
  expect(reset.status()).toBe(200);
  expect(reset.headers()["referrer-policy"]).toBe("no-referrer");
  expect(await reset.text()).toContain("Choose a new password");
});

test("HTTP: native progress count persists, replay is idempotent, and skipped levels cannot be saved", async ({ request }) => {
  await register(request);
  expect((await call(request, "POST", "/api/progress", { results: [result(2)] })).status()).toBe(409);
  const first = await call(request, "POST", "/api/progress", { results: [result()] });
  expect(first.status()).toBe(200);
  expect((await first.json()).units[0]).toMatchObject({ unitId: "path_u1", completedLessonCount: 1 });
  expect((await call(request, "POST", "/api/progress", { results: [result()] })).status()).toBe(200);
  expect((await (await call(request, "GET", "/api/progress")).json()).units[0].completedLessonCount).toBe(1);
  expect((await call(request, "POST", "/api/progress", { results: [result(2)] })).status()).toBe(200);
  expect((await (await call(request, "GET", "/api/progress")).json()).units[0].completedLessonCount).toBe(2);
});

test("HTTP: an existing session upgrades through reauthentication without a redirect loop", async ({ request }) => {
  await register(request);
  jar(request).delete("fv_learner_context");
  const home = await call(request, "GET", "/home");
  expect(home.status()).toBe(307);
  expect(home.headers().location).toContain("/reauthenticate");
  expect((await call(request, "GET", "/reauthenticate")).status()).toBe(200);
  expect((await call(request, "POST", "/api/progress", { results: [result()] })).status()).toBe(409);
  const login = await call(request, "POST", "/api/auth/login", { email: "http-first@example.test", password: "fixture-password" });
  expect(login.status()).toBe(200);
  expect(scope(request)).toMatch(/^[a-f0-9]{64}$/);
  expect((await call(request, "GET", "/home")).status()).toBe(200);
});

test("HTTP: paused saves are retryable and another account cannot receive a stale-page upload", async ({ request }) => {
  await register(request);
  const firstScope = scope(request);
  await request.post("http://127.0.0.1:4319/_test/fail-writes", { data: { enabled: true } });
  expect((await call(request, "POST", "/api/progress", { results: [result()] })).status()).toBe(503);
  expect((await (await call(request, "GET", "/api/progress")).json()).units).toEqual([]);
  await request.post("http://127.0.0.1:4319/_test/fail-writes", { data: { enabled: false } });
  expect((await call(request, "POST", "/api/progress", { results: [result()] })).status()).toBe(200);
  expect((await call(request, "POST", "/api/auth/logout")).status()).toBe(200);
  await register(request, "http-second@example.test");
  expect((await call(request, "POST", "/api/progress", { scope: firstScope, results: [result()] })).status()).toBe(409);
  expect((await (await call(request, "GET", "/api/progress")).json()).units).toEqual([]);
});

test("HTTP: profile and export use the current identity; deletion requires password and confirmation", async ({ request }) => {
  await register(request);
  expect((await call(request, "PATCH", "/api/account", { displayName: "Changed fixture", appLanguage: "pt" })).status()).toBe(200);
  const page = await call(request, "GET", "/account");
  expect(page.status()).toBe(200);
  expect(await page.text()).toContain("Changed fixture");
  const exported = await call(request, "GET", `/api/account/export?scope=${scope(request)}`);
  expect(exported.status()).toBe(200);
  expect(exported.headers()["cache-control"]).toBe("no-store");
  const data = await exported.json();
  expect(data.account.displayName).toBe("Changed fixture");
  expect(Object.keys(data.progress)).toHaveLength(6);
  expect(JSON.stringify(data)).not.toContain("fv_learn_");
  expect((await call(request, "DELETE", "/api/account", { confirmation: "DELETE" })).status()).toBe(400);
  expect((await call(request, "DELETE", "/api/account", { confirmation: "DELETE", password: "fixture-password" })).status()).toBe(200);
  expect(jar(request).has("fv_learner_session")).toBe(false);
  expect((await call(request, "GET", "/account")).status()).toBe(307);
});

test("HTTP: cross-origin writes are rejected without logout; missing delivery configuration returns 503", async ({ request }) => {
  await register(request);
  const token = jar(request).get("fv_learner_session");
  const blocked = await call(request, "POST", "/api/progress", { results: [result()] }, { Origin: "https://other.example.test" });
  expect(blocked.status()).toBe(403);
  expect(jar(request).get("fv_learner_session")).toBe(token);
  expect((await call(request, "POST", "/api/auth/forgot-password", { email: "http-first@example.test" })).status()).toBe(503);
  const health = await call(request, "GET", "/api/health");
  expect(health.status()).toBe(200);
  expect((await health.json()).ok).toBe(true);
});
