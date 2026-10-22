import { beforeEach, afterEach, expect, it, vi, type Mock } from "vitest";
const state = vi.hoisted(() => ({ token: "", context: "" }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (name: string) => name === "fv_learner_session" && state.token ? { value: state.token } : name === "fv_learner_context" && state.context ? { value: state.context } : undefined }) }));
import { GET, POST } from "@/app/api/progress/route";
import { getLearningHealth } from "@/lib/health";
import { authResponse, storageScope } from "@/lib/auth";
const token = `fv_learn_${"a".repeat(48)}`;
let scope = "";
const account = { provider: "email", email: "learner@example.test", displayName: "Learner", appLanguage: "en", studyLanguage: "forro", createdAt: "2026-01-01", updatedAt: "2026-01-01" };
const entries = [1, 2].map(level => ({ id: `fixture-${level}`, unit_number: 1, level_number: level, forro_text: `Fixture ${level}`, translation_en: `Translation ${level}` }));
const result = (level: number) => ({ unit: 1, level, score: 80, completedAt: new Date().toISOString() });
let fetcher: Mock<typeof fetch>;
let cloud: null | { status: string; studyLanguage: string; updatedAt: string; payload: Record<string, unknown> };
const request = (results: unknown, origin = "https://learn.example.test") => new Request("https://learn.example.test/api/progress", {
  method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ scope, results }),
});
const getRequest = () => new Request("https://learn.example.test/api/progress", { headers: { "X-ForroVivo-Web-Scope": scope } });

