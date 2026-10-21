# ForroVivo Learner

Web Academy at [learn.forrovivo.com](https://learn.forrovivo.com), deployed through the `forrovivo-learner` Vercel project. The iOS and Android apps remain the primary learning surfaces. Catalog, learner accounts and cloud progress use the existing Platform `/app/v1` API.

Guests can complete Unit 1. An account opens the full Forro course; lessons within each unit unlock in order. The catalog inspected on 21 October contains 15 units, 75 levels and 358 phrases. Linguistic content stays in Research and the remote catalog.

The [21 October remediation report](docs/REMEDIATION_2026-10-21.md) records the source changes, verification and remaining release gates. These local changes have not been deployed.

## Accounts and progress

Guest results persist in this browser. Account results first enter an account-specific local outbox, then sync to the existing cloud progress API. Failed syncs remain available for retry. Learners explicitly choose whether to add guest results to their signed-in account. The browser cache contains completion counts and scores, with no bearer token.

Cloud lessons use the native `path_uN` IDs and contiguous `completedLessonCount`. Replays do not inflate completion. Web preserves the existing native snapshot fields and updates lesson counts/scores; the backend merges those counts monotonically. Other snapshot fields still use the backend's existing last-write-wins policy. Concurrent native SRS/bookmark edits need a coordinated partial-update API for stronger conflict protection.

Apple and Google identities remain provider-specific. Use the same supported provider to access the same account on web and native. Email/password accounts currently work on the website; matching an email address does not link email, Apple and Google identities. iOS and Android support different provider sets. Provider dashboard configuration and real web OAuth acceptance remain release requirements.

Protected pages validate the session against Platform. A signed HttpOnly context cookie binds browser progress and account actions to the account that opened the page, preventing stale tabs from saving into another account. Existing web sessions without this context must sign in once after rollout. Native session tokens and APIs are unchanged. Signing-key rotation also requires web reauthentication.

## Routes

| Route | Purpose |
| --- | --- |
| `/`, `/login` | Email login; configured Apple/Google sign-in |
| `/try` | Start or resume guest lessons |
| `/home` | Course map and sync status |
| `/academy/[unit]/[level]` | Lesson quiz and durable completion |
| `/create-account` | Website email registration and configured social sign-in |
| `/forgot-password`, `/reset-password` | Public recovery pages, including when an old cookie is present |
| `/account` | Profile preference, private cloud-data export and confirmed deletion |
| `/reauthenticate` | Upgrade an existing web session or refresh sensitive-action authentication |
| `/api/auth/*` | Guarded password/OAuth/session handlers |
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
| `RESEND_API_KEY` | Required for password-reset delivery; missing delivery config fails before requesting a backend token |
| `RESEND_FROM_EMAIL` | Verified sender; defaults to `ForroVivo <hello@forrovivo.com>` |
| `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Optional, read at build time; configure the matching Worker audience and Google web origin |
| `NEXT_PUBLIC_APPLE_WEB_CLIENT_ID` | Optional Apple Services ID, read at build time; configure the matching Worker audience and Apple association |
| `NEXT_PUBLIC_APPLE_WEB_REDIRECT_URI` | Exact registered Apple web return URL; default `https://learn.forrovivo.com/` |

Empty provider IDs leave a disabled, clearly unavailable button and do not load the provider SDK. Keep secrets in deployment settings or ignored local configuration. Source Sans 3 and the public site's Nunito are bundled locally with OFL licenses/provenance in `src/app/fonts`; builds do not download them from Google. The login/registration pages use the public site's cartoon design language and the supplied layout reference. See [login design and social setup](docs/AUTH_UI_2026-10-21.md) for provider activation and verification limits.

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

Login and registration support EN/PT with a saved browser preference. The Academy remains in English. Web currently saves lesson completion and first-attempt score. Full bilingual UI, web audio, XP, streaks, hearts, SRS, mistake review and native feature parity remain separate product decisions. Never store linguistic JSON, Admin credentials, real learner data or secrets in this repository.
