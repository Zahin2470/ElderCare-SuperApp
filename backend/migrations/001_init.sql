-- ElderCare SuperApp — initial schema (PostgreSQL 14+)
-- Conventions: uuid PKs, timestamptz everywhere, money in whole BDT (integer), local
-- wall-clock medication times stored as date + time (Asia/Dhaka has no DST).

-- ───────────────────────── Identity & sessions ─────────────────────────
CREATE TABLE users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         text        NOT NULL CHECK (length(full_name) BETWEEN 1 AND 120),
  email             text        UNIQUE CHECK (email = lower(email)),
  phone             text        UNIQUE CHECK (phone ~ '^\+8801[0-9]{9}$'),   -- E.164, Bangladesh mobile
  password_hash     text        NOT NULL,
  role              text        NOT NULL DEFAULT 'senior'
                    CHECK (role IN ('senior','family','super_admin','security_admin','operations_admin','clinical_admin')),
  locale            text        NOT NULL DEFAULT 'en' CHECK (locale IN ('en','bn')),
  status            text        NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  phone_verified_at timestamptz,
  email_verified_at timestamptz,
  totp_secret       text,                                   -- base32; set only for admin accounts
  totp_last_step    bigint,                                 -- last accepted 30 s window: a code can't be replayed
  failed_logins     integer     NOT NULL DEFAULT 0,
  locked_until      timestamptz,
  last_login_at     timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE otp_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purpose     text        NOT NULL CHECK (purpose IN ('verify','login','reset_password')),
  target      text        NOT NULL,                          -- normalised phone or email
  code_hash   text        NOT NULL,                          -- HMAC-SHA256, never the raw code
  attempts    integer     NOT NULL DEFAULT 0,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_target_idx ON otp_codes (target, purpose, created_at DESC);

CREATE TABLE refresh_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id   uuid        NOT NULL,                          -- one login session = one family; reuse revokes it all
  token_hash  text        NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  rotated_at  timestamptz,                                       -- set ONLY when replaced by a newer token (not on logout/reset/suspend)
  user_agent  text,
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refresh_user_idx ON refresh_tokens (user_id);
CREATE INDEX refresh_family_idx ON refresh_tokens (family_id);

-- A family member may act for a senior only through an accepted link.
CREATE TABLE family_links (
  senior_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relation   text,
  status     text NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending','accepted','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (senior_id, family_id),
  CHECK (senior_id <> family_id)
);

-- ───────────────────────── SilverBox (medications) ─────────────────────────
CREATE TABLE medications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id       uuid    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            text    NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  dosage          text    NOT NULL,
  purpose         text,
  schedule_times  text[]  NOT NULL CHECK (cardinality(schedule_times) > 0),   -- {'08:00','21:00'} local time
  reminder        boolean NOT NULL DEFAULT true,
  stock_remaining integer NOT NULL DEFAULT 0 CHECK (stock_remaining >= 0),
  stock_total     integer NOT NULL DEFAULT 0 CHECK (stock_total >= 0),
  refill_date     date,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX medications_senior_idx ON medications (senior_id) WHERE active;

CREATE TABLE medication_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id  uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  senior_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  scheduled_time text NOT NULL CHECK (scheduled_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  status         text NOT NULL CHECK (status IN ('taken','skipped')),
  taken_at       timestamptz,
  source         text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','device')),
  logged_by      uuid REFERENCES users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (medication_id, scheduled_date, scheduled_time)     -- makes "mark as taken" idempotent
);
CREATE INDEX medication_logs_senior_date_idx ON medication_logs (senior_id, scheduled_date);

-- ───────────────────────── Care360 (records, prescriptions, vitals) ─────────────────────────
CREATE TABLE health_metrics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('blood_pressure','heart_rate','blood_sugar','weight')),
  value1      numeric NOT NULL,           -- systolic / bpm / mg-dL / kg
  value2      numeric,                    -- diastolic (blood_pressure only)
  recorded_at timestamptz NOT NULL DEFAULT now(),
  recorded_by uuid REFERENCES users(id)
);
CREATE INDEX health_metrics_idx ON health_metrics (senior_id, kind, recorded_at DESC);

CREATE TABLE health_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  category    text NOT NULL DEFAULT 'General',
  provider    text,
  record_date date NOT NULL DEFAULT current_date,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed')),
  file_key    text,                        -- storage key, never a user-supplied path
  file_name   text,
  file_mime   text,
  file_size   integer,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX health_records_idx ON health_records (senior_id, record_date DESC);