beforeEach(async () => {
  state.token = token; cloud = null;
  vi.stubEnv("API_ORIGIN", "https://api.example.test");
  vi.stubEnv("LEARN_ORIGIN", "https://learn.example.test");
  vi.stubEnv("LEARNER_WEB_SERVICE_KEY", "test-only-service-key");
  fetcher = vi.fn<typeof fetch>(async (input, options) => {
    const url = String(input);
    if (url.endsWith("/account")) return Response.json({ status: "ok", account });
    if (url.endsWith("learning_path.json")) return Response.json({ entries });
    if (url.includes("/progress?") && options?.method !== "PUT") return cloud ? Response.json(cloud) : Response.json({ status: "error", code: "PROGRESS_NOT_FOUND" }, { status: 404 });
    if (url.endsWith("/progress") && options?.method === "PUT") {
      const body = JSON.parse(String(options.body));
      cloud = { ...body, status: "ok" };
      return Response.json({ status: "ok" });
    }
    throw new Error("Unexpected test URL");
  });
  vi.stubGlobal("fetch", fetcher);
  scope = await storageScope("email:learner@example.test");
  state.context = (await authResponse({ status: "ok", token, expiresAt: new Date(Date.now() + 60_000).toISOString(),
    accountKey: "email:learner@example.test", provider: "email" })).cookies.get("fv_learner_context")!.value;
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("refuses missing sessions, forged account headers, and cross-site writes before progress mutation", async () => {
  state.token = "";
  expect((await GET(getRequest())).status).toBe(401);
  state.token = "forged";
  expect((await GET(getRequest())).status).toBe(401);
  state.token = token;
  const rejected = await POST(request([result(1)], "https://other.example.test"));
  expect(rejected.status).toBe(403);
  expect(rejected.cookies.get("fv_learner_session")).toBeUndefined();
  expect(fetcher).not.toHaveBeenCalled();
});

it("distinguishes no snapshot from an outage and never overwrites on a failed read", async () => {
  expect((await GET(getRequest())).status).toBe(200);
  fetcher.mockImplementation(async input => String(input).endsWith("/account") ? Response.json({ status: "ok", account }) : Response.json({ status: "error" }, { status: 503 }));
  expect((await POST(request([result(1)]))).status).toBe(503);
  expect(fetcher.mock.calls.some(call => call[1]?.method === "PUT")).toBe(false);
});

it("never uploads or reads a previous account's pending lessons after cookies change", async () => {
  scope = "d".repeat(64);
  expect((await POST(request([result(1)]))).status).toBe(409);
  expect((await GET(getRequest())).status).toBe(409);
  expect(fetcher.mock.calls.every(call => String(call[0]).endsWith("/account"))).toBe(true);
});

it("uses the complete native shape for first sync and verifies the persisted count before confirming success", async () => {
  const response = await POST(request([result(1)]));
  expect(response.status).toBe(200);
  const write = fetcher.mock.calls.find(call => call[1]?.method === "PUT")!;
  const body = JSON.parse(String(write[1]?.body));
  expect(body).toMatchObject({ schemaVersion: 1, studyLanguage: "forro", payload: {
    unitProgress: [{ unitId: "path_u1", unitSortOrder: 1, completedLessonCount: 1 }] } });
  expect(body.basePayload).toBeUndefined();
  expect(body.payload.profile).toBeUndefined();
  expect(Math.abs(Date.now() - Date.parse(body.updatedAt))).toBeLessThan(60_000);
  expect(write[1]?.headers).toMatchObject({ Authorization: `Bearer ${token}` });
});

it("rejects malformed results, obsolete lessons and skipped levels without any cloud write", async () => {
  for (const results of [null, [], [{ ...result(1), score: 999 }], [result(2)], [{ ...result(1), unit: 999 }]]) {
    const response = await POST(request(results));
    expect([400, 409]).toContain(response.status);
  }
  expect(fetcher.mock.calls.some(call => call[1]?.method === "PUT")).toBe(false);
});

it("cannot report success if the upstream acknowledges a save without persisting it", async () => {
  const original = fetcher.getMockImplementation()!;
  fetcher.mockImplementation(async (input, options) => String(input).endsWith("/progress") && options?.method === "PUT" ? Response.json({ status: "ok" }) : original(input, options));
  expect((await POST(request([result(1)]))).status).toBe(503);
});

it("preserves the complete native payload and records current web activity", async () => {
  cloud = { status: "ok", studyLanguage: "forro", updatedAt: new Date().toISOString(), payload: {
    profile: { xp: 450 }, unitProgress: [{ unitId: "path_u1", unitSortOrder: 7, completedLessonCount: 0, bestScorePercent: 0, isUnlocked: true, lastCompletedAt: null }], srsCards: [{ entryId: "fixture-srs" }], mistakes: [], bookmarkEntryIds: ["fixture-bookmark"] } };
  const before = structuredClone(cloud);
  const original = fetcher.getMockImplementation()!;
  fetcher.mockImplementation(async (input, options) => {
    if (String(input).endsWith("/progress") && options?.method === "PUT") {
      const body = JSON.parse(String(options.body));
      expect(Date.parse(body.updatedAt)).toBeGreaterThanOrEqual(Date.parse(before.updatedAt));
      expect(body.payload.profile).toBeUndefined();
      expect(body.payload.srsCards).toBeUndefined();
      expect(body.payload.bookmarkEntryIds).toBeUndefined();
      expect(body.basePayload).toEqual({ unitProgress: before.payload.unitProgress });
      cloud = { ...before, status: "ok", updatedAt: body.updatedAt, payload: { ...before.payload, unitProgress: body.payload.unitProgress } };
      return Response.json({ status: "ok" });
    }
    return original(input, options);
  });
  expect((await POST(request([result(1)]))).status).toBe(200);
  expect(cloud!.payload.profile).toEqual({ xp: 450 });
  expect(cloud!.payload.bookmarkEntryIds).toEqual(["fixture-bookmark"]);
});

it("health probes honor the configured backend and reject a degraded HTTP 200", async () => {
  fetcher.mockImplementation(async input => Response.json(String(input).includes("/account/") ? { status: "ok", d1: "error" } : { status: "ok" }));
  const health = await getLearningHealth();
  expect(health.ok).toBe(false);
  expect(health.host).toBe("learn.example.test");
  expect(fetcher.mock.calls.every(call => String(call[0]).startsWith("https://api.example.test/"))).toBe(true);
});
