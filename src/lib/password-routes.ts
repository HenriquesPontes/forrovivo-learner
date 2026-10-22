import { json } from "@/lib/http";

/** Retired web password endpoints. Social identities are never linked by email. */
function retiredPasswordSignIn() {
  return json({ status: "error", message: "Email and password sign-in is no longer available. Continue with Apple or Google using the same account as the app." }, 410);
}

export async function passwordAuth(_request: Request, _mode: "login" | "register" | "reset-password") {
  void _request; void _mode;
  return retiredPasswordSignIn();
}
export async function forgotPassword(_request: Request) {
  void _request;
  return retiredPasswordSignIn();
}
export async function verifyEmail(_request: Request) {
  void _request;
  return retiredPasswordSignIn();
}
