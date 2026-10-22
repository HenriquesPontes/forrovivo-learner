# ForroVivo Learner

Web Academy at [learn.forrovivo.com](https://learn.forrovivo.com), deployed through the `forrovivo-learner` Vercel project. The iOS and Android apps remain the primary learning surfaces. Catalog, learner accounts and cloud progress use the existing Platform `/app/v1` API.

A validated account is required for every lesson; lessons within each unit unlock in order. Linguistic content stays in Research and the remote catalog.


## Accounts and progress

The public guest-learning entry is retired. Account results first enter an account-specific local outbox, then sync to the existing cloud progress API. Failed syncs remain available for retry. Legacy guest-progress handling remains in source; it does not enable anonymous lessons. The browser cache contains completion counts and scores, with no bearer token.

Cloud lessons use the native `path_uN` IDs and contiguous `completedLessonCount`. Replays do not inflate completion. Web sends only the lesson rows it changed, plus the unit rows it read as `basePayload`. The backend keeps lesson counts, scores and unlocks monotonic, and keeps every other field that this write did not change from that baseline.

Apple and Google identities remain provider-specific. Use the same supported provider to access the same account on web and native. Web sign-in and signup use Apple and Google only. Matching an email address does not link distinct identities. Existing email account data is retained; authenticated legacy users can still export/manage their data. iOS and Android support different provider sets. Provider dashboard configuration and real web OAuth acceptance remain release requirements.

Protected pages validate the session against Platform. A signed HttpOnly context cookie binds browser progress and account actions to the account that opened the page, preventing stale tabs from saving into another account. Existing web sessions without this context must sign in once after rollout. Native session tokens and APIs are unchanged. Signing-key rotation also requires web reauthentication.

## Routes

| Route | Purpose |
| --- | --- |
| `/`, `/login` | Apple and Google sign-in |
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

If the host cannot start Turbopack's FSEvent stream, use `WATCHPACK_POLLING=true npm run dev -- --webpack --hostname localhost --port 3002`.

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

An absent Google ID leaves Google unavailable. Apple uses its default Services ID even when its override is empty; off-origin or HTTP previews link to the configured secure Apple return origin. Keep secrets in deployment settings or ignored local configuration. Source Sans 3 and the public site's Nunito are bundled locally with OFL licenses/provenance in `src/app/fonts`; builds do not download them from Google. The login/registration pages use the public site's cartoon design language and the supplied layout reference. See [login design and social setup](docs/CURRENT_STATUS.md) for provider activation and verification limits.

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

CI defines dependency, lint, regression, typecheck, build and browser/HTTP checks. Inspect the latest workflow run and rerun dependency auditing before release.

Login and registration support EN/PT with a saved browser preference. Dashboard and lesson source also include EN/PT translation support; full string coverage and browser acceptance remain unverified. Web currently saves lesson completion and first-attempt score. Full bilingual UI, web audio, XP, streaks, hearts, SRS, mistake review and native feature parity remain separate product decisions. Never store linguistic JSON, Admin credentials, real learner data or secrets in this repository.

## Current assessment

See [current status and remaining acceptance](docs/CURRENT_STATUS.md). Historical audit pass counts are not release evidence.
