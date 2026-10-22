# ForroVivo Learner

Web Academy at [learn.forrovivo.com](https://learn.forrovivo.com), deployed through the `forrovivo-learner` Vercel project. The iOS and Android apps remain the primary learning surfaces. Catalog, learner accounts and cloud progress use the existing Platform `/app/v1` API.

A validated account is required for every lesson; lessons within each unit unlock in order. The catalog inspected on 21 October contains 15 units, 75 levels and 358 phrases. Linguistic content stays in Research and the remote catalog.

The [21 October remediation report](docs/REMEDIATION_2026-10-21.md) records the source changes, verification and remaining release gates. See the [22 October current status](docs/CURRENT_STATUS_2026-10-22.md) for subsequent committed changes and fresh test results. Deployment mapping has not been reverified.

## Accounts and progress

The public guest-learning entry is retired. Account results first enter an account-specific local outbox, then sync to the existing cloud progress API. Failed syncs remain available for retry. Legacy guest-progress handling remains in source; it does not enable anonymous lessons. The browser cache contains completion counts and scores, with no bearer token.

Cloud lessons use the native `path_uN` IDs and contiguous `completedLessonCount`. Replays do not inflate completion. Web preserves the existing native snapshot fields and updates lesson counts/scores; the backend merges those counts monotonically. Other snapshot fields still use the backend's existing last-write-wins policy. Concurrent native SRS/bookmark edits need a coordinated partial-update API for stronger conflict protection.

Apple and Google identities remain provider-specific. Use the same supported provider to access the same account on web and native. Web sign-in and signup use Apple and Google only. Matching an email address does not link distinct identities. Existing email account data is retained; authenticated legacy users can still export/manage their data. iOS and Android support different provider sets. Provider dashboard configuration and real web OAuth acceptance remain release requirements.

Protected pages validate the session against Platform. A signed HttpOnly context cookie binds browser progress and account actions to the account that opened the page, preventing stale tabs from saving into another account. Existing web sessions without this context must sign in once after rollout. Native session tokens and APIs are unchanged. Signing-key rotation also requires web reauthentication.

## Routes

| Route | Purpose |
| --- | --- |
| `/`, `/login` | Email login; configured Apple/Google sign-in |
| `/try` | Clear the legacy guest cookie and redirect to login |
| `/home` | Course map and sync status |
| `/academy/[unit]/[level]` | Lesson quiz and durable completion |
| `/create-account` | Apple and Google signup, using the existing cartoon shell |
| `/forgot-password`, `/reset-password` | Retired password pages redirect to social sign-in |
| `/account` | Profile preference, private cloud-data export and confirmed deletion |
| `/reauthenticate` | Upgrade an existing web session or refresh sensitive-action authentication |
| `/api/auth/*` | OAuth/session handlers; retired password POST endpoints return 410 without upstream requests |
| `/api/progress` | Authenticated, account-bound native progress proxy |
| `/api/account`, `/api/account/export` | Profile updates, erasure and profile/cloud-snapshot export |
| `/api/health` | Configured catalog/account service checks |

Logout clears this browser's cookies. Platform does not currently expose current-session revocation. Account deletion uses its existing erasure endpoint and requires password confirmation or recent social sign-in. Export covers the profile and cloud snapshots for six languages; it does not include feedback/report records.

## Local development

Use Node 24 and install the lockfile:

```bash
npm ci
cp .env.local.example .env.local
npm run dev
```

If the host cannot start Turbopack's FSEvent stream, use `WATCHPACK_POLLING=true npm run dev -- --webpack --hostname localhost --port 3002`. The local preview in this pass uses that command at `http://localhost:3002`.

Set `API_ORIGIN` to the intended backend and `LEARN_ORIGIN` to the canonical portal origin. Both accept HTTPS, with HTTP allowed only on loopback for local development. Preview recovery links require an explicit origin override; they do not derive from a Vercel preview hostname.

| Variable | Requirement |
| --- | --- |
| `API_ORIGIN` | Defaults to `https://api.forrovivo.com`; use the staging API for staging acceptance |
| `LEARN_ORIGIN` | Canonical reset-link origin; defaults to `https://learn.forrovivo.com` |
| `LEARNER_WEB_SERVICE_KEY` | Required for issuing signed web sessions and trusted recovery requests; must match the Worker secret |
| `RESEND_API_KEY` | No longer used by Learner; password registration and recovery are retired |
| `RESEND_FROM_EMAIL` | Verified sender; defaults to `ForroVivo <hello@forrovivo.com>` |
| `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Optional, read at build time; configure the matching Worker audience and Google web origin |
| `NEXT_PUBLIC_APPLE_WEB_CLIENT_ID` | Build-time override; defaults to `com.forrovivo.learner.web`. Verify the matching Worker audience and Apple association |
| `NEXT_PUBLIC_APPLE_WEB_REDIRECT_URI` | Exact registered Apple web return URL; default `https://learn.forrovivo.com/` |

An absent Google ID leaves Google unavailable. Apple uses its default Services ID even when its override is empty; off-origin or HTTP previews link to the configured secure Apple return origin. Keep secrets in deployment settings or ignored local configuration. Source Sans 3 and the public site's Nunito are bundled locally with OFL licenses/provenance in `src/app/fonts`; builds do not download them from Google. The login/registration pages use the public site's cartoon design language and the supplied layout reference. See [login design and social setup](docs/AUTH_UI_2026-10-21.md) for provider activation and verification limits.

## Verification

```bash
npm test
npm run lint -- --max-warnings=0
npm run build
npm run typecheck
npm run audit:prod
npx playwright install --with-deps webkit
npm run test:e2e
```

The E2E harness runs the production build over local HTTPS using ephemeral self-signed TLS, synthetic users and a loopback fixture API. HTTP tests assert Secure/HttpOnly cookie attributes and server behavior; WebKit tests exercise actual browser storage and navigation. Playwright WebKit is portable engine coverage, not native Safari certification.

Run only server integration tests with `npm run test:e2e:api`. To exercise the actual local Platform Hono Worker and SQLite with all source migrations instead of the standalone fixture:

```bash
PLATFORM_TEST_ROOT=/absolute/path/to/forrovivo-platform npm run test:e2e:api
```

This optional path requires the Platform checkout and its dependencies. It uses temporary SQLite and synthetic identities, with no production writes or real emails. The default fixture supports independent Learner CI. Run build and typecheck sequentially because Next regenerates its route types.

CI enforces production dependency audit, zero-warning lint, regression tests, typecheck, build and WebKit/HTTP checks. Remote CI has not been verified in this pass. The full dependency audit currently flags an unpatched development-only `braces` chain; production dependencies audit clean. See the remediation report for details.

Login and registration support EN/PT with a saved browser preference. Dashboard and lesson source also include EN/PT translation support; full string coverage and browser acceptance remain unverified. Web currently saves lesson completion and first-attempt score. Full bilingual UI, web audio, XP, streaks, hearts, SRS, mistake review and native feature parity remain separate product decisions. Never store linguistic JSON, Admin credentials, real learner data or secrets in this repository.

Current UI changes and the pending screen-size acceptance matrix are recorded in the [22 October documentation follow-up](docs/AUTH_UI_2026-10-21.md#documentation-follow-up--22-october-2026). The earlier single-viewport result does not certify the latest registration spacing or all screen sizes.

Latest local acceptance: **59 regression tests**, lint/build/typecheck and both six-case HTTPS suites pass. The [acceptance report](docs/LEARNER_ACCEPTANCE_2026-10-22.json) records 104 responsive cases defined but blocked before page startup, plus the remaining real-provider/email gates.

## Account flow follow-up — 22 October 2026

**Historical, superseded by the social-only rollout below.** New registration returned a uniform pending response, delivers a mailbox-verification link and requires the original signup password on `/verify-email`. Verification does not log in automatically or change existing credentials. Fresh checks: **66 Learner tests**, lint/build/typecheck, seven fixture HTTPS cases and seven actual-local-Platform cases pass; Platform has **32 tests** and 28 OpenAPI operations. Migration **0020 is not applied remotely**. Real mail/device acceptance and deployment remain open. See [account implementation and rollout](docs/ACCOUNTS_2026-10-22.md).

## Social-only web sign-in — 22 October 2026

The website now offers only Apple and Google for login and signup, like the native apps. The existing font, palette, cartoon sign, leafy card, provider buttons and responsive CSS remain. Password forms and recovery links are removed. `/forgot-password`, `/reset-password` and `/verify-email` redirect to `/`; all five password-auth POST endpoints return `410`, without parsing credentials, calling the API, sending mail or changing session cookies.

Existing email-account data and sessions are not deleted or linked to social identities. The password confirmation used solely to erase a legacy email account is retained for those authenticated users; it is not a sign-in route. No shared Worker, D1 schema or native app changes are required.

Validation and deployment evidence: [social-only rollout](docs/SOCIAL_ONLY_2026-10-22.md).
