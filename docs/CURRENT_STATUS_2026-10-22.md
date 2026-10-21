# Learner status and remaining work

## Current source status — 22 October 2026

This update supersedes older current-state claims below; dated verification artifacts remain historical evidence. Learner source is at `99500aa`; Platform source is at `8fc4062`. Deployment mapping and external provider-console settings were not reverified in this update.

- All lessons require a validated account. `/try` clears the legacy guest cookie and redirects to `/`; `/home` and lesson pages reject non-account access. Legacy guest-progress helpers are not a public guest-learning entry.
- Learner defaults to Apple Services ID `com.forrovivo.learner.web` and return URL `https://learn.forrovivo.com/`. Platform production source configuration accepts that web audience alongside native Apple. On an origin other than the configured HTTPS origin, the Apple control links to the secure site. This does not certify the deployed code or a successful provider exchange.
- EN/PT support extends beyond authentication: the dashboard and lesson source use `LearnerLanguage`, `LearnerText` and the Portuguese copy map. Full translation, accessibility and visual acceptance remain unverified; do not describe the Academy as English-only or claim every string is translated.
- Fresh `npm test` execution passed **57 tests across seven files**. Earlier lint/build/typecheck, six-case HTTP suites and dependency inventories retain their original dates and source scope; they were not rerun for this documentation refresh.
- Responsive matrix and native Safari acceptance remain pending. The old 1135 × 853 login measurement predates later UI edits.
- No deployment, remote ledger inspection, real OAuth exchange or email delivery was performed in this documentation update. The recorded 21 October staging/production migration verification remains the latest inspected ledger evidence.

## Remaining release work

1. Revalidate staging/backend release access and staging public checks; establish which source versions are actually deployed.
2. Run the [responsive matrix](AUTH_UI_2026-10-21.md#documentation-follow-up--22-october-2026), Safari, keyboard and accessibility checks for both languages, including account-required lesson routing.
3. Verify controlled real Google/Apple exchanges, supported native account restoration and password-reset receipt, expiry, single use and session revocation.
4. Complete coordinated mailbox verification and enumeration-resistant registration. Preserve native auth compatibility.
5. Verify publishing through to installed clients; resolve Research permissions, content drift, translation/audio and release-validation gaps recorded in the root audit.
6. Complete native device/release checks and isolated restore/rollback/alert rehearsals. Retest the development dependency advisory before release.

No new feature expansion or payment system is required by this status update.

## Acceptance follow-up — 22 October 2026

Portuguese recovery forms now localize their email/password placeholders and common service-unavailable/reload/deletion-confirmation messages. Fresh validation passes: **59 tests in eight files**, zero-warning lint, production Webpack build, typecheck, six fixture HTTPS checks and six checks against actual local Platform routes. See [acceptance evidence](LEARNER_ACCEPTANCE_2026-10-22.json). No production accounts, emails or deployments were changed.

The new `e2e/responsive.spec.ts` defines **104 cases**: 26 CSS viewports × login/registration × EN/PT. It checks horizontal control clipping, registration email spacing, input focus/reachability and footer access; short-screen vertical scrolling remains allowed. Provider SDK requests are blocked, so this tests fallback layout rather than real Google/Apple button rendering. Run after a production build with `npx playwright test e2e/responsive.spec.ts`.

Execution was attempted with fail-fast: the first case failed during WebKit launch (exit 134), before any page/layout assertion; 103 cases did not run. Native `safaridriver --port 4327` also exited 1 before page startup. These are environment blockers, not passing layout checks or diagnosed page defects. Physical devices, mobile keyboard, zoom, screen-reader behavior, real provider exchanges and real reset delivery remain acceptance gates. Existing social tests use synthetic provider callbacks; they do not prove production provider-console configuration.
