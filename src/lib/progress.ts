import type { CurriculumUnit } from "@/lib/learning-path";

export type LessonResult = { unit: number; level: number; score: number; completedAt: string };
export type UnitProgress = {
  unitId: string; unitSortOrder: number; completedLessonCount: number; acknowledgedLessonCount: number;
  bestScorePercent: number; isUnlocked: boolean; lastCompletedAt: string | null;
};
export type LocalProgress = { version: 1; results: LessonResult[]; units: UnitProgress[] };
export const EMPTY_PROGRESS: LocalProgress = { version: 1, results: [], units: [] };

export function lessonKey(result: Pick<LessonResult, "unit" | "level">) { return `${result.unit}:${result.level}`; }

export function isLessonResult(value: unknown): value is LessonResult {
  if (!value || typeof value !== "object") return false;
  const row = value as LessonResult;
  return Number.isSafeInteger(row.unit) && row.unit > 0 && row.unit <= 1000 && Number.isSafeInteger(row.level) &&
    row.level > 0 && row.level <= 1000 && Number.isInteger(row.score) && row.score >= 0 && row.score <= 100 &&
    typeof row.completedAt === "string" && Number.isFinite(Date.parse(row.completedAt)) &&
    Date.parse(row.completedAt) <= Date.now() + 60_000;
}

export function mergeResults(...groups: LessonResult[][]): LessonResult[] {
  const results = new Map<string, LessonResult>();
  for (const row of groups.flat()) {
    if (!isLessonResult(row)) continue;
    const key = lessonKey(row), previous = results.get(key);
    results.set(key, { ...row, score: Math.max(row.score, previous?.score ?? 0),
      completedAt: previous && Date.parse(previous.completedAt) > Date.parse(row.completedAt) ? previous.completedAt : row.completedAt });
  }
  return [...results.values()].sort((a, b) => a.unit - b.unit || a.level - b.level);
}

export function parseLocalProgress(raw: string | null): LocalProgress {
  if (!raw || raw.length > 150_000) return EMPTY_PROGRESS;
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || !Array.isArray(data.results) || data.results.length > 1000) return EMPTY_PROGRESS;
    const units: UnitProgress[] = Array.isArray(data.units) ? data.units.filter((row: UnitProgress) =>
      row && typeof row.unitId === "string" && Number.isSafeInteger(row.completedLessonCount) && row.completedLessonCount >= 0 &&
      Number.isFinite(row.bestScorePercent) && row.bestScorePercent >= 0 && row.bestScorePercent <= 100) : [];
    return { version: 1, results: mergeResults(data.results), units };
  } catch { return EMPTY_PROGRESS; }
}

export function canonicalUnitId(raw: string) {
  const legacy = /^unit_(\d+)$/.exec(raw);
  return legacy ? `path_u${Number(legacy[1]) + 1}` : raw;
}

export function unitCount(rows: UnitProgress[], unit: number) {
  return Math.max(0, ...rows.filter(row => canonicalUnitId(row.unitId) === `path_u${unit}`).map(row =>
    Number.isSafeInteger(row.completedLessonCount) ? row.completedLessonCount : 0));
}

/** Native counts represent the first N real levels, never arbitrary skipped levels. */
export function completedCount(unit: CurriculumUnit, rows: UnitProgress[], local: LessonResult[]) {
  let count = Math.min(unit.levels.length, unitCount(rows, unit.number));
  const completed = new Set(local.filter(row => row.unit === unit.number).map(row => row.level));
  while (count < unit.levels.length && completed.has(unit.levels[count].number)) count++;
  return count;
}

export function lessonAvailable(unit: CurriculumUnit, level: number, rows: UnitProgress[], local: LessonResult[]) {
  const position = unit.levels.findIndex(item => item.number === level);
  return position >= 0 && position <= completedCount(unit, rows, local);
}

/** Web adds completed lessons; XP, streaks, SRS and mastery remain native-owned. */
export function progressRows(units: CurriculumUnit[], previous: UnitProgress[], results: LessonResult[]): UnitProgress[] {
  return units.filter(unit => results.some(row => row.unit === unit.number)).map(unit => {
    const old = previous.find(row => canonicalUnitId(row.unitId) === `path_u${unit.number}`);
    const relevant = results.filter(row => row.unit === unit.number);
    return { ...old, unitId: `path_u${unit.number}`, unitSortOrder: unit.number,
      completedLessonCount: completedCount(unit, previous, relevant),
      acknowledgedLessonCount: Math.max(unit.levels.length, old?.acknowledgedLessonCount ?? 0),
      bestScorePercent: Math.max(old?.bestScorePercent ?? 0, ...relevant.map(row => row.score)),
      isUnlocked: true,
      lastCompletedAt: [old?.lastCompletedAt, ...relevant.map(row => row.completedAt)]
        .filter((date): date is string => typeof date === "string" && Number.isFinite(Date.parse(date)))
        .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null };
  });
}
