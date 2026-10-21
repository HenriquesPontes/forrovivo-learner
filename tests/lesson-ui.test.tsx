// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { LearnerProgress, LessonAccess, ProgressStatus } from "@/components/academy/LearnerProgress";
import { LessonQuiz } from "@/components/academy/LessonQuiz";
import { CourseMap } from "@/components/academy/CourseMap";
import { parseLearningPath } from "@/lib/learning-path";
import { progressKey, readLocalProgress } from "@/lib/browser-progress";

const units = parseLearningPath({ entries: [1, 2].map(level => ({ id: `fixture-${level}`, unit_number: 1, level_number: level,
  unit_title: "Fixture unit", level_title: `Fixture lesson ${level}`, skill_family: "vocab", forro_text: `Fixture ${level}`, translation_en: `Translation ${level}` })) });
let root: Root;
let node: HTMLDivElement;
function lesson(guest: boolean, scope: string) {
  return <LearnerProgress scope={scope} guest={guest}><LessonAccess units={units} unit={units[0]} level={1}>
    <LessonQuiz unitNumber={1} levelNumber={1} unitTitle="Fixture unit" levelTitle="Fixture lesson" skillFamily="vocab"
      phrases={units[0].levels[0].phrases} distractors={units[0].levels.flatMap(level => level.phrases)} />
  </LessonAccess><ProgressStatus /></LearnerProgress>;
}
async function click(text: string) {
  const button = [...node.querySelectorAll("button")].find(item => item.textContent === text);
  expect(button, text).toBeTruthy();
  await act(async () => { button!.click(); });
}
async function finish() { await click("Translation 1"); await click("Check"); await click("Finish"); }

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.localStorage.clear();
  node = document.createElement("div");
  document.body.appendChild(node);
  root = createRoot(node);
});
afterEach(async () => {
  await act(async () => root.unmount());
  node.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("guest completion is durable and the course map restores it after remount", async () => {
  await act(async () => root.render(lesson(true, "guest")));
  await finish();
  expect(node.textContent).toContain("Lesson saved on this browser.");
  expect(readLocalProgress("guest").results).toMatchObject([{ unit: 1, level: 1, score: 100 }]);
  await act(async () => root.unmount());
  root = createRoot(node);
  await act(async () => root.render(<LearnerProgress scope="guest" guest><CourseMap units={units} guestMode /></LearnerProgress>));
  expect(node.textContent).toContain("Completed");
  expect(node.querySelector('a[href^="/academy/1/2"]')).not.toBeNull();
});

it("an unavailable cloud keeps the outbox and a successful retry clears only confirmed results", async () => {
  let paused = true;
  let cloud: unknown[] = [];
  vi.stubGlobal("fetch", vi.fn(async (_input: unknown, options?: RequestInit) => {
    if (options?.method === "POST") {
      if (paused) return Response.json({ status: "error", message: "Sync paused." }, { status: 503 });
      const body = JSON.parse(String(options.body));
      expect(body.scope).toBe("account-a");
      cloud = [{ unitId: "path_u1", completedLessonCount: 1, bestScorePercent: 100 }];
    }
    return Response.json({ status: "ok", units: cloud });
  }));
  await act(async () => root.render(lesson(false, "account-a")));
  await finish();
  expect(node.textContent).toContain("Saved on this browser. Use Retry sync to save to your account.");
  expect(readLocalProgress("account-a").results).toHaveLength(1);
  paused = false;
  await click("Retry sync");
  expect(readLocalProgress("account-a").results).toHaveLength(0);
  expect(node.textContent).toContain("Progress saved to your account.");
  expect(window.localStorage.getItem(progressKey("account-b"))).toBeNull();
});

it("blocked browser storage cannot produce a false saved message and exposes retry", async () => {
  await act(async () => root.render(lesson(true, "guest")));
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("fixture quota error"); });
  await finish();
  expect(node.textContent).toContain("Your browser could not save this lesson.");
  expect(node.textContent).not.toContain("Lesson saved on this browser.");
  expect([...node.querySelectorAll("button")].some(button => button.textContent === "Retry save")).toBe(true);
});
