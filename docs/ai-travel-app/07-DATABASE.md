# 07 — BASE DE DONNÉES

## Vue d'ensemble
- **Postgres 16** = source de vérité OLTP
- **pgvector** dans la même DB pour embeddings (simplifie ops MVP)
- **Redis** : cache prix, sessions, rate limit, queue temps réel
- **ClickHouse** : analytics + price history (cardinal très élevé)
- **S3** : blobs (photos, PDFs)
- **Elasticsearch** : recherche full-text (POIs, destinations)

## Schéma Postgres (DDL résumé)

```sql
-- =========================================
-- USERS & IDENTITY
-- =========================================
create table users (
  id            uuid primary key default gen_random_uuid(),
  email         citext unique not null,
  email_verified bool default false,
  display_name  text,
  avatar_url    text,
  locale        text default 'fr',
  currency      text default 'EUR',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  deleted_at    timestamptz
);

create table auth_providers (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references users(id) on delete cascade,
  provider       text not null,                -- google | apple | email
  provider_uid   text not null,
  created_at     timestamptz default now(),
  unique (provider, provider_uid)
);

-- =========================================
-- USER PROFILE & MEMORY
-- =========================================
create table user_preferences (
  user_id        uuid primary key references users(id) on delete cascade,
  vibes          text[] default '{}',          -- ex: ['quiet','foodie','nature']
  budget_band    text,                         -- 'low'|'mid'|'high'
  transport_pref text[] default '{}',          -- ['train','flight','any']
  diet           text[] default '{}',
  mobility       text default 'standard',
  updated_at     timestamptz default now()
);

create table user_facts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references users(id) on delete cascade,
  fact           text not null,
  source         text,                         -- 'inferred'|'declared'
  confidence     real,
  embedding      vector(1536),
  created_at     timestamptz default now(),
  superseded_by  uuid references user_facts(id)
);
create index on user_facts using ivfflat (embedding vector_cosine_ops);

-- =========================================
-- TRIPS & ITINERARIES
-- =========================================
create table trips (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references users(id) on delete cascade,
  title          text,
  status         text not null,                -- 'draft'|'planned'|'booked'|'completed'|'cancelled'
  origin         text,                         -- IATA city code ou texte
  destinations   jsonb not null,               -- [{ city, lat, lng, days }]
  date_start     date,
  date_end       date,
  travelers      jsonb not null default '{"adults":1,"children":0}',
  budget_eur     numeric(10,2),
  scenario_key   text,                         -- 'eco'|'balanced'|'comfort'|'custom'
  ai_session_id  uuid,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index on trips (user_id, status);

create table trip_scenarios (
  id             uuid primary key default gen_random_uuid(),
  trip_id        uuid references trips(id) on delete cascade,
  key            text not null,                -- 'eco'|'balanced'|'comfort'
  total_eur      numeric(10,2),
  breakdown      jsonb not null,               -- { transport, lodging, food, activities, buffer }
  data           jsonb not null,               -- full scenario object
  created_at     timestamptz default now(),
  unique (trip_id, key)
);

create table itinerary_days (
  id             uuid primary key default gen_random_uuid(),
  trip_id        uuid references trips(id) on delete cascade,
  day_index      int not null,                 -- 0-based
  date           date,
  notes          text,
  unique (trip_id, day_index)
);

create table itinerary_items (
  id             uuid primary key default gen_random_uuid(),
  day_id         uuid references itinerary_days(id) on delete cascade,
  position       int not null,                 -- ordre dans la journée
  kind           text not null,                -- 'transport'|'lodging'|'activity'|'meal'|'free'
  starts_at      timestamptz,
  ends_at        timestamptz,
  title          text not null,
  details        jsonb,                        -- payload spécifique au kind
  price_eur      numeric(10,2),
  booking_id     uuid references bookings(id),
  poi_id         uuid references pois(id),
  created_at     timestamptz default now()
);
create index on itinerary_items (day_id, position);

-- =========================================
-- BOOKINGS & PAYMENTS
-- =========================================
create table bookings (
  id             uuid primary key default gen_random_uuid(),
  trip_id        uuid references trips(id) on delete cascade,
  user_id        uuid references users(id),
  provider       text not null,                -- 'duffel'|'booking'|'omio'|...
  provider_ref   text,                         -- ID externe
  type           text not null,                -- 'flight'|'train'|'bus'|'hotel'|'activity'
  status         text not null,                -- 'pending'|'confirmed'|'cancelled'|'failed'
  total_eur      numeric(10,2),
  payload        jsonb,
  cancellation_policy jsonb,
  booked_at      timestamptz,
  created_at     timestamptz default now()
);

create table payments (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid references bookings(id),
  stripe_intent  text,
  status         text not null,
  amount_eur     numeric(10,2),
  fee_eur        numeric(10,2),
  refunded_eur   numeric(10,2) default 0,
  created_at     timestamptz default now()
);

-- =========================================
-- INVENTORY (POIs, hôtels enrichis)
-- =========================================
create table pois (
  id             uuid primary key default gen_random_uuid(),
  google_place_id text unique,
  name           text not null,
  city           text,
  country        text,
  lat            double precision,
  lng            double precision,
  category       text[],                       -- ['restaurant','vegan']
  rating         real,
  price_band     int,                          -- 1-4
  metadata       jsonb,
  embedding      vector(1536),
  updated_at     timestamptz default now()
);
create index pois_geo_idx on pois using gist (
  ll_to_earth(lat, lng)                        -- earthdistance extension
);
create index on pois using ivfflat (embedding vector_cosine_ops);

create table hotels (
  id             uuid primary key default gen_random_uuid(),
  booking_id_ext text,                         -- ID Booking
  name           text not null,
  city           text,
  lat            double precision,
  lng            double precision,
  stars          int,
  vibes          text[],
  metadata       jsonb,
  embedding      vector(1536),
  updated_at     timestamptz default now()
);

-- =========================================
-- PRICE TRACKING & ALERTS
-- =========================================
create table price_alerts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references users(id) on delete cascade,
  origin         text,
  destination    text,
  date_window    daterange,
  travelers      jsonb,
  target_eur     numeric(10,2),
  channel        text default 'email',         -- 'email'|'push'
  active         bool default true,
  created_at     timestamptz default now()
);

-- price_history vit dans ClickHouse (cardinal trop élevé pour PG)

-- =========================================
-- AI SESSIONS & MESSAGES
-- =========================================
create table ai_sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references users(id),
  trip_id        uuid references trips(id),
  model          text,
  total_tokens   int default 0,
  cost_eur       numeric(10,4) default 0,
  created_at     timestamptz default now()
);

create table ai_messages (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid references ai_sessions(id) on delete cascade,
  role           text not null,                -- 'user'|'assistant'|'tool'
  content        jsonb not null,
  tokens_in      int,
  tokens_out     int,
  latency_ms     int,
  created_at     timestamptz default now()
);

-- =========================================
-- DOCUMENTS & SHARING
-- =========================================
create table documents (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references users(id),
  trip_id        uuid references trips(id),
  kind           text not null,                -- 'pdf'|'passport'|'visa'|'insurance'|'ticket'
  filename       text,
  s3_key         text,
  size_bytes     int,
  created_at     timestamptz default now()
);

create table trip_shares (
  id             uuid primary key default gen_random_uuid(),
  trip_id        uuid references trips(id) on delete cascade,
  token          text unique not null,
  permission     text default 'view',          -- 'view'|'edit'
  expires_at     timestamptz,
  created_at     timestamptz default now()
);

-- =========================================
-- AUDIT
-- =========================================
create table audit_log (
  id             bigserial primary key,
  user_id        uuid,
  action         text not null,
  target_type    text,
  target_id      uuid,
  meta           jsonb,
  ip             inet,
  user_agent     text,
  created_at     timestamptz default now()
);
```

