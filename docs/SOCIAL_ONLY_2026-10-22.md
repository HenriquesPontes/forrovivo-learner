# Social-only web authentication — 22 October 2026

Requested: align Learner login/signup with native social sign-in while preserving the existing design.

- Removed email/password login and signup forms. Apple/Google retain the original provider buttons, cream/green palette, font, leafy card, title and language switch.
- Retired password login, registration, reset requests, reset consumption and email verification POST routes with HTTP 410. They never read credentials, call upstream, deliver email or mutate sessions.
- Old recovery/verification page URLs redirect to social sign-in. Social errors no longer suggest email as an alternative.
- Social reauthentication and OAuth nonce/audience/Worker verification remain in place.
- No account data deletion, automatic email-based identity linking, Worker change or schema migration. Authenticated legacy email accounts retain export/profile and password-confirmed erasure for data management; they cannot sign in again by password.
- Regression coverage verifies both locales/login/signup shells, provider retries and OAuth boundaries, all retired API endpoints, redirect aliases, and existing profile/progress safeguards. HTTPS/browser fixtures seed isolated synthetic sessions directly against the loopback test API rather than using removed web password routes. This is test-only code, not a production auth bypass or real-provider test.

Validation: 57 unit/component tests passed; lint, production build and typecheck passed. HTTP/Playwright startup is blocked by host socket policy (`listen EPERM 127.0.0.1:4319`); no browser-suite pass is claimed. Production acceptance will be recorded after deployment.
