# 👵🩺👴 ElderCare — SuperApp
**Care · Connect · Comfort** — a unified platform for Bangladesh's elderly-care crisis.

[![CI](https://github.com/Zahin2470/ElderCare-SuperApp/actions/workflows/ci.yml/badge.svg)](https://github.com/Zahin2470/ElderCare-SuperApp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<p align="center"><img src="./frontend/src/assets/logo.webp" alt="ElderCare Logo" width="420" /></p>

ElderCare brings caregiving, medication management, health records, telehealth, nutrition, co-living, mentoring and community into one app for seniors **and** their families.

- **Prototype:** https://motto-truck-48556756.figma.site
- **Demo video:** https://drive.google.com/file/d/1s6sIHRpsfK-G8IA0RTt6YToHT3oIBvgO/view?usp=sharing

---

## Architecture

```
┌────────────────────┐   /api (same origin)   ┌──────────────────────┐      ┌──────────────┐
│ frontend/          │ ─────────────────────▶ │ backend/             │ ───▶ │ PostgreSQL   │
│ React 18 + Vite    │   Bearer access token  │ Express 5 + TS + zod │      │ 16           │
│ Tailwind v4        │   + httpOnly refresh   │ JWT · Argon2 · TOTP  │      └──────────────┘
│ TanStack Query     │        cookie          │                      │ ───▶ Anthropic API (server-side only)
└────────────────────┘                        └──────────────────────┘      (optional; rule-based fallback)
```

| Folder | What it is |
|---|---|
| `frontend/` | The React app (all 10 modules, auth flow, admin console). |
| `backend/` | REST API, SQL migrations, seed data, AI services, tests. |
| `docker-compose.yml` | Postgres + backend + nginx-served frontend. |
| `design-assets/` | Original full-resolution logo (the app ships a 23 KB WebP). |

---

## Quick start

**Prerequisites:** Node 20+ and PostgreSQL 14+ (or Docker).

```bash
# 1. database (skip if you already have Postgres)
docker run -d --name eldercare-db -p 5432:5432 \
  -e POSTGRES_USER=eldercare -e POSTGRES_PASSWORD=eldercare_dev -e POSTGRES_DB=eldercare postgres:16-alpine

# 2. backend  → http://localhost:4000
cd backend
cp .env.example .env              # defaults work for local dev
npm ci
npm run migrate && npm run seed   # schema + demo data (dev only)
npm run dev

# 3. frontend (new terminal)  → http://localhost:3000
cd frontend
npm ci
npm run dev                   # Vite proxies /api to :4000, so no CORS setup is needed
```

Or everything in containers: `docker compose up --build` → http://localhost:3000
(then `docker compose run --rm backend node dist/seed.js` for demo data).

### Demo accounts (created by `npm run seed`, development only)

| Role | Sign in with | Password |
|---|---|---|
| Senior | `demo@eldercare.com` or `+8801712345678` | `Demo@12345` |
| Family (linked to the senior) | `family@eldercare.com` | `Demo@12345` |
| Admin (Super / Security / Operations / Clinical) | Sign-in screen → **Staff sign-in**: `super@eldercare.com`, `security@…`, `ops@…`, `clinical@…` | `Admin@12345` + 2FA |

Admin 2FA (TOTP): run `npm run totp -- super@eldercare.com` in `backend/` to print the current 6-digit code (dev only), or add the printed `otpauth://` URI to an authenticator app.
In development the OTP is shown on the verification screen ("Dev mode — your code is …") because no SMS gateway is configured.

---

## Modules — what is real

All ten modules read and write the database. Everything below is covered by API tests.

| Module | Working features |
|---|---|
| **Dashboard** | Live vitals with status/trend, alerts (missed doses, low stock, out-of-range readings), upcoming items, points, daily check-in that earns points, AI daily summary, family-link requests. |
| **SilverBox** | Per-person medication schedule, idempotent "mark taken / skip", computed adherence (week / month / on-time), full history *including missed doses*, stock tracking and refill alerts. |
| **ElderLink** | Caregiver search/filter, booking with **server-side pricing** and double-booking prevention, cancel, AI suggestions. |
| **Care360** | Vitals log, record upload (PDF/JPG/PNG, magic-byte checked, 10 MB), owner-only download, time-limited share with a doctor, prescription refill requests. |
| **TeleHealth** | Doctor search, real slot availability, booking (a slot can only be booked once), cancel. Video join link is issued only when a video host is configured — see limitations. |
| **NutriSenior** | Menu, meal plans, cart → order priced by the server, live order tracking, ratings, daily calorie summary, AI suggestions. |
| **GoldenCare** | Mentor search, session booking, reschedule, cancel (the old page-reload navigation hack is gone). |
| **AgeWell Living** | Room applications (modify / withdraw), shared-space booking with overlap protection, community chat. |
| **Community** | Events with capacity-safe RSVP, "my events", persisted group chat, AI suggestions. |
| **Rewards** | Append-only points ledger, once-per-day earn rules enforced by the database, concurrency-safe redemption with voucher codes, tiers from lifetime points. |
| **Admin console** | Real: dashboard figures, user list/search/suspend with mandatory reason, audit log, roles matrix. *Sample data (clearly labelled in the UI):* Security Center, Module Management, System Settings. |

---

## AI features (Claude)

The API key lives **only on the server**. With no `ANTHROPIC_API_KEY` every feature still works using rule-based fallbacks ("basic mode"), so the app never depends on the model being up.

| Feature | How it works |
|---|---|
| **Care Assistant** (chat, English / বাংলা) | Answers from the person's own context (today's doses, latest readings, upcoming items). Persisted conversations, per-user daily cap. |
| **Daily summary / weekly family summary** (dynamic content) | Claude writes short, kind text from structured facts. Cached per user/day/language. |
| **Smart recommendations** (meals, events, caregivers) | Ranked by a transparent scoring function (needs derived from medications and vitals, past ratings, RSVP history, availability); each item carries the reason it was chosen. Claude only *phrases* the reason — it cannot add, remove or reorder items. |

**Safety design** (all covered by tests in `backend/tests/ai.test.ts`):

1. **Emergency screening runs first, in code.** Chest pain, breathing trouble, stroke signs, fainting, overdose, self-harm (English and Bangla) get a fixed instruction to call **999** and alert family — the model is never consulted. The UI adds a one-tap call button.
2. **No personal identifiers leave the server.** Context is an allow-list of fields; name, phone, email, address and ids are never sent. Free text (e.g. a medicine name) is stripped of markup and length-capped, and the prompt marks the block as data, not instructions.
3. **No diagnosing, no dose changes** — enforced in the system prompt, and the summary generator rejects any text containing numbers that were not in the supplied facts (hallucination guard).
4. **Output is rendered as plain text**, never HTML.
5. Model errors, timeouts and empty replies fall back to rule-based answers; failures are logged without prompts or health data.

Configure with `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` (default `claude-sonnet-5`). *Note: the live-model path is exercised in tests with an injected fake model; it has not been run against the real API in this repository's CI.*

---

## Security model

- **Passwords:** Argon2id. Server-enforced policy. Unknown-user and wrong-password paths take the same time and return the same error. 5 failures → 15-minute lockout.
- **Sessions:** 15-minute JWT access token held **in memory only** (never localStorage); 30-day rotating refresh token in an `httpOnly`, `SameSite=Lax`, `Secure` (prod) cookie, stored hashed. Replaying a rotated token revokes the whole login session. Logout, password reset and suspension revoke tokens immediately.
- **OTP:** 6 digits, HMAC-hashed at rest, 5-minute expiry, 3 attempts then burned, 60 s resend cooldown, 5/hour cap. Responses never reveal whether an account exists. Codes are echoed to the client **only outside production**.
- **Authorization:** one choke-point (`resolveSubject`) decides whose data a request touches: seniors → themselves (client-supplied ids are ignored), family → only accepted links (senior must consent). Admin accounts cannot read member health data through the member API.
- **Admin:** password **and** TOTP (RFC 6238, replay-protected) — the password alone yields no session. Permissions enforced server-side per request; roles/status changes require a reason and are audited; admins cannot suspend themselves or mint admins over the API.
- **Audit log:** append-only (database trigger blocks UPDATE/DELETE). Records logins, admin actions, record downloads and shares.
- **Data integrity:** money is computed on the server; double-booking, over-capacity RSVPs, double redemption and duplicate doses are prevented by unique indexes and row locks and tested under concurrency.
- **Uploads:** generated filenames, size and type limits, real file-signature check, `nosniff`, owner-only access.
- **Ops:** helmet headers, CORS allow-list, rate limits, request logging without bodies/queries, uniform JSON errors with no stack traces, the server **refuses to start in production with the built-in dev secrets**.

---

## API overview

`/api/auth` · `/api/admin` · `/api/family` · `/api/dashboard` · `/api/medications` · `/api/care360` · `/api/telehealth` · `/api/caregivers` · `/api/nutrition` · `/api/community` · `/api/agewell` · `/api/mentors` · `/api/rewards` · `/api/ai` · `/api/healthz`

Errors are always `{ "error": { "code", "message", "details?" } }`. Phone numbers are normalised to E.164 (`+8801XXXXXXXXX`; operator prefixes 013–019).

Front-end routes are real URLs (`/silverbox`, `/care360/C360_ViewRecord`), so refresh, back button and bookmarks work.

---

## Testing

```bash
cd backend  && npm test     # 174 tests against a REAL PostgreSQL (TEST_DATABASE_URL, name must contain "test")
cd frontend && npm test     # component + API-client tests
npm run typecheck           # from the repo root: both projects
```

The suite includes concurrency tests (parallel redemptions / RSVPs / bookings), authorization-isolation tests, the AI safety/privacy tests above, and a **frontend↔backend route-contract test** that fails if the React app calls an endpoint the API doesn't have. Several of these were mutation-checked (removing a row lock makes them fail).

CI: `.github/workflows/ci.yml` (Postgres service; typecheck + tests + build for both projects).

---

## Going to production — checklist

1. Set `NODE_ENV=production` and unique `JWT_ACCESS_SECRET` / `OTP_HMAC_SECRET` (the server will not start otherwise). Serve over HTTPS and set `TRUST_PROXY=1` behind your proxy.
2. **Implement an SMS/email gateway** in `backend/src/lib/notify.ts` (only a console notifier exists). Without it nobody can verify an account in production.
3. Move `STORAGE_DIR` to durable object storage (S3-compatible) — the local-disk driver is for a single server.
4. Run migrations as a deploy step (`AUTO_MIGRATE=false`) and back up Postgres. **Do not run `seed` in production** (it refuses).
5. Enrol real admins with `npm run totp` and remove the seeded demo accounts.
6. Health data is sensitive personal data: complete a privacy/legal review (consent text, retention, breach process) before real users. A third-party AI provider receives only the minimised context described above.
7. Set `VIDEO_BASE_URL` to a self-hosted Jitsi (or integrate your provider) to enable TeleHealth video.

---

## Known limitations (not built yet)

Being explicit so nothing is mistaken for working:

- **Not implemented:** Activity Log module (`D01_ActivityLog`), caregiver/dietitian chat, IoT/dispenser telemetry, WebSocket realtime (group chat polls every 5 s), background-check workflow, caregiver/partner-side apps, payment processing, admin Security Center / Module Management / System Settings back-ends, multi-senior switching for a family account with several linked seniors (the first linked senior is used), operational tools to advance meal-order/booking status.
- **TeleHealth video** needs a video host (`VIDEO_BASE_URL`); the previous simulated call screen was removed rather than left pretending to work.
- **Untested here:** Docker images/compose (no Docker in the build sandbox), the live Anthropic API call, and visual/browser rendering (no browser available) — the frontend is verified by type-check, unit/component tests, production build and the route-contract test, not by visual QA. Please click through it once before release.
- AI recommendation weights and the vitals bands are reasonable defaults, **not clinically validated**; have a clinician review them.

---

## Brand & design

Tokens: **Primary** `#4A90E2` · **Accent** `#FFA726` · **Dark** `#1F2D3D`. Typography: Poppins (headings) + Inter (UI). Tokens live in `frontend/src/styles/globals.css`; Tailwind v4 compiles them at build time (the old committed, conflict-ridden `index.css` build artifact is gone).

Figma frame names used for hand-off are preserved as route/frame ids (`EL01_SearchResults`, `SB01_MedsOverview`, `C360_RecordsList`, `NS01_MenuOverview`, …). Design-review tools (Brand Showcase, Interaction Map) appear in the sidebar in development builds only.

## Contributing

Branches `feat/<module>-short` / `fix/<issue>-short`; tests required for backend changes and major flows; conventional commits. Please run `npm run typecheck && npm test` before opening a PR.

## License & contact

MIT — see [LICENSE](LICENSE). Owner: Abrar Hossain Zahin.
