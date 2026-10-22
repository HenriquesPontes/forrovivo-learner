import { createHash, createHmac } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";

/** Seed only the loopback fixture. This never calls a production or web password route.
 * Real provider verification is covered separately by OAuth unit tests and native Safari acceptance.
 */
export async function fixtureSession(request: APIRequestContext, email: string) {
  const provision = await request.post("http://127.0.0.1:4319/_test/provision", { data: { email, password: "fixture-password", displayName: "HTTP fixture learner" } });
  if (!provision.ok()) throw new Error("Fixture provisioning failed");
  const login = await request.post("http://127.0.0.1:4319/app/v1/auth/login", { data: { email, password: "fixture-password" } });
  if (!login.ok()) throw new Error("Fixture session failed");
  const data = await login.json();
  const hash = (value: string) => createHash("sha256").update(value).digest("hex");
  const value = `${hash(data.accountKey)}.${Date.now()}.${hash(data.token)}`;
  const signature = createHmac("sha256", "test-only-service-key").update(`forrovivo-learner-context:v1:${value}`).digest("hex");
  return { fv_learner_session: data.token as string, fv_learner_context: `${value}.${signature}` };
}
