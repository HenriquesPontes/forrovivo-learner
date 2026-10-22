// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://learn.example.test/"}
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";

const setup = vi.hoisted(() => ({ google: "", apple: "", appleRedirect: "https://learn.example.test/", replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => setup }));
vi.mock("@/lib/constants", () => ({
  get GOOGLE_WEB_CLIENT_ID() { return setup.google; },
  get APPLE_WEB_CLIENT_ID() { return setup.apple; },
  get APPLE_WEB_REDIRECT_URI() { return setup.appleRedirect; },
  SITE_URL: "https://site.example.test",
}));
import { SocialSignIn } from "@/components/SocialSignIn";
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
beforeEach(() => {
  vi.clearAllMocks();
  setup.google = ""; setup.apple = ""; setup.appleRedirect = "https://learn.example.test/";
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

it("login retains the cartoon shell with only social sign-in in both languages", async () => {
  setup.google = "fixture-google-web"; setup.apple = "com.example.fixture.web";
  googleSdk(); appleSdk();
  await act(async () => { root.render(<AuthLanguageProvider initialLocale="en"><AuthScreen className="test-font" /></AuthLanguageProvider>); });
  expect(node.querySelector(".auth-card")).toBeTruthy();
  expect(node.querySelector(".auth-sign")).toBeTruthy();
  expect(node.querySelector("input, form")).toBeNull();
  expect(node.querySelector('a[href="/forgot-password"]')).toBeNull();
  expect(node.textContent).toContain("Continue with Apple");
  expect(node.textContent).toContain("Continue with Google");
  expect(node.textContent).not.toContain("Or continue with");
  await click("PT");
  expect(node.querySelector("h1")?.textContent).toBe("Entrar");
  expect(node.textContent).not.toContain("Ainda não tens conta");
  expect(node.textContent).not.toContain("Criar conta");
  expect(node.querySelector('a[href="/create-account"]')).toBeNull();
  expect(node.querySelector('input[type="password"]')).toBeNull();
  expect(node.textContent).toContain("Continua com Apple ou Google.");
  expect(node.textContent).toContain("Todos os direitos reservados.");
  expect(document.documentElement.lang).toBe("pt-PT");
  expect(node.querySelector("input, form")).toBeNull();
  expect(node.querySelector(".auth-brand")?.getAttribute("href")).toBe("/home");
});

it("uses the registered secure site instead of starting an Apple popup on a different origin", async () => {
  setup.apple = "com.example.fixture.web";
  setup.appleRedirect = "https://learn.forrovivo.com/";
  appleSdk();
  await mount();
  expect(appleInit).not.toHaveBeenCalled();
  expect(node.querySelector('a[href="https://learn.forrovivo.com/"]')?.textContent).toContain("Continue with Apple");
  expect(node.textContent).not.toContain("Opens the secure site for Apple sign-in.");
  expect(node.textContent).not.toContain("Abre o site seguro para entrar com Apple.");
});