## Schéma ClickHouse

```sql
create table price_history (
  ts            DateTime,
  search_key    String,                        -- canonical hash de (mode,from,to,date,class)
  provider      LowCardinality(String),
  mode          LowCardinality(String),
  from_iata     LowCardinality(String),
  to_iata       LowCardinality(String),
  depart_date   Date,
  return_date   Date,
  duration_min  UInt32,
  stops         UInt8,
  price_eur     Float32,
  currency_orig LowCardinality(String),
  cabin         LowCardinality(String)
) engine = MergeTree
  partition by toYYYYMM(depart_date)
  order by (search_key, ts);

create table chat_events (
  ts            DateTime,
  user_id       UUID,
  session_id    UUID,
  event         LowCardinality(String),
  latency_ms    UInt32,
  tokens_in     UInt32,
  tokens_out    UInt32,
  model         LowCardinality(String),
  cost_eur      Float32
) engine = MergeTree
  order by (ts);
```

## Stratégie indexation
- **Geo** : extension `earthdistance` (Postgres) sur `pois`/`hotels` ; alternative PostGIS pour V2.
- **Vector** : `ivfflat` pour MVP (suffisant < 1M vecteurs), migration `hnsw` au-delà.
- **Composés** : `(user_id, status)` sur `trips`, `(trip_id, day_index)` sur `itinerary_days`.

## Stratégie cache (Redis)
| Clé | TTL | Contenu |
|---|---|---|
| `price:{hash}` | 6 h | Résultat agrégateur prix |
| `poi:{place_id}` | 24 h | Détails Google Places |
| `session:{token}` | 30 j | Session utilisateur |
| `ratelimit:{user_id}:{route}` | 60 s | Compteur |
| `chat:stream:{id}` | 5 min | État SSE en cours |

## Migrations
- **Outil** : `drizzle-kit` (TS) ou `Prisma migrate` selon choix ORM.
- **Politique** : migrations atomiques, rollback testé, jamais de `DROP COLUMN` en une étape (expand → migrate → contract).

## Backup & recovery
- Snapshots Postgres : quotidiens, rétention 30 j.
- WAL continu : RPO 5 min.
- Tests de restauration mensuels (gameday).

## RGPD
- `users.deleted_at` → anonymisation des PII via cron 30 j après suppression.
- `audit_log` rétention 12 mois max.
- Export utilisateur : endpoint `/me/export` → ZIP JSON + S3 presigned.
