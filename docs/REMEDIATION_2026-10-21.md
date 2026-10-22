# Learner remediation and re-audit — 21 October 2026

## Current source status — 22 October 2026

This update supersedes older current-state claims below; dated verification artifacts remain historical evidence. Learner source is at `99500aa`; Platform source is at `8fc4062`. Deployment mapping and external provider-console settings were not reverified in this update.

- All lessons require a validated account. `/try` clears the legacy guest cookie and redirects to `/`; `/home` and lesson pages reject non-account access. Legacy guest-progress helpers are not a public guest-learning entry.
- Learner defaults to Apple Services ID `com.forrovivo.learner.web` and return URL `https://learn.forrovivo.com/`. Platform production source configuration accepts that web audience alongside native Apple. On an origin other than the configured HTTPS origin, the Apple control links to the secure site. This does not certify the deployed code or a successful provider exchange.
- EN/PT support extends beyond authentication: the dashboard and lesson source use `LearnerLanguage`, `LearnerText` and the Portuguese copy map. Full translation, accessibility and visual acceptance remain unverified; do not describe the Academy as English-only or claim every string is translated.
- Fresh `npm test` execution passed **57 tests across seven files**. Earlier lint/build/typecheck, six-case HTTP suites and dependency inventories retain their original dates and source scope; they were not rerun for this documentation refresh.
- Responsive matrix and native Safari acceptance remain pending. The old 1135 × 853 login measurement predates later UI edits.
- No deployment, remote ledger inspection, real OAuth exchange or email delivery was performed in this documentation update. The recorded 21 October staging/production migration verification remains the latest inspected ledger evidence.

The Learner source now saves lesson progress, validates protected-page sessions, guards recovery/OAuth requests and provides profile, export and confirmed account deletion. This pass covers the full Learner checkout and its existing Platform contracts. Base commit: `cd451ab38050c596fb3b7906b442477bfe9f3f32`. The original source pass is historical; subsequent fixes are committed. Current deployment mapping is unverified.

Local validation passes: **46 regression/DOM tests, six HTTPS integration tests against the actual local Platform source, six against the standalone CI fixture, zero-warning lint, production build and typecheck**. Production dependencies report zero vulnerabilities. Native Safari and portable WebKit both fail before a page can open in this environment. Real web OAuth, mailbox recovery and deployment acceptance remain open. This is not a certification that every production flow works.

The subsequent [login design and social-sign-in pass](AUTH_UI_2026-10-21.md) implements the supplied layout reference in the public site's cartoon style, configures the existing Google web ID locally and adds provider/nonce/form regression coverage. Apple now defaults to the configured web Services ID; external acceptance remains open. Both controls remain visible, with missing providers clearly unavailable.

## Findings and changes

