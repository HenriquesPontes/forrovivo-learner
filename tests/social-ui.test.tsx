// @vitest-environment jsdom
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";

const setup = vi.hoisted(() => ({ google: "", apple: "", replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => setup }));
vi.mock("@/lib/constants", () => ({
  get GOOGLE_WEB_CLIENT_ID() { return setup.google; },
  get APPLE_WEB_CLIENT_ID() { return setup.apple; },
  APPLE_WEB_REDIRECT_URI: "https://learn.example.test/",
  SITE_URL: "https://site.example.test",
}));
import { SocialSignIn } from "@/components/SocialSignIn";
import { AuthForm } from "@/components/AuthForm";
import { AuthLanguageProvider } from "@/components/AuthLanguage";
import { AuthScreen } from "@/components/AuthScreen";

const nonce = "c".repeat(64);
let root: Root;
let node: HTMLDivElement;
let callback: (response: { credential?: string }) => void;
const initialize = vi.fn((config: { nonce: string; client_id: string; callback: typeof callback }) => { callback = config.callback; });
const renderButton = vi.fn((parent: HTMLElement, options: { width: number }) => {
  void options;
  const button = document.createElement("button");
  button.textContent = "Continue with Google";
  parent.appendChild(button);
});
const appleInit = vi.fn();
const appleSignIn = vi.fn();
const fetcher = vi.fn<typeof fetch>();

function googleSdk() {
  window.google = { accounts: { id: { initialize, renderButton } } };
}
function appleSdk() { window.AppleID = { auth: { init: appleInit, signIn: appleSignIn } }; }
async function mount() { await act(async () => { root.render(<SocialSignIn />); }); }
async function click(label: string) {
  const button = [...node.querySelectorAll("button")].find(item => item.textContent === label);
  expect(button).toBeTruthy();
  await act(async () => { button!.click(); });
}
async function fill(name: string, value: string) {
  const input = node.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  setup.google = ""; setup.apple = "";
  delete window.google; delete window.AppleID;
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  fetcher.mockImplementation(async (path) => path === "/api/auth/challenge" ? Response.json({ nonce }) : Response.json({ status: "ok" }));
  vi.stubGlobal("fetch", fetcher);
  node = document.createElement("div"); document.body.appendChild(node); root = createRoot(node);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  node.remove(); delete window.google; delete window.AppleID;
  vi.unstubAllGlobals();
});

it("hides unconfigured providers without showing dead buttons or loading SDKs", async () => {
  await mount();
  expect(node.querySelector("section")).toBeNull();
  expect(fetcher).not.toHaveBeenCalled();
});

it("keeps Apple disabled beside Google until Apple web sign-in is configured", async () => {
  setup.google = "fixture-google-web"; googleSdk();
  await mount();
  expect(node.textContent).toContain("Continue with Google");
  expect(node.querySelector<HTMLButtonElement>(".social-apple")?.disabled).toBe(true);
  expect(node.querySelector("#apple-signin-unavailable")).toBeTruthy();
});

it("uses Google's official rendered button and nonce, navigating only after server success", async () => {
  setup.google = "fixture-google-web"; googleSdk();
  await mount();
  expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ client_id: setup.google, nonce, auto_select: false }));
  expect(renderButton).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ size: "large", text: "continue_with", width: expect.any(Number) }));
  expect(renderButton.mock.calls[0][1].width).toBeLessThan(200);
  expect(node.textContent).not.toContain("Google sign-in is currently unavailable.");
  await act(async () => { callback({ credential: "fixture-google-jwt" }); });
  expect(fetcher).toHaveBeenCalledWith("/api/auth/oauth", expect.objectContaining({ body: JSON.stringify({ idToken: "fixture-google-jwt" }) }));
  expect(setup.replace).toHaveBeenCalledWith("/home");
  expect(setup.refresh).toHaveBeenCalledOnce();
});

