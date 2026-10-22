import { requireAccount } from "@/lib/session";
import { backend, BackendError, bearer } from "@/lib/backend";
import { clearSessionCookies } from "@/lib/auth";
import { json, readJson, RequestError, routeError } from "@/lib/http";
import { findLevel } from "@/lib/learning-path";
import { fetchForroCurriculum } from "@/lib/catalog";
import { cloudProgress } from "@/lib/progress-server";
import { isLessonResult, completedCount, progressRows, canonicalUnitId } from "@/lib/progress";

function failure(error: unknown) {
  const response = routeError(error);
  return error instanceof BackendError && [401, 403].includes(error.status) ? clearSessionCookies(response) : response;
}

export async function GET(request: Request) {
  try {
    const { token, scope } = await requireAccount();
    if (request.headers.get("X-ForroVivo-Web-Scope") !== scope) throw new RequestError(409, "Your account changed. Reload this page before syncing.");
    const saved = await cloudProgress(token);
    return json({ status: "ok", units: saved?.units ?? [] });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request, 128_000);
    const { token, scope } = await requireAccount();
    if (body.scope !== scope) throw new RequestError(409, "Your account changed. Reload this page before syncing.");
    if (!Array.isArray(body.results) || body.results.length < 1 || body.results.length > 1000 || !body.results.every(isLessonResult)) {
      throw new RequestError(400, "Choose valid completed lessons to save.");
    }
    const results = body.results;
    const [units, saved] = await Promise.all([fetchForroCurriculum(), cloudProgress(token)]);
    for (const result of results) {
      const match = findLevel(units, result.unit, result.level);
      if (!match) throw new RequestError(400, "This lesson is no longer in the current course.");
      const count = completedCount(match.unit, saved?.units ?? [], results);
      if (match.unit.levels.findIndex(level => level.number === result.level) >= count) {
        throw new RequestError(409, "Complete earlier lessons in this unit before saving this lesson.");
      }
    }
    const additions = progressRows(units, saved?.units ?? [], results);
    const touched = new Set(additions.map(row => canonicalUnitId(row.unitId)));
    const readUnits = Array.isArray(saved?.payload.unitProgress) ? saved.payload.unitProgress : [];
    const baselineUnits = readUnits.filter(row => {
      if (!row || typeof row !== "object" || Array.isArray(row)) return false;
      const id = (row as { unitId?: unknown }).unitId;
      return typeof id === "string" && touched.has(canonicalUnitId(id));
    });
    // Web owns lessons only. The baseline lets the server keep concurrent edits
    // to every other field instead of treating this write as a newer full copy.
    const updatedAt = new Date(Math.max(Date.now(), saved ? Date.parse(saved.updatedAt) : 0)).toISOString();
    const payload = { unitProgress: additions };
    await backend("/app/v1/progress", { method: "PUT", headers: { ...bearer(token), "Content-Type": "application/json" },
      body: JSON.stringify({ schemaVersion: 1, studyLanguage: "forro", updatedAt, payload,
        ...(baselineUnits.length ? { basePayload: { unitProgress: baselineUnits } } : {}) }) });
    const confirmed = await cloudProgress(token);
    if (!confirmed || additions.some(addition => !confirmed.units.some(row => row.unitId === addition.unitId &&
      row.completedLessonCount >= addition.completedLessonCount && row.bestScorePercent >= addition.bestScorePercent))) {
      throw new RequestError(503, "Progress could not be confirmed. Your browser will keep it for retry.");
    }
    return json({ status: "ok", units: confirmed.units });
  } catch (error) { return failure(error); }
}
