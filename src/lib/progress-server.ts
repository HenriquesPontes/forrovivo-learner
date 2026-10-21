import { backend, BackendError, bearer } from "@/lib/backend";
import { RequestError } from "@/lib/http";
import type { UnitProgress } from "@/lib/progress";

export type CloudProgress = { updatedAt: string; payload: Record<string, unknown>; units: UnitProgress[] };

export async function cloudProgress(token: string, studyLanguage = "forro"): Promise<CloudProgress | null> {
  let data: Record<string, unknown>;
  try { data = await backend(`/app/v1/progress?studyLanguage=${encodeURIComponent(studyLanguage)}`, { headers: bearer(token) }); }
  catch (error) {
    if (error instanceof BackendError && error.status === 404 && error.code === "PROGRESS_NOT_FOUND") return null;
    throw error;
  }
  const payload = data.payload;
  if (data.studyLanguage !== studyLanguage || typeof data.updatedAt !== "string" || !Number.isFinite(Date.parse(data.updatedAt)) ||
    !payload || typeof payload !== "object" || Array.isArray(payload) || !Array.isArray((payload as Record<string, unknown>).unitProgress)) {
    throw new RequestError(502, "Could not read saved progress. Please try again.");
  }
  const raw = payload as Record<string, unknown>;
  const units = (raw.unitProgress as unknown[]).filter((row): row is UnitProgress => {
    if (!row || typeof row !== "object") return false;
    const unit = row as UnitProgress;
    return typeof unit.unitId === "string" && Number.isSafeInteger(unit.completedLessonCount) && unit.completedLessonCount >= 0 &&
      Number.isFinite(unit.bestScorePercent) && unit.bestScorePercent >= 0 && unit.bestScorePercent <= 100;
  });
  return { updatedAt: data.updatedAt, payload: raw, units };
}
