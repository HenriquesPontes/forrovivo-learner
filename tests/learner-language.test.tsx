// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LearnerLanguage } from "@/components/LearnerLanguage";
import { LearnerText } from "@/components/LearnerText";
import { AccountSettings } from "@/components/AccountSettings";
import type { Account } from "@/lib/backend";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }) }));
let root: Root;
let node: HTMLDivElement;
const account: Account = { provider: "google", email: null, displayName: "Learner", appLanguage: "en", studyLanguage: "forro", createdAt: "", updatedAt: "" };
beforeEach(() => { node = document.createElement("div"); document.body.append(node); root = createRoot(node); });
afterEach(() => { act(() => root.unmount()); node.remove(); vi.unstubAllGlobals(); });
async function mount(locale: "en" | "pt") {
  await act(async () => root.render(<LearnerLanguage initialLocale={locale}><LearnerText text="Your account" /><AccountSettings account={{ ...account, appLanguage: locale }} scope="test" /></LearnerLanguage>));
}
it("applies the saved Portuguese preference on initial page load", async () => {
  await mount("pt");
  expect(node.textContent).toContain("A tua conta");
  expect(node.textContent).toContain("Idioma da interface");
  expect(document.documentElement.lang).toBe("pt-PT");
});
it("switches the entire page after a successful profile save and persists a locale cookie", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "ok", appLanguage: "pt" }) });
  vi.stubGlobal("fetch", fetchMock);
  await mount("en");
  await act(async () => {
    const select = node.querySelector("select")!;
    select.value = "pt";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await act(async () => { node.querySelector("form#profile")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  expect(JSON.parse(fetchMock.mock.calls[0][1].body).appLanguage).toBe("pt");
  expect(node.textContent).toContain("Perfil guardado.");
  expect(node.textContent).toContain("A tua conta");
  expect(document.cookie).toContain("fv_learner_locale=pt");
  expect(document.documentElement.lang).toBe("pt-PT");
});
it("does not change the interface when saving fails", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ status: "error" }) }));
  await mount("en");
  await act(async () => { const select = node.querySelector("select")!; select.value = "pt"; select.dispatchEvent(new Event("change", { bubbles: true })); });
  await act(async () => { node.querySelector("form#profile")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  expect(node.textContent).toContain("Your account");
  expect(document.documentElement.lang).toBe("en");
});
