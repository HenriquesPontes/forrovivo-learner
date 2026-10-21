import { authResponse, learnOrigin, resetDeliveryConfigured, sendPasswordResetEmail, serviceKeyHeaders, requireWebSessionConfiguration } from "@/lib/auth";
import { backend, BackendError } from "@/lib/backend";
import { json, readJson, RequestError, routeError } from "@/lib/http";
import { validateEmail, validatePassword } from "@/lib/validation";

export async function passwordAuth(request: Request, mode: "login" | "register" | "reset-password") {
  try {
    const body = await readJson(request);
    requireWebSessionConfiguration();
    const password = typeof body.password === "string" ? validatePassword(body.password) : null;
    if (!password) throw new RequestError(400, "Use a password between 8 and 128 characters.");
    const payload: Record<string, string> = { password };
    if (mode === "reset-password") {
      if (typeof body.token !== "string" || !/^fv_reset_[a-f0-9]{48}$/.test(body.token)) {
        throw new RequestError(400, "This reset link is invalid or has expired.");
      }
      payload.token = body.token;
    } else {
      const email = typeof body.email === "string" ? validateEmail(body.email) : null;
      if (!email) throw new RequestError(400, "Enter a valid email.");
      payload.email = email;
      if (mode === "register") {
        const name = typeof body.displayName === "string" ? body.displayName.trim() : "";
        if (name.length > 120 || /[\u0000-\u001f\u007f]/.test(name)) throw new RequestError(400, "Enter a name of at most 120 characters.");
        payload.displayName = name;
      }
    }
    const data = await backend(`/app/v1/auth/${mode}`, { method: "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (mode === "register" && data.pending === true) {
      return json({ status: "ok", pending: true,
        message: "This address may already have an account. Try logging in, or request a password reset." });
    }
    return await authResponse(data);
  } catch (error) {
    if (error instanceof BackendError && [400, 401].includes(error.status)) {
      return json({ status: "error", message: mode === "reset-password" ? "This reset link is invalid or has expired." :
        mode === "login" ? "Email or password is incorrect." : "Could not create the account. Please try again." }, error.status);
    }
    return routeError(error);
  }
}

export async function forgotPassword(request: Request) {
  try {
    const body = await readJson(request);
    const email = typeof body.email === "string" ? validateEmail(body.email) : null;
    if (!email) throw new RequestError(400, "Enter a valid email.");
    // Check the complete delivery configuration before replacing any reset token.
    if (!resetDeliveryConfigured()) throw new RequestError(503, "Password reset is unavailable. Please try again later.");
    const origin = learnOrigin();
    const data = await backend("/app/v1/auth/forgot-password", { method: "POST", headers: {
      "Content-Type": "application/json", ...serviceKeyHeaders(),
    }, body: JSON.stringify({ email }) });
    if (data.resetToken !== undefined) {
      if (typeof data.resetToken !== "string" || !/^fv_reset_[a-f0-9]{48}$/.test(data.resetToken) ||
        typeof data.email !== "string" || validateEmail(data.email) !== email) {
        throw new RequestError(502, "Could not start password reset. Please try again.");
      }
      const mail = await sendPasswordResetEmail({ to: email,
        resetUrl: `${origin}/reset-password?token=${encodeURIComponent(data.resetToken)}` });
      if (mail !== "sent") throw new RequestError(503, "Could not send the reset email. Please try again.");
    }
    return json({ status: "ok", message: "If an account exists for that email, we sent reset instructions." });
  } catch (error) { return routeError(error); }
}
