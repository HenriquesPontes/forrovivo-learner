/** Nonce-authorized Next scripts plus the existing Apple/Google sign-in providers. */
export function learnerPageCsp(nonce: string, development = process.env.NODE_ENV === "development") {
  return [
    "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://accounts.google.com/gsi/ https://appleid.cdn-apple.com${development ? " 'unsafe-eval'" : ""}`,
    // Existing React styles and the Google SDK require inline styles; scripts remain nonce-gated.
    "style-src 'self' 'unsafe-inline' https://accounts.google.com",
    "img-src 'self' data: blob: https://*.googleusercontent.com https://www.gstatic.com",
    "font-src 'self'", "connect-src 'self' https://accounts.google.com https://appleid.apple.com",
    "frame-src https://accounts.google.com https://appleid.apple.com",
    ...(!development ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export const LEARNER_API_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";