CREATE TABLE prescriptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medication        text NOT NULL,
  dosage            text NOT NULL,
  prescribed_by     text,
  start_date        date,
  refills_remaining integer NOT NULL DEFAULT 0 CHECK (refills_remaining >= 0),
  status            text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE refill_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  senior_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','rejected','fulfilled')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ───────────────────────── TeleHealth ─────────────────────────
CREATE TABLE doctors (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  specialty        text NOT NULL,
  designation      text,
  hospital         text,
  rating           numeric(2,1) NOT NULL DEFAULT 0,
  reviews_count    integer NOT NULL DEFAULT 0,
  experience_years integer NOT NULL DEFAULT 0,
  fee_bdt          integer NOT NULL CHECK (fee_bdt >= 0),
  about            text,
  active           boolean NOT NULL DEFAULT true
);

CREATE TABLE appointments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id     uuid NOT NULL REFERENCES doctors(id),
  starts_at     timestamptz NOT NULL,
  type          text NOT NULL DEFAULT 'video' CHECK (type IN ('video','in_person','chat')),
  reason        text,
  location      text,
  status        text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','completed','cancelled')),
  diagnosis     text,
  consult_notes text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
-- A doctor cannot be double-booked for the same slot.
CREATE UNIQUE INDEX appointments_slot_uniq ON appointments (doctor_id, starts_at) WHERE status <> 'cancelled';
CREATE INDEX appointments_senior_idx ON appointments (senior_id, starts_at);

CREATE TABLE record_shares (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id  uuid NOT NULL REFERENCES health_records(id) ON DELETE CASCADE,
  doctor_id  uuid NOT NULL REFERENCES doctors(id),
  senior_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ───────────────────────── ElderLink (caregivers) ─────────────────────────
CREATE TABLE caregivers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  rating           numeric(2,1) NOT NULL DEFAULT 0,
  reviews_count    integer NOT NULL DEFAULT 0,
  experience_years integer NOT NULL DEFAULT 0,
  specialties      text[] NOT NULL DEFAULT '{}',
  hourly_rate_bdt  integer NOT NULL CHECK (hourly_rate_bdt > 0),
  area             text,
  verified         boolean NOT NULL DEFAULT false,
  available_from   date NOT NULL DEFAULT current_date,
  active           boolean NOT NULL DEFAULT true
);

CREATE TABLE caregiver_bookings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  caregiver_id uuid NOT NULL REFERENCES caregivers(id),
  starts_at    timestamptz NOT NULL,
  ends_at      timestamptz NOT NULL,
  services     text[] NOT NULL DEFAULT '{}',
  notes        text,
  total_bdt    integer NOT NULL CHECK (total_bdt >= 0),
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX caregiver_bookings_senior_idx ON caregiver_bookings (senior_id, starts_at);

-- ───────────────────────── NutriSenior ─────────────────────────
CREATE TABLE meal_plans (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  dietitian         text,
  tags              text[] NOT NULL DEFAULT '{}',
  meals             text[] NOT NULL DEFAULT '{}',
  price_per_day_bdt integer NOT NULL CHECK (price_per_day_bdt >= 0),
  rating            numeric(2,1) NOT NULL DEFAULT 0,
  active            boolean NOT NULL DEFAULT true
);

CREATE TABLE menu_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  meal_type   text NOT NULL CHECK (meal_type IN ('Breakfast','Lunch','Dinner','Snack')),
  calories    integer,
  protein_g   integer,
  tags        text[] NOT NULL DEFAULT '{}',
  price_bdt   integer NOT NULL CHECK (price_bdt >= 0),
  active      boolean NOT NULL DEFAULT true
);

CREATE TABLE meal_orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id       uuid REFERENCES meal_plans(id),
  items         jsonb NOT NULL DEFAULT '[]',           -- [{menuItemId, name, qty, priceBdt}] snapshot at order time
  total_bdt     integer NOT NULL CHECK (total_bdt >= 0),
  delivery_at   timestamptz,
  address       text,
  status        text NOT NULL DEFAULT 'placed'
                CHECK (status IN ('placed','preparing','out_for_delivery','delivered','cancelled')),
  rating        integer CHECK (rating BETWEEN 1 AND 5),
  feedback      text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meal_orders_senior_idx ON meal_orders (senior_id, created_at DESC);

-- ───────────────────────── Community & AgeWell ─────────────────────────
CREATE TABLE events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  category    text NOT NULL,
  starts_at   timestamptz NOT NULL,
  ends_at     timestamptz NOT NULL,
  location    text,
  mode        text NOT NULL DEFAULT 'in-person' CHECK (mode IN ('in-person','virtual')),
  capacity    integer NOT NULL CHECK (capacity > 0),
  active      boolean NOT NULL DEFAULT true,
  CHECK (ends_at > starts_at)
);
CREATE INDEX events_starts_idx ON events (starts_at) WHERE active;