it("shares one nonce request across Strict Mode mounts, keeping the SDK and cookie aligned", async () => {
  setup.google = "fixture-google-web"; googleSdk();
  await act(async () => { root.render(<StrictMode><SocialSignIn /></StrictMode>); });
  expect(fetcher.mock.calls.filter(([path]) => path === "/api/auth/challenge")).toHaveLength(1);
  expect(initialize).toHaveBeenCalledOnce();
  expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ nonce }));
});

it("does not navigate after failed OAuth and renews the challenge for retry", async () => {
  setup.google = "fixture-google-web"; googleSdk();
  fetcher.mockImplementation(async path => path === "/api/auth/challenge" ? Response.json({ nonce }) : Response.json({ status: "error", message: "Sign-in expired." }, { status: 401 }));
  await mount();
  await act(async () => { callback({ credential: "fixture-google-jwt" }); });
  expect(node.textContent).toContain("Sign-in expired.");
  expect(setup.replace).not.toHaveBeenCalled();
  expect(fetcher.mock.calls.filter(([path]) => path === "/api/auth/challenge")).toHaveLength(2);
});

it("binds Apple's popup to nonce/state and submits the returned identity token", async () => {
  setup.apple = "com.example.fixture.web"; appleSdk();
  appleSignIn.mockResolvedValue({ authorization: { id_token: "fixture-apple-jwt", state: nonce } });
  await mount();
  expect(appleInit).toHaveBeenCalledWith(expect.objectContaining({ clientId: setup.apple, nonce, state: nonce, usePopup: true, redirectURI: "https://learn.example.test/" }));
  await click("Continue with Apple");
  expect(fetcher).toHaveBeenCalledWith("/api/auth/oauth", expect.objectContaining({ body: JSON.stringify({ idToken: "fixture-apple-jwt" }) }));
  expect(setup.replace).toHaveBeenCalledWith("/home");
});

it("rejects an Apple state mismatch before sending a token to the server", async () => {
  setup.apple = "com.example.fixture.web"; appleSdk();
  appleSignIn.mockResolvedValue({ authorization: { id_token: "fixture-apple-jwt", state: "wrong" } });
  await mount(); await click("Continue with Apple");
  expect(node.textContent).toContain("Apple sign-in was cancelled or failed.");
  expect(fetcher.mock.calls.some(([path]) => path === "/api/auth/oauth")).toBe(false);
  expect(setup.replace).not.toHaveBeenCalled();
});

it("a failed Apple SDK does not block Google, and retry can recover Apple", async () => {
  setup.google = "fixture-google-web"; setup.apple = "com.example.fixture.web"; googleSdk();
  await mount();
  const script = [...document.querySelectorAll("script")].find(item => item.src.startsWith("https://appleid.cdn-apple.com/"));
  expect(script).toBeTruthy();
  await act(async () => { script!.dispatchEvent(new Event("error")); });
  expect(node.textContent).toContain("A sign-in provider could not load.");
  expect(initialize).toHaveBeenCalledOnce();
  appleSdk(); await click("Retry social sign-in");
  expect(appleInit).toHaveBeenCalledOnce();
  expect([...node.querySelectorAll("button")].find(button => button.textContent === "Continue with Apple")?.disabled).toBe(false);
});