| Finding | Source remediation | Status and limits |
| --- | --- | --- |
| LEARN-01: lessons disappeared after navigation | Durable local results, course completion indicators, account outbox, explicit guest claim, cloud read/write confirmation and online/focus/manual retry | Regression and HTTPS API tests pass. Native Safari/browser storage acceptance is blocked. |
| Native progress compatibility | Existing `/app/v1/progress`, `path_uN`, contiguous lesson counts and best score; native snapshot fields retained; replay is idempotent | No new backend/database contract. Six local Worker integration checks pass. Concurrent non-course fields retain the existing snapshot last-write-wins limitation. |
| LEARN-02: any nonempty cookie unlocked account pages | Backend validation before page access, invalid-cookie clearing, unavailable-service error boundary and signed session context | Arbitrary/expired/revoked/banned/error responses are covered with fixtures. Valid legacy web sessions reauthenticate once; HTTP redirect-loop regression passes. Backend outage does not silently turn into account access. |
| Stale tabs and account changes | Progress GET/POST, profile updates, export and deletion bind to the signed account scope that opened the page | A pending save for account A is rejected after cookies change to account B. No bearer token is sent as a component prop or stored in browser storage. |
| LEARN-03: web/native identity confusion | Provider-specific identity messaging on registration/account screens; explicit guest-to-account action; email accounts described as website-only | Verified identity linking remains backend work. Same email text does not link providers. Full device restore is not certified. |
| LEARN-04: incomplete social integration | Optional Apple/Google buttons mounted; independent SDK loading; challenge nonce, issuer, configured web audience and Apple state guards; backend signature verification remains authoritative | Optional buttons are disabled without public IDs. Existing native profile/name/language is preserved on login. Real provider dashboards, Apple grouping and signed-token acceptance still require staging verification. |
| LEARN-05: missing account lifecycle | `/account`, profile preferences, six-language cloud-snapshot export, password-confirmed email deletion and recent-auth social deletion | Uses existing backend erasure. Export is profile plus cloud study snapshots, not feedback/reports. Browser logout does not revoke a server session; no current-device revocation API exists. |
| LEARN-06: wrong Play Store package | `com.telanon.forrovivo` used consistently in Learner CTAs | Source corrected; store-binary/device acceptance is outside this pass. |
| AUTH-01: false reset success / unusable links | Complete sender/service configuration checked before requesting a token; canonical reset origin; token and recipient validation; skipped/failed delivery returns failure; no PII/reset-link logging | Missing configuration and provider failures are tested. Platform source ownership fixes must be deployed. A mail outage after a trusted token replacement still needs a coordinated outbox/retry design. |
| Recovery lost behind stale cookies | Forgot/reset pages remain public; reset links set `Referrer-Policy: no-referrer` | HTTP stale-cookie recovery test passes. No real reset email was sent in this pass. |
| Auth proxy error handling | Same-origin writes, actual streamed body limits, JSON shape checks, bounded timeouts, no redirects, strict session envelopes, safe public errors, lockout/error status preservation | Tests cover malformed/large requests, cross-origin attempts, backend outages, invalid sessions and non-success responses. Registration `pending` copy no longer promises an email. |
| WEB-03 / QUALITY-01: no meaningful Learner test gate | Vitest route/progress tests, React DOM lesson/auth/provider tests, production HTTPS integration harness, five WebKit browser cases and CI checks | 46 tests plus both six-case HTTP suites pass locally. Browser cases could not reach a page. Remote CI has not run in this pass. |
| Quiz lint and hydration | Stable keyed quiz initialization; mount quiz after progress hydration; deduplicated options; save failure/retry messages; sequential lesson unlock | Zero-warning lint and DOM tests pass. No invented language data added. |
| WEB-04: font host required during build | Licensed variable Source Sans 3 bundled with provenance; `next/font/local`; lockfile install and explicit Webpack build | Production build passes without the previous Google font download. OFL and upstream SHA-256 records are included. |
| Health configuration drift | Health checks use configured backend and validate response bodies/database readiness | Local Worker HTTPS health assertion and six public live GET checks pass. Health does not prove all authenticated flows. |

## Verification evidence

| Check | Result | Evidence |
| --- | --- | --- |
| `npm test` | 46 passed across five files | [Final source checks](SOURCE_VERIFICATION_2026-10-21.json) |
| `npm run lint -- --max-warnings=0` | Passed, no warnings | Same source-check record |
| `npm run build` | Next 16.4.1 / React 19.2.8, Webpack production build passed | Same source-check record |
| `npm run typecheck` | Passed after build regenerated route types | Same source-check record |
| HTTPS integration against actual local Platform | Six passed; Hono routes, temporary SQLite, all 19 source migrations; synthetic identities/catalog only | [Local Platform evidence](LOCAL_PLATFORM_VERIFICATION_2026-10-21.json) |
| Independent Learner CI fixture HTTPS integration | Six passed | [Standalone fixture evidence](STANDALONE_FIXTURE_VERIFICATION_2026-10-21.json) |
| Native Safari 27.0.1 | Blocked before page startup | Safari exists, but both driver modes exited 1; LaunchServices returned `-10827 kLSNoExecutableErr`. Cause is not established as a specific Safari setting. |
| Playwright WebKit 27.2 | Blocked before page startup | Browser process aborted with exit 134. One runner failure and four unrun cases are recorded in local evidence; these are not passing browser checks. |
| Existing live Learner, read-only | Six public checks passed | [Production GET evidence](PRODUCTION_READ_ONLY_VERIFICATION_2026-10-21.json). Checks target the existing deployed version, not these source changes. |
| Live catalog through new parser | All 358 rows accepted; 15 units, 75 levels; `path_u1` through `path_u15` | [Catalog metadata](CATALOG_COMPATIBILITY_2026-10-21.json). No linguistic rows copied into this repo. |
| Local review server | Started at `http://localhost:3002`; root and configured backend health return 200 | [Local preview evidence](LOCAL_PREVIEW_2026-10-21.json). Turbopack's FSEvent stream cannot start on this host; Webpack with polling starts successfully. Safari still cannot launch. |
| Production dependency audit | Zero vulnerabilities | [Production inventory](PRODUCTION_DEPENDENCY_AUDIT_2026-10-21.json) |
| Full dependency audit | Five high-severity affected development package nodes in one unpatched `braces` dependency chain | [Full inventory](FULL_DEPENDENCY_AUDIT_2026-10-21.json) |

