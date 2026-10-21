// @vitest-environment jsdom
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { AuthLanguageProvider } from "@/components/AuthLanguage";
import { OnboardingFlow } from "@/components/OnboardingFlow";

let root: Root;
let node: HTMLDivElement;

beforeEach(() => {
  node = document.createElement("div");
  document.body.appendChild(node);
  root = createRoot(node);
});

afterEach(() => {
  act(() => root.unmount());
  node.remove();
});

async function mountFlow() {
  const done = viDone();
  await act(async () => { root.render(<StrictMode><AuthLanguageProvider initialLocale="en"><OnboardingFlow onDone={done.fn} /></AuthLanguageProvider></StrictMode>); });
  return done;
}
async function choose(value: string) {
  await act(async () => { node.querySelector<HTMLInputElement>(`input[value="${value}"]`)!.click(); });
  await act(async () => { node.querySelector<HTMLButtonElement>("button.auth-submit")!.click(); });
}
async function skip() {
  await act(async () => { node.querySelector<HTMLButtonElement>(".onboard-skip")!.click(); });
}
it("Solo skips teacher questions and opens lessons after the app invitation", async () => {
  const done = await mountFlow();
  expect(node.querySelector(".onboard-skip")).toBeNull();
  await choose("solo");
  expect(node.textContent).toContain("How much Forro do you know?");
  await choose("some");
  await skip();
  expect(node.querySelector('a[href*="apps.apple.com"]')).toBeTruthy();
  expect(node.querySelector('a[href*="play.google.com"]')).toBeTruthy();
  await act(async () => { node.querySelector<HTMLButtonElement>("button.auth-submit")!.click(); });
  expect(done.calls).toBe(1);
  expect(JSON.parse(localStorage.getItem("fv_learner_introduction")!)).toEqual({ version: 2, mode: "solo", level: "some" });
});
it("Conexão collects paid-lesson preferences and saves without opening Solo or claiming a booking", async () => {
  const done = await mountFlow();
  await choose("connection");
  expect(node.textContent).toContain("Who’s learning Forro?");
  await choose("myself");
  await choose("new");
  await choose("roots");
  expect(node.textContent).toContain("How often would you like to meet?");
  await choose("weekly");
  await choose("weekends");
  await choose("conversation");
  expect(node.textContent).toContain("Paid lessons · Coming soon");
  expect(node.querySelector('a[href*="apps.apple.com"]')).toBeNull();
  await act(async () => { node.querySelector<HTMLButtonElement>("button.auth-submit")!.click(); });
  expect(done.calls).toBe(0);
  expect(node.querySelector('[role="status"]')?.textContent).toContain("Preferences saved");
  expect(JSON.parse(localStorage.getItem("fv_learner_introduction")!).frequency).toBe("weekly");
  await skip();
  expect(done.calls).toBe(1);
});
it("switching from Conexão to Solo changes the path and discards teacher preferences on completion", async () => {
  const done = await mountFlow();
  await choose("connection");
  await act(async () => { node.querySelector<HTMLButtonElement>(".onboard-back")!.click(); });
  await choose("solo");
  expect(node.textContent).toContain("How much Forro do you know?");
  await skip(); await skip();
  await act(async () => { node.querySelector<HTMLButtonElement>("button.auth-submit")!.click(); });
  expect(done.calls).toBe(1);
  expect(JSON.parse(localStorage.getItem("fv_learner_introduction")!).mode).toBe("solo");
});

function viDone() {
  const state = { calls: 0, fn: () => { state.calls += 1; } };
  return state;
}
