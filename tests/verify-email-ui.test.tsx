// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { AuthLanguageProvider } from "@/components/AuthLanguage";
import { VerifyEmailForm } from "@/components/VerifyEmailForm";
let root: Root;
let node: HTMLDivElement;
const token = `fv_verify_${"a".repeat(48)}`;
beforeEach(() => { node = document.createElement("div"); document.body.append(node); root = createRoot(node); history.replaceState(null, "", `/verify-email#token=${token}`); });
afterEach(() => { act(() => root.unmount()); node.remove(); vi.unstubAllGlobals(); history.replaceState(null, "", "/"); });
it("does not consume a link on page load and confirms by POST in Portuguese", async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ status: "ok" })); vi.stubGlobal("fetch", fetcher);
  await act(async () => root.render(<AuthLanguageProvider initialLocale="pt"><VerifyEmailForm /></AuthLanguageProvider>));
  expect(fetcher).not.toHaveBeenCalled();
  expect(node.textContent).toContain("Confirmar e-mail");
  const input = node.querySelector("input")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "chosen-password");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => { node.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  expect(fetcher).toHaveBeenCalledWith("/api/auth/verify-email", expect.objectContaining({ method: "POST", body: JSON.stringify({ token, password: "chosen-password" }) }));
  expect(node.querySelector('[role="status"]')?.textContent).toContain("Registo verificado");
  expect(location.hash).toBe("");
  expect(node.querySelector('a')?.getAttribute('href')).toBe("/");
});
it("keeps incomplete links inactive and offers a new request", async () => {
  history.replaceState(null, "", "/verify-email");
  await act(async () => root.render(<AuthLanguageProvider initialLocale="en"><VerifyEmailForm /></AuthLanguageProvider>));
  expect(node.querySelector("button")?.disabled).toBe(true);
  expect(node.textContent).toContain("Request a new verification email");
});
