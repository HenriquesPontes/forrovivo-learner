import { expect, it } from "vitest";
import { NextRequest } from "next/server";
import { learnerPageCsp } from "@/lib/csp";
import { proxy } from "@/proxy";

it("nonce-gates production scripts, allows provider frames and refuses caller-supplied policies", () => {
  const policy = learnerPageCsp("testnonce", false);
  expect(policy).toContain("'nonce-testnonce' 'strict-dynamic'");
  expect(policy).not.toContain("unsafe-eval");
  expect(policy.split(";").find(part => part.includes("script-src"))).not.toContain("unsafe-inline");
  expect(policy).toContain("frame-src https://accounts.google.com https://appleid.apple.com");
  const req = new NextRequest("https://learn.forrovivo.com/home", { headers: {
    "x-nonce": "attacker", "content-security-policy": "script-src 'unsafe-inline'",
  } });
  const a = proxy(req), b = proxy(req);
  expect(a.headers.get("content-security-policy")).not.toContain("attacker");
  expect(a.headers.get("content-security-policy")).not.toBe(b.headers.get("content-security-policy"));
  expect(a.headers.get("cache-control")).toBe("private, no-store");
});