it("the cartoon form can reveal a password without submitting or losing the login values", async () => {
  await act(async () => { root.render(<AuthForm mode="login" appearance="cartoon" showAccountLink={false} />); });
  await fill("email", "fixture@example.test"); await fill("password", "fixture-password");
  await act(async () => { node.querySelector<HTMLButtonElement>('[aria-label="Show password"]')!.click(); });
  expect(node.querySelector<HTMLInputElement>('input[name="password"]')?.type).toBe("text");
  expect(node.querySelector<HTMLInputElement>('input[name="password"]')?.value).toBe("fixture-password");
  expect(fetcher).not.toHaveBeenCalled();
  await act(async () => { node.querySelector<HTMLButtonElement>('[aria-label="Hide password"]')!.click(); });
  expect(node.querySelector<HTMLInputElement>('input[name="password"]')?.type).toBe("password");
  await act(async () => { node.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  expect(fetcher).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({ body: JSON.stringify({ email: "fixture@example.test", password: "fixture-password" }) }));
  expect(setup.replace).toHaveBeenCalledWith("/home");
});

it("pending registration stays on the form and does not invent a sent email", async () => {
  fetcher.mockResolvedValue(Response.json({ status: "ok", pending: true }));
  await act(async () => { root.render(<AuthForm mode="register" appearance="cartoon" showAccountLink={false} />); });
  await fill("email", "fixture@example.test"); await fill("password", "fixture-password");
  await act(async () => { node.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  expect(node.textContent).toContain("This email may already have an account.");
  expect(node.textContent).not.toContain("Check your email");
  expect(setup.replace).not.toHaveBeenCalled();
});

it("switches between English and Portuguese without losing typed credentials", async () => {
  await act(async () => { root.render(<AuthLanguageProvider initialLocale="en"><AuthScreen mode="login" className="test-font" /></AuthLanguageProvider>); });
  await fill("email", "fixture@example.test"); await fill("password", "fixture-password");
  expect(node.textContent).toContain("All rights reserved.");
  expect(node.textContent).not.toContain("LIVLU Studio");
  await click("PT");
  expect(node.querySelector("h1")?.textContent).toBe("Entrar");
  expect(node.textContent).toContain("Todos os direitos reservados.");
  expect(node.querySelector(".auth-brand")?.getAttribute("href")).toBe("/home");
  expect(node.textContent).toContain("Palavra-passe");
  expect(node.querySelector(".auth-social")).toBeNull();
  expect(node.textContent).not.toContain("Use the same provider");
  expect(node.textContent).not.toContain("Back to website");
  expect(document.documentElement.lang).toBe("pt-PT");
  expect(document.cookie).toContain("fv_learner_locale=pt");
  expect(node.querySelector<HTMLInputElement>('input[name="password"]')?.value).toBe("fixture-password");
  await click("EN");
  expect(node.querySelector("h1")?.textContent).toBe("Log in");
  expect(node.querySelector<HTMLInputElement>('input[name="email"]')?.value).toBe("fixture@example.test");
});

it("Portuguese sign-in errors are localized and do not navigate", async () => {
  fetcher.mockResolvedValue(Response.json({ status: "error", message: "Email or password is incorrect." }, { status: 401 }));
  await act(async () => { root.render(<AuthLanguageProvider initialLocale="pt"><AuthForm mode="login" appearance="cartoon" /></AuthLanguageProvider>); });
  await fill("email", "fixture@example.test"); await fill("password", "fixture-password");
  await act(async () => { node.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  expect(node.querySelector('[role="alert"]')?.textContent).toBe("E-mail ou palavra-passe incorretos.");
  expect(setup.replace).not.toHaveBeenCalled();
});

it("Portuguese registration localizes labels and the pending-account message", async () => {
  fetcher.mockResolvedValue(Response.json({ status: "ok", pending: true, message: "This address may already have an account." }));
  await act(async () => { root.render(<AuthLanguageProvider initialLocale="pt"><AuthScreen mode="register" className="test-font" /></AuthLanguageProvider>); });
  expect(node.querySelector("h1")?.textContent).toBe("Criar conta");
  expect(node.textContent).toContain("Nome");
  expect(node.textContent).toContain("opcional");
  await fill("email", "fixture@example.test"); await fill("password", "fixture-password");
  await act(async () => { node.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  expect(node.querySelector('[role="status"]')?.textContent).toContain("Este e-mail poderá já ter uma conta.");
  expect(setup.replace).not.toHaveBeenCalled();
});
