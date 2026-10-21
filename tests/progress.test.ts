import { describe, it, expect } from "vitest";
import { completedCount, isLessonResult, lessonAvailable, mergeResults, parseLocalProgress, progressRows } from "@/lib/progress";
import { parseLearningPath } from "@/lib/learning-path";

const units = parseLearningPath({ entries: [1, 2, 4].map(level => ({ id: `fixture-${level}`, kind: "path", forro_text: `Fixture ${level}`,
  translation_en: `Translation ${level}`, unit_number: 1, level_number: level })) });
const result = (level: number, score = 80) => ({ unit: 1, level, score, completedAt: new Date().toISOString() });
const native = [{ unitId: "unit_0", unitSortOrder: 1, completedLessonCount: 1, acknowledgedLessonCount: 3,
  bestScorePercent: 95, isUnlocked: true, lastCompletedAt: "2026-01-01T00:00:00Z" }];

describe("native progress compatibility", () => {
  it("uses actual sorted levels and never marks a skipped lesson complete", () => {
    expect(completedCount(units[0], [], [result(4)])).toBe(0);
    expect(completedCount(units[0], [], [result(1), result(2), result(4)])).toBe(3);
    expect(lessonAvailable(units[0], 4, [], [result(1)])).toBe(false);
    expect(lessonAvailable(units[0], 2, native, [])).toBe(true);
  });
  it("maps legacy native IDs, preserves the best score and does not award replay counts or XP", () => {
    const rows = progressRows(units, native, [result(2), result(2, 60)]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ unitId: "path_u1", completedLessonCount: 2, bestScorePercent: 95, acknowledgedLessonCount: 3 });
    expect(rows[0]).not.toHaveProperty("xp");
  });
  it("keeps the best replay score and latest completion while rejecting corrupt storage", () => {
    expect(mergeResults([result(1, 90)], [result(1, 40)])).toHaveLength(1);
    expect(mergeResults([result(1, 90)], [result(1, 40)])[0].score).toBe(90);
    for (const raw of ["null", "bad", '{"version":1,"results":{}}', '[]']) expect(parseLocalProgress(raw).results).toEqual([]);
    expect(isLessonResult({ ...result(1), score: 500 })).toBe(false);
    expect(isLessonResult({ ...result(1), completedAt: "invalid" })).toBe(false);
    expect(isLessonResult({ ...result(1), completedAt: "2099-01-01T00:00:00Z" })).toBe(false);
  });
});


describe("sequential course access", () => {
  const second = { ...units[0], number: 2 };
  const curriculum = [units[0], second];
  it("opens only the first lesson of the first unit for a new learner", () => {
    expect(lessonAvailable(units[0], 1, [], [], curriculum)).toBe(true);
    expect(lessonAvailable(units[0], 2, [], [], curriculum)).toBe(false);
    expect(lessonAvailable(second, 1, [], [], curriculum)).toBe(false);
  });
  it("keeps later units locked until every earlier lesson is complete", () => {
    expect(lessonAvailable(second, 1, [], [result(1), result(2)], curriculum)).toBe(false);
    expect(lessonAvailable(second, 1, [], [result(1), result(2), result(4)], curriculum)).toBe(true);
    expect(lessonAvailable(second, 2, [], [result(1), result(2), result(4)], curriculum)).toBe(false);
  });
  it("uses synced native completion counts to unlock the next unit", () => {
    expect(lessonAvailable(second, 1, [{ ...native[0], completedLessonCount: 3 }], [], curriculum)).toBe(true);
    expect(lessonAvailable(second, 1, native, [], curriculum)).toBe(false);
  });
});
