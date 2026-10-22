import { parseLocalProgress, type LocalProgress } from "@/lib/progress";

export const PROGRESS_EVENT = "fv-progress-changed";
export function progressKey(scope: string) { return `fv_learner_forro_v1:${scope}`; }
export function progressSnapshot(scope: string) {
  try { return window.localStorage.getItem(progressKey(scope)); } catch { return null; }
}
export function readLocalProgress(scope: string) { return parseLocalProgress(progressSnapshot(scope)); }

/** Web Locks serialize outbox updates between tabs where supported. */
export async function updateLocalProgress(scope: string, update: (current: LocalProgress) => LocalProgress) {
  const commit = () => {
    const value = update(readLocalProgress(scope));
    window.localStorage.setItem(progressKey(scope), JSON.stringify(value));
    window.dispatchEvent(new Event(PROGRESS_EVENT));
    return value;
  };
  return navigator.locks ? navigator.locks.request(progressKey(scope), commit) : commit();
}

export function forgetLocalProgress(scope: string) {
  window.localStorage.removeItem(progressKey(scope));
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

export function subscribeProgress(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(PROGRESS_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(PROGRESS_EVENT, listener);
  };
}

export function serverProgressSnapshot(): string | null { return null; }