The six HTTPS cases cover invalid/stale cookies and recovery, sequential native progress/replay, legacy-session reauthentication, failed writes and cross-account isolation, profile/export/password-confirmed erasure, and cross-origin rejection without logout plus health/missing email configuration. Test cookie forwarding asserts cookie flags but does not replace a real browser's transport, storage or SameSite behavior.

The full audit follows `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`. [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) lists no patched `braces` release at verification time. npm proposes downgrading the Next lint config to 14.2.35; that would mismatch installed Next 16 tooling and was not applied. This dependency inventory is not clean overall. Production dependencies audit clean; development tools must continue to process trusted repository configuration until an upstream compatible fix is available.

## Account and native compatibility details

- Session tokens remain opaque Platform tokens. The new `fv_learner_context` is an HttpOnly, production-Secure, SameSite=Lax HMAC cookie bound to the token and verified account key. `LEARNER_WEB_SERVICE_KEY` must be configured before login/register/reset/OAuth can issue sessions. Missing signer configuration fails before the corresponding upstream mutation.
- Browser progress is separated by a hash of the account key. Guest results remain separate until explicitly claimed. Web Locks serialize local storage commits where supported. Confirmed outbox removal only removes the exact submitted result, preserving newly queued lessons.
- Existing valid web sessions without a signed context redirect to `/reauthenticate`. Signing in restores access and the stable account cache; no native token migration is required. Changing the signing key also prompts web reauthentication.
- Web saves a contiguous count and first-attempt score, with the best replay score retained. Completing lesson 3 without lessons 1 and 2 is rejected. Web does not award native XP, streaks, hearts, mastery or SRS activity.
- Full native snapshots are read before course updates. Native profile, SRS, mistakes, bookmarks and other fields are retained; update timestamps reflect activity. Counts/scores use the existing monotonic backend merge. Native metadata changed after the read can still follow last-write-wins behavior; a partial-update/CAS backend contract is needed to eliminate that race.
- Email deletion validates password proof against the original signed account scope, preventing a mutable contact email from selecting another account. Social deletion requires signed authentication within five minutes. Failure does not report deletion or clear the cache.
- Recovery accepts only the canonical configured HTTPS origin, or loopback HTTP in development. No provider response, recipient, bearer or reset URL is logged. Provider delivery success has not been checked against a real mailbox here.

## Remaining gaps and release gates

1. **Backend release first.** Platform source hardening has not been deployed; its authorized D1 migration rollout is complete. Expired Wrangler OAuth / Worker API 403 and staging public-route failures remain in the [Platform rollout record](../../forrovivo-platform/docs/ROLLOUT_2026-10-21.md). Release the hardened backend to staging, pass its acceptance checks, then production before relying on its security closures from this portal.
2. **Staged Learner acceptance.** Configure the signer/service key, canonical origins, verified Resend sender and chosen public OAuth audiences in the intended environment. Staging must use its own backend/secrets. The local environment now uses the existing Google web ID; Google console origin approval remains unverified. Apple now uses `com.forrovivo.learner.web`; verify the configured secure return origin and deployed backend audience. Rebuild after changing public IDs.
3. **Native Safari acceptance.** Open the staged portal in native Safari and execute unauthenticated lesson rejection, account save/refresh, logout/another-account isolation, failed sync/retry, old-session upgrade, reset links and profile/export/deletion. Check mobile layout, keyboard access and screen-reader behavior. Portable WebKit CI remains an additional gate; it is not native Safari proof. This session cannot open either browser runtime.
4. **Real web OAuth and email.** Verify Google web origin/audience, Apple Services ID/return URL/grouping and supported same-provider native restore. Exercise password creation, reset receipt, single use, expiry and session invalidation with controlled test identities. The user's earlier manual success report does not establish every provider/recovery case.
5. **AUTH-03: mailbox ownership.** New email registrations still receive immediate sessions under the current backend contract. Enumeration-resistant signup and mailbox-verification policy need coordinated Platform and Learner work; wording alone does not close this finding.
6. **Delivery and concurrency contracts.** Coordinate durable reset delivery/retry before claiming a previous reset link survives mail-provider failure. Add partial progress updates if simultaneous native SRS/bookmark changes must be conflict-proof. Add current-device revocation and verified identity linking if those features are selected.
7. **Product scope.** Login and registration now support English and Portuguese through a saved browser preference. Dashboard and lesson source now include EN/PT copy; complete translation acceptance remains open. The account interface preference is separate metadata, not proof of a fully translated portal. Audio, SRS, mistake review, XP, streaks and other native features are not implemented here. Do not invent linguistic content to complete those features.
8. **Development dependency advisory.** Track a compatible upstream fix for the unpatched `braces` chain and rerun the full inventory. Production-only audit success does not close this issue.

