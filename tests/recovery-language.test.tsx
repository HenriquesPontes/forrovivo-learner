// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AuthLanguageProvider } from "@/components/AuthLanguage";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
let root: Root;
let node: HTMLDivElement;
beforeEach(() => { node = document.createElement("div"); document.body.append(node); root = createRoot(node); });
afterEach(() => { act(() => root.unmount()); node.remove(); vi.unstubAllGlobals(); });

it("localizes reset placeholders and invalid-link guidance in Portuguese", async () => {
  await act(async () => root.render(<AuthLanguageProvider initialLocale="pt"><ResetPasswordForm token="synthetic-token" /></AuthLanguageProvider>));
  expect([...node.querySelectorAll("input")].map(input => input.placeholder)).toEqual(["Palavra-passe", "Palavra-passe"]);
  await act(async () => root.render(<AuthLanguageProvider initialLocale="pt"><ResetPasswordForm token="" /></AuthLanguageProvider>));
  expect(node.querySelector('[role="alert"]')?.textContent).toContain("inválida ou expirou");
  expect(node.textContent).toContain("Pedir uma nova ligação");
});

it("localizes a recovery service failure without claiming delivery", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ status: "error", message: "The service is unavailable. Please try again." }) }));
  await act(async () => root.render(<AuthLanguageProvider initialLocale="pt"><ForgotPasswordForm /></AuthLanguageProvider>));
  expect(node.querySelector("input")?.placeholder).toBe("tu@exemplo.com");
  await act(async () => { node.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  expect(node.querySelector('[role="alert"]')?.textContent).toBe("O serviço está indisponível. Tenta novamente.");
  expect(node.textContent).not.toContain("enviámos");
});