CREATE TABLE event_rsvps (
  event_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder   boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

CREATE TABLE chat_groups (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE chat_group_members (
  group_id uuid NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  user_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
CREATE TABLE chat_messages (
  id         bigserial PRIMARY KEY,
  group_id   uuid NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_idx ON chat_messages (group_id, id DESC);

CREATE TABLE living_rooms (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  type           text NOT NULL,
  size_sqft      integer,
  floor          text,
  features       text[] NOT NULL DEFAULT '{}',
  price_month_bdt integer NOT NULL CHECK (price_month_bdt >= 0),
  available_from date NOT NULL DEFAULT current_date,
  active         boolean NOT NULL DEFAULT true
);
CREATE TABLE room_applications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id    uuid NOT NULL REFERENCES living_rooms(id),
  move_in_on date,
  note       text,
  status     text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','approved','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX room_applications_open_uniq ON room_applications (user_id, room_id) WHERE status IN ('submitted','under_review');
CREATE TABLE facility_bookings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  facility   text NOT NULL,
  starts_at  timestamptz NOT NULL,
  ends_at    timestamptz NOT NULL,
  purpose    text,
  status     text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

-- ───────────────────────── GoldenCare (mentors) ─────────────────────────
CREATE TABLE mentors (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  expertise        text NOT NULL,
  experience       text,
  skills           text[] NOT NULL DEFAULT '{}',
  rate_bdt_hour    integer NOT NULL CHECK (rate_bdt_hour >= 0),
  rating           numeric(2,1) NOT NULL DEFAULT 0,
  reviews_count    integer NOT NULL DEFAULT 0,
  verified         boolean NOT NULL DEFAULT false,
  bio              text,
  availability     text,
  active           boolean NOT NULL DEFAULT true
);
CREATE TABLE mentor_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id    uuid NOT NULL REFERENCES mentors(id),
  topic        text NOT NULL,
  starts_at    timestamptz NOT NULL,
  duration_min integer NOT NULL DEFAULT 60 CHECK (duration_min BETWEEN 15 AND 240),
  type         text NOT NULL DEFAULT 'video' CHECK (type IN ('video','chat')),
  status       text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','completed')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ───────────────────────── Rewards (append-only ledger) ─────────────────────────
CREATE TABLE points_ledger (
  id         bigserial PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta      integer NOT NULL CHECK (delta <> 0),
  reason     text NOT NULL,
  action_key text,                                     -- e.g. 'health_checkin'; used for once-per-day rules
  local_day  date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX points_ledger_user_idx ON points_ledger (user_id, id DESC);
-- Earning the same action twice on one day is impossible at the database level.
CREATE UNIQUE INDEX points_daily_once_uniq ON points_ledger (user_id, action_key, local_day) WHERE action_key IS NOT NULL AND delta > 0;

CREATE TABLE rewards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  cost        integer NOT NULL CHECK (cost > 0),
  category    text NOT NULL,
  active      boolean NOT NULL DEFAULT true
);
CREATE TABLE reward_redemptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id  uuid NOT NULL REFERENCES rewards(id),
  cost       integer NOT NULL,
  code       text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ───────────────────────── Audit log (tamper-resistant) ─────────────────────────
CREATE TABLE audit_logs (
  id           bigserial PRIMARY KEY,
  actor_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_role   text,
  action       text NOT NULL,
  subject_type text,
  subject_id   text,
  metadata     jsonb NOT NULL DEFAULT '{}',
  ip           text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_idx ON audit_logs (created_at DESC);
CREATE INDEX audit_logs_actor_idx ON audit_logs (actor_id, created_at DESC);

CREATE FUNCTION audit_logs_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER audit_logs_no_update BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_immutable();

-- ───────────────────────── AI ─────────────────────────
CREATE TABLE ai_conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE ai_messages (
  id              bigserial PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            text NOT NULL CHECK (role IN ('user','assistant')),
  content         text NOT NULL,
  safety_flag     text,                                -- 'emergency' when the deterministic screen fired
  source          text,                                -- 'claude' | 'fallback' | 'safety'
  model           text,
  input_tokens    integer,
  output_tokens   integer,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_messages_conv_idx ON ai_messages (conversation_id, id);
CREATE INDEX ai_messages_user_day_idx ON ai_messages (user_id, created_at) WHERE role = 'user';

-- Generated content is cached per user/kind/day: bounds cost and keeps the page stable across reloads.
CREATE TABLE ai_digests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('daily','family_weekly')),
  for_date   date NOT NULL,
  locale     text NOT NULL,
  content    jsonb NOT NULL,
  source     text NOT NULL,
  model      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject_id, kind, for_date, locale)
);
