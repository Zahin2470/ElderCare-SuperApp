# Code review — findings and fixes

Review of the original Figma-Make export (React/Vite, frontend only) and what was done about each finding.
"Found by tests" items are defects introduced *while* building the backend, caught by the new test suite before delivery.

## 1. The app did not build
| # | Finding | Fix |
|---|---|---|
| 1 | Unresolved git conflict markers (`<<<<<<< HEAD`) in `App.tsx`, `ImageWithFallback.tsx` and **103 blocks in `index.css`** | Resolved. `index.css` was a *compiled* Tailwind output committed to git; replaced with a real Tailwind v4 pipeline (`@tailwindcss/vite`) fed by `styles/globals.css`, so it can't conflict again. |
| 2 | `InteractionMap` rendered but its import was commented out (runtime `ReferenceError`) | Design-review tools are now lazy-loaded and shown in dev builds only. |
| 3 | `package.json`: name with a space, `*` versions, no TypeScript / `@types`, no `tsconfig`, no test tooling | Rewritten with pinned ranges, `tsconfig.json` (strict), scripts, Vitest. |
| 4 | 57 files used `pkg@x.y.z` import specifiers (Figma-Make artefact) plus Vite alias hacks; `figma:asset/…` imports | Plain imports; aliases removed; asset imported by relative path. |
| 5 | `.gitignore` contained only `/README.md` (ignored the README, not `node_modules`/build) | Real ignore rules. |

## 2. Security defects in the original
| # | Finding | Fix |
|---|---|---|
| 6 | OTP `123456` accepted for any phone; attempt limit enforced only in the browser | Server-side OTP: HMAC-hashed, 5-min expiry, 3 attempts, cooldown, hourly cap. |
| 7 | Passwords (`password123`, `admin123`) and "any 6 digits = valid 2FA" shipped in the JS bundle | Argon2id + server checks; real TOTP (RFC 6238) with replay protection. Demo credentials only render in dev builds. |
| 8 | Register collected a password that was never stored; no real session (state lost on refresh) | Real accounts, JWT + rotating httpOnly refresh cookie; session survives reload. |
| 9 | "Admin Portal" button visible to **every** user | Admin accounts sign in through a separate staff entry; portal is role-gated, enforced by the API. |
| 10 | Prices/totals computed in the browser | All money computed on the server from DB rates. |
| 11 | Fake success feedback — "Booking approved!", "marked as taken!" etc. with no effect | Replaced by real API actions; controls without a backend were removed or labelled as sample data. |
| 12 | Family vs senior was a UI toggle anyone could flip | Roles are server-side; family sees a senior only after the senior accepts a link. |

## 3. Functional bugs
| # | Finding | Fix |
|---|---|---|
| 13 | `DoctorCard` read `doctor.speciality` (typo) — specialty blank on every card | Fixed. |
| 14 | GoldenCare buttons called an undefined `window.__app_navigate`, falling back to `window.location.href` → full reload → **user logged out**; routes like `/goldencare/mentors/1` never existed; a dev-machine file path was baked in | Real booking / reschedule / cancel via API. |
| 15 | `useNavigate` (react-router) imported with no `<Router>` | Removed; navigation is URL-backed and dependency-free. |
| 16 | Refresh, back button and deep links always reset to the dashboard | URL-synced navigation (`/silverbox`, `/care360/<frame>`), data preserved in `history.state`. |
| 17 | Register had no role choice (family accounts impossible); email-only sign-up hit a screen that was never rendered (blank page); Forgot-password passed no target and had no "set new password" screen | Role picker; email verification via the same OTP flow; new `ResetPassword` screen. |
| 18 | Phone input offered other countries but always prefixed `+880`; `+880` + `01…` produced an invalid number | Bangladesh-only, normalised server-side. |
| 19 | Dashboard showed a hard-coded date (Oct 19, 2025) and fake stats; ৳ prices with `$` icons; distances in miles | Live data; `Banknote` icon; area instead of fake distance. |
| 20 | Once in the Admin Portal there was no way back after logout | Fixed by the new session model. |
| 21 | Meal tags `Low-Sodium` vs `Low Sodium` (hyphen/space) would silently break matching | Normalised in the recommender. |
| 22 | No error boundary — one throwing component blanked the app | `ErrorBoundary` per route. |
| 23 | 1.7 MB PNG logo; 838 kB main bundle | 23 kB WebP; vendor chunks; admin code split (main app chunk ≈ 400 kB). |

## 4. Found by the new tests (bugs in code written during this work)
- Refresh-token "grace window" for two-tab races also applied after logout / password reset / theft response → a stolen token could mint a session for 10 s. Now applies only to genuine rotations while the session is alive.
- Phone masking regex off by one digit (number was not masked).
- Seed data placed readings in the future, making the newest real reading look stale.
- Event-capacity test was too weak to detect a missing row lock; strengthened (12 users / 3 seats) and mutation-checked.

## 5. Deliberately not done
See "Known limitations" in the README (Activity Log module, provider integrations, real video, SMS gateway, visual QA, Docker/live-AI verification).
