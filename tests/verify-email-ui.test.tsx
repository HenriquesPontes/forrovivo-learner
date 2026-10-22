import { expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
import Forgot from "@/app/forgot-password/page";
import Reset from "@/app/reset-password/page";
import Verify from "@/app/verify-email/page";
it.each([Forgot, Reset, Verify])("old password links redirect to social sign-in without consuming tokens", page => {
  expect(() => page()).toThrow("REDIRECT:/");
});
