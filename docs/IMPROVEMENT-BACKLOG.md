# Improvement backlog — status

Legend: ✅ done & tested here · 🚧 in progress · ⛔ blocked in this environment (reason given) · 📝 documented only

| # | Item | Status |
|---|---|---|
| 1 | Real SMS/notification gateway (Twilio + SMTP email) | ✅ |
| 2 | Redis-backed rate limiting (multi-instance safe) | ✅ |
| 3 | Multi-senior switcher for family accounts | ✅ |
| 4 | Admin Security Center — real backend (sessions, lockouts, IP activity) | ✅ |
| 5 | Loading skeletons instead of plain "Loading…" text | ✅ |
| 6 | Automated accessibility audits (axe) | ✅ |
| 7 | Error monitoring hook (Sentry-ready, no-op without DSN) | ✅ |
| 8 | Database backup/restore scripts, tested against real Postgres | ✅ |
| 9 | Further bundle code-splitting | ✅ |
| 10 | Visual QA in a real browser | ⛔ no browser available in this environment |
| 11 | Live Anthropic API smoke test | ⛔ no API key available in this environment |
| 12 | `docker compose up` end-to-end verification | ⛔ no Docker daemon in this environment |
| 13 | CI green-run on GitHub | ⛔ no git remote/credentials in this environment |
| 14 | Playwright e2e tests with a real browser | ⛔ browser download host not reachable (network allow-list) |
| 15 | Admin Module Management / System Settings real backends | ⛔ deferred — scope too large/ill-defined for this pass |
| 16 | Caregiver/mentor self-service portal | ⛔ deferred — new role & auth surface, large scope |
| 17 | Self-hosted video (Jitsi) deployment | ⛔ deferred — needs a public server; code already supports `VIDEO_BASE_URL` |
| 18 | Analytics | ⛔ deferred — needs a product decision on what/how to track |

## What "done" means here

Every ✅ item was implemented **and verified against real infrastructure**, not mocked wherever that was
possible in this sandbox — real PostgreSQL (backup/restore cycle, Security Center's live sessions and
lockouts), a real local Redis (installed via apt; cross-instance sharing and a genuine killed-connection
fail-open test), a real local SMTP server for the email gateway, RFC 6238 TOTP test vectors, and
axe-core audits of every main screen with realistic fixture data. Several tests were mutation-checked
(temporarily breaking the fix to confirm the test actually fails). Two genuine new bugs were caught and
fixed along the way, not just the work items themselves:
- An unhandled promise rejection in the Redis rate-limit store's `init()` that could have crashed the
  whole process on a Redis outage — found while testing the fail-open path, not by inspection.
  **Caught in this pass, not imported from the original export.**
- A pre-existing accessibility bug in `ui/progress.tsx`, inherited from the original Figma-Make export: the
  `value` prop was computed for the visual fill but never forwarded to Radix's `<Progress.Root>`, so every
  progress bar in the app (adherence, meal calories, order tracking, tier progress) was always
  `aria-valuenow`-less / "indeterminate" to assistive tech — found by the new automated accessibility audit.
  Two more real bugs surfaced the same way: a heading-order jump (h1 straight to h3) on the Dashboard
  whenever there was a pending family request or the AI summary hadn't loaded yet, and `RewardsLoyalty`'s
  points card showing **hardcoded sample figures** ("+450 pts", "8 rewards", a progress bar always labelled
  "Progress to Gold") instead of the user's real numbers — the backend never even computed them. All four
  are fixed, with regression tests.

Items 10–14 were re-attempted (not just assumed) at the start of this pass — checked for `docker`, a git
remote, and whether a Chromium/Playwright browser could be installed or downloaded — and are blocked for
the stated environment reasons, not for lack of trying. 15–18 are deliberately deferred: each is a large,
separable feature (a new role and auth surface, a product decision on what to track, a public server to
stand up) rather than a fix to existing code, and starting one properly would mean doing it shallowly here
or not at all.

## Suggested next pass

In priority order: (15) Module Management / System Settings backends, since Security Center's pattern
now exists to copy; (16) a caregiver/mentor portal, which needs a role/permissions design decision first;
(17) standing up a self-hosted Jitsi for TeleHealth video; (18) analytics, once there's a decision on what
to track and under what consent. Items 10–14 should simply be re-run in a normal dev machine or CI
environment where a browser, Docker, and network access to Anthropic/GitHub are available — nothing about
them requires further code changes first.