## Release and rollback procedure

Keep the previous Vercel deployment available. After backend and staging gates pass, deploy this reviewed Learner source with the documented configuration. Expect one reauthentication for legacy web sessions. Run the public health check and controlled account/access-gate/recovery/provider journeys before widening use; confirm completion on a supported native client without losing its existing snapshot fields.

If acceptance fails, restore the previous Vercel deployment. This Learner change creates no database migration and changes no native endpoint or token format. Cloud completions already acknowledged remain in the existing store. Keep the signed-in browser cache/outbox when diagnosing a failed sync; clearing site storage discards unsynced lessons. A rollback may temporarily restore the earlier portal's lack of durable web-progress behavior, so it is a recovery step rather than a closure of the original findings.

No real learner accounts were created, changed or deleted, no real email was sent, and no catalog content or production settings were written during this Learner pass. Earlier authorized Platform migrations are recorded separately. No Git commit, push, Vercel deployment or Worker deployment was performed.

## Documentation follow-up — 22 October 2026

The [auth UI record](AUTH_UI_2026-10-21.md#documentation-follow-up--22-october-2026) now records the requested text removals, centered footer and compact registration/email spacing. It includes the outstanding EN/PT login/registration viewport matrix. Screen-size acceptance remains open; no new browser matrix, automated suite, real OAuth/email flow or deployment is certified by this documentation update. Historical verification files remain unchanged so their timestamps and evidence scope are preserved.

## Acceptance follow-up — 22 October 2026

Portuguese recovery forms now localize their email/password placeholders and common service-unavailable/reload/deletion-confirmation messages. Fresh validation passes: **59 tests in eight files**, zero-warning lint, production Webpack build, typecheck, six fixture HTTPS checks and six checks against actual local Platform routes. See [acceptance evidence](LEARNER_ACCEPTANCE_2026-10-22.json). No production accounts, emails or deployments were changed.

The new `e2e/responsive.spec.ts` defines **104 cases**: 26 CSS viewports × login/registration × EN/PT. It checks horizontal control clipping, registration email spacing, input focus/reachability and footer access; short-screen vertical scrolling remains allowed. Provider SDK requests are blocked, so this tests fallback layout rather than real Google/Apple button rendering. Run after a production build with `npx playwright test e2e/responsive.spec.ts`.

Execution was attempted with fail-fast: the first case failed during WebKit launch (exit 134), before any page/layout assertion; 103 cases did not run. Native `safaridriver --port 4327` also exited 1 before page startup. These are environment blockers, not passing layout checks or diagnosed page defects. Physical devices, mobile keyboard, zoom, screen-reader behavior, real provider exchanges and real reset delivery remain acceptance gates. Existing social tests use synthetic provider callbacks; they do not prove production provider-console configuration.

## Account flow follow-up — 22 October 2026

New registration now returns a uniform pending response, delivers a mailbox-verification link and requires the original signup password on `/verify-email`. Verification does not log in automatically or change existing credentials. Fresh checks: **66 Learner tests**, lint/build/typecheck, seven fixture HTTPS cases and seven actual-local-Platform cases pass; Platform has **32 tests** and 28 OpenAPI operations. Migration **0020 is not applied remotely**. Real mail/device acceptance and deployment remain open. See [account implementation and rollout](ACCOUNTS_2026-10-22.md).
