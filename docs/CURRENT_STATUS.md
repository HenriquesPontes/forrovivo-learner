# Learner: current status

Updated 22 October 2026. This page replaces historical audit-result narratives. Source checks are not production, store or physical-device certification.

## Implemented scope

Account-required web Academy. Login and signup offer Apple and Google only. Password sign-in/recovery routes are retired; existing legacy account data is preserved. Lesson results use a local outbox and Platform cloud progress.

## Current verification

58 tests, typecheck, zero-warning lint and production Webpack build pass. Browser/HTTP integration startup is blocked by local listen EPERM on port 4319; no E2E pass is claimed.

## Remaining acceptance

Verify real Apple/Google exchanges, same-provider restoration across native/web, the full responsive matrix, keyboard accessibility and screen-reader behavior. Native feature parity requires an explicit scope decision.

Use the README for setup and repeatable verification commands. Re-run checks for the source and environment being released; do not carry forward old pass counts.
