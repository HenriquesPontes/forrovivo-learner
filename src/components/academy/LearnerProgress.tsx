"use client";

import { LearnerText } from "@/components/LearnerText";


import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CurriculumUnit } from "@/lib/learning-path";
import { isLessonResult, lessonAvailable, mergeResults, parseLocalProgress, type LessonResult, type UnitProgress } from "@/lib/progress";
import { progressSnapshot, readLocalProgress, serverProgressSnapshot, subscribeProgress, updateLocalProgress } from "@/lib/browser-progress";
import { GUEST_MAX_UNIT } from "@/lib/validation";

type ProgressContext = {
  ready: boolean; guest: boolean; scope: string; rows: UnitProgress[]; results: LessonResult[];
  save: (result: LessonResult) => Promise<string>; sync: () => Promise<boolean>; notice: string;
  claim: () => Promise<void>; guestResults: LessonResult[];
};
const Context = createContext<ProgressContext | null>(null);
const noopSubscribe = () => () => {};

async function responseBody(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.status !== "ok" || !Array.isArray(data.units)) {
    throw new Error(typeof data?.message === "string" ? data.message : "Could not sync. Your browser keeps this lesson for retry.");
  }
  return data.units as UnitProgress[];
}

export function LearnerProgress({ scope, guest, children }: { scope: string; guest: boolean; children: React.ReactNode }) {
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const snapshot = useSyncExternalStore(subscribeProgress, useCallback(() => progressSnapshot(scope), [scope]), serverProgressSnapshot);
  const guestSnapshot = useSyncExternalStore(subscribeProgress, useCallback(() => progressSnapshot("guest"), []), serverProgressSnapshot);
  const local = useMemo(() => parseLocalProgress(snapshot), [snapshot]);
  const guestResults = useMemo(() => parseLocalProgress(guestSnapshot).results.filter(row => row.unit <= GUEST_MAX_UNIT), [guestSnapshot]);
  const [notice, setNotice] = useState(guest ? "Guest lessons are saved on this browser." : "Loading saved progress…");
  const [loaded, setLoaded] = useState(guest);
  const running = useRef<Promise<boolean> | null>(null);

  const sync = useCallback((): Promise<boolean> => {
    if (guest) return Promise.resolve(true);
    if (running.current) return running.current;
    const task = (async () => {
      await Promise.resolve();
      try {
        const rows = await responseBody(await fetch("/api/progress", { cache: "no-store", headers: { "X-ForroVivo-Web-Scope": scope } }));
        await updateLocalProgress(scope, current => ({ ...current, units: rows }));
        for (let attempt = 0; attempt < 3; attempt++) {
          const submitted = readLocalProgress(scope).results;
          if (!submitted.length) break;
          const confirmed = await responseBody(await fetch("/api/progress", { method: "POST",
            headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scope, results: submitted }) }));
          await updateLocalProgress(scope, current => ({ ...current, units: confirmed,
            results: current.results.filter(row => !submitted.some(sent => sent.unit === row.unit && sent.level === row.level &&
              sent.score === row.score && sent.completedAt === row.completedAt)) }));
        }
        const complete = readLocalProgress(scope).results.length === 0;
        setNotice(complete ? "Progress saved to your account." : "Saved on this browser. Account sync will retry.");
        return complete;
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Could not sync. Your browser keeps this lesson for retry.");
        return false;
      } finally { setLoaded(true); }
    })();
    running.current = task;
    void task.finally(() => { running.current = null; });
    return task;
  }, [guest, scope]);

  useEffect(() => {
    if (guest) return;
    void sync();
    const refresh = () => { void sync(); };
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    return () => { window.removeEventListener("online", refresh); window.removeEventListener("focus", refresh); };
  }, [guest, sync]);

  async function save(result: LessonResult) {
    if (!isLessonResult(result)) throw new Error("This lesson result could not be saved.");
    try { await updateLocalProgress(scope, current => ({ ...current, results: mergeResults(current.results, [result]) })); }
    catch { throw new Error("Your browser could not save this lesson. Keep this page open and try again."); }
    if (guest) return "Lesson saved on this browser.";
    await sync();
    if (readLocalProgress(scope).results.some(row => row.unit === result.unit && row.level === result.level)) await sync();
    return readLocalProgress(scope).results.some(row => row.unit === result.unit && row.level === result.level) ?
      "Saved on this browser. Use Retry sync to save to your account." : "Lesson saved to your account.";
  }

  async function claim() {
    const submitted = readLocalProgress("guest").results.filter(row => row.unit <= GUEST_MAX_UNIT);
    try {
      await updateLocalProgress(scope, current => ({ ...current, results: mergeResults(current.results, submitted) }));
      if (await sync()) await updateLocalProgress("guest", current => ({ ...current,
        results: current.results.filter(row => !submitted.some(sent => JSON.stringify(sent) === JSON.stringify(row))) }));
    } catch { setNotice("Your guest lessons are still on this browser. Please try saving again."); }
  }

  return <Context value={{ ready: ready && loaded, guest, scope, rows: local.units, results: local.results, save, sync, notice, claim, guestResults }}>{children}</Context>;
}

export function useLearnerProgress() {
  const value = useContext(Context);
  if (!value) throw new Error("LearnerProgress is required");
  return value;
}

export function ProgressStatus() {
  const progress = useLearnerProgress();
  return <div className="mx-auto mt-4 max-w-md text-center text-sm text-[var(--muted)]">
    <p role="status"><LearnerText text={progress.notice} /></p>
    {!progress.guest && progress.ready && progress.notice !== "Progress saved to your account." && <button type="button" onClick={() => void progress.sync()} className="mt-2 font-medium text-[var(--brand)] underline"><LearnerText text={"Retry sync"} /></button>}
    {!progress.guest && progress.ready && progress.guestResults.length > 0 && <div className="mt-4 rounded-lg border border-[var(--border)] p-4">
      <p><LearnerText text={"You have guest lessons saved on this browser."} /></p>
      <button type="button" onClick={() => void progress.claim()} className="mt-2 font-semibold text-[var(--brand)] underline"><LearnerText text={"Save guest lessons to this account"} /></button>
    </div>}
  </div>;
}

export function LessonAccess({ unit, units, level, children }: { unit: CurriculumUnit; units: CurriculumUnit[]; level: number; children: React.ReactNode }) {
  const progress = useLearnerProgress();
  if (!progress.ready) return <p role="status"><LearnerText text={"Loading your lesson…"} /></p>;
  if (!lessonAvailable(unit, level, progress.rows, progress.results, units)) return <div className="mx-auto max-w-lg text-center">
    <h1 className="text-2xl font-semibold"><LearnerText text={"Finish the earlier lessons first"} /></h1>
    <a href="/home" className="mt-4 inline-block text-[var(--brand)] underline"><LearnerText text={"Back to course map"} /></a>
  </div>;
  return children;
}
