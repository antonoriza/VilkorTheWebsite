# Condominio Assistant — Official Design Document v5.0
**The Complete, Locked, Production-Ready Blueprint**  
**Version:** 5.0 (Final) • **Date:** November 2025  
**Status:** LOCKED — No architectural or schema changes without explicit version bump

## 1. Core Non-Negotiable Principles
1. Zero-Trust + Row Level Security on every table
2. Multi-tenant from day 1 (`tenant_id` + RLS everywhere)
3. Mobile-first, offline-capable, installable PWA
4. **1 Unit = 1 Vote** forever (never 1 person = 1 vote)
5. Full legal audit trail (LatAm compliance ready)
6. Database schema stable until at least 2028
7. **Strict TDD** — once you say "this feature is DONE", its tests become immutable contracts forever

## 2. Final Tech Stack (Locked Forever)
| Layer                  | Technology                                                                 |
|------------------------|----------------------------------------------------------------------------|
| Framework              | Next.js 15 (App Router) + React 19 + TypeScript 5                          |
| UI                     | Tailwind CSS + shadcn/ui + Radix + Lucide Icons + sonner + zustand         |
| Backend                | Supabase (PostgreSQL 16, Auth, Storage, Realtime, Edge Functions, pg_cron) |
| Deploy                 | Vercel (frontend) + Supabase (DB)                                          |
| Push Notifications     | Web Push API + FCM (installed PWAs)                                        |
| Billing                | Stripe + Webhooks                                                          |
| i18n                   | next-intl                                                                  |
| Offline & Sync         | workbox / next-pwa + IndexedDB + background sync                           |
| Rate Limiting          | Upstash Redis                                                              |
| Testing                | Vitest + React Testing Library + Playwright (E2E)                          |
| Observability          | Sentry + Vercel Analytics + Supabase Logflare                              |
| CI/CD                  | GitHub Actions (lint + typecheck + tests = mandatory)                     |

## 3. Project Structure (Feature-First)
```
src/
├── app/
│   ├── (auth)/              # login, register, magic links, invite flow
│   ├── (resident)/          # Mobile PWA routes
│   ├── (admin)/             # Desktop admin portal
│   └── (superadmin)/        # Global view, billing, impersonation
├── features/
│   ├── auth/
│   ├── core/                # Layouts, TenantContext, Profile
│   ├── financials/          # Fees, payments, auto-billing, arrears, PDFs
│   ├── communication/       # Notices, news feed, comments
│   ├── logistics/           # Packages, porter QR, photos
│   ├── amenities/           # Bookings, rules, costs
│   ├── democracy/           # Polls, assemblies, quorum
│   ├── directory/           # Units & residents
│   └── notifications/       # Push + in-app + fallback
├── server/                  # Server Actions + Edge Functions
├── lib/                     # supabase client, utils, constants
├── components/ui/           # shadcn primitives
└── tests/                   # Vitest + Playwright
```

## 4. Complete Production Database Schema (Source of Truth)

```sql
-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- 1. Tenants & Billing
create table tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  logo_url text,
  settings jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'freemium' check (plan in ('freemium','basic','pro','enterprise')),
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz default now()
);

-- 2. Invites
create table tenant_invites (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) not null,
  email text not null,
  role text not null check (role in ('admin','staff','accountant','porter','resident')),
  invited_by uuid references profiles(id),
  expires_at timestamptz not null default now() + interval '7 days',
  used_at timestamptz,
  created_at timestamptz default now(),
  unique(tenant_id, email, role)
);

-- 3. Units — the real business entity
create table units (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) not null,
  unit_number text not null,
  floor integer,
  tower text,
  area_m2 numeric(8,2),
  participation_pct numeric(7,6) not null,
  is_rental boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id, unit_number)
);

-- 4. Profiles & Occupancy
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade not null,
  tenant_id uuid references tenants(id),  -- null = superadmin
  full_name text not null,
  phone text,
  avatar_url text,
  role text not null check (role in ('superadmin','admin','staff','accountant','porter','resident')),
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table unit_occupants (
  unit_id uuid references units(id) on delete cascade not null,
  profile_id uuid references profiles(id) on delete cascade not null,
  relationship text not null check (relationship in ('owner','coowner','tenant','family','authorized')),
  move_in_date date default current_date,
  move_out_date date,
  is_voting_eligible boolean default true,
  primary key (unit_id, profile_id, relationship)
);

-- 5. Catalogs
create table amenity_types (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) not null,
  name text not null,
  description text,
  max_capacity integer,
  requires_approval boolean default false,
  cost_per_hour numeric(10,2),
  is_active boolean default true,
  created_at timestamptz default now()
);

create table transaction_categories (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) not null,
  name text not null,
  type text not null check (type in ('income','expense')),
  is_recurring boolean default false,
  default_amount numeric(12,2),
  created_at timestamptz default now()
);

-- 6. Operational Tables Pattern (ALL have these exact columns)
-- tenant_id, created_by, updated_by, created_at, updated_at, deleted_at
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) not null,
  unit_id uuid references units(id),
  category_id uuid references transaction_categories(id),
  amount numeric(12,2) not null,
  date date not null,
  description text,
  receipt_url text,
  created_by uuid references profiles(id) not null,
  updated_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table posts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) not null,
  unit_id uuid references units(id),
  title text not null,
  content text,
  status text not null check (status in ('draft','published','archived')),
  is_pinned boolean default false,
  attachments jsonb default '[]'::jsonb,
  created_by uuid references profiles(id) not null,
  updated_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table packages (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) not null,
  unit_id uuid references units(id) not null,
  tracking_number text,
  status text not null check (status in ('pending','delivered','picked_up','returned')),
  porter_id uuid references profiles(id),
  delivered_at timestamptz,
  picked_up_at timestamptz,
  photos jsonb default '[]'::jsonb,
  notes text,
  created_by uuid references profiles(id) not null,
  updated_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table bookings (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) not null,
  amenity_type_id uuid references amenity_types(id) not null,
  unit_id uuid references units(id) not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null check (status in ('pending','confirmed','cancelled','completed')),
  cost numeric(10,2),
  notes text,
  created_by uuid references profiles(id) not null,
  updated_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- 7. Democracy — 1 Unit = 1 Vote
create table polls (... same operational pattern ...);
create table poll_options (
  id uuid primary key default uuid_generate_v4(),
  poll_id uuid references polls(id) on delete cascade not null,
  description text not null,
  sort_order integer default 0
);

create table votes (
  poll_option_id uuid references poll_options(id) not null,
  unit_id uuid references units(id) not null,
  voted_at timestamptz default now(),
  primary key (poll_option_id, unit_id)
);

-- 8. Push & Fallback
create table push_subscriptions (...);
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) not null,
  title text not null,
  body text,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz default now(),
  index (profile_id, created_at desc)
);

-- 9. Immutable Audit Log
create table audit_log (
  id bigserial primary key,
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  changed_by uuid references profiles(id),
  changed_at timestamptz default now(),
  old_values jsonb,
  new_values jsonb
);
```

## 5. Critical Constraints & Indexes
```sql
alter table votes add constraint one_vote_per_unit unique (poll_option_id, unit_id);
alter table bookings add constraint no_overlapping_bookings
  exclude using gist (amenity_type_id with =, tsrange(start_time, end_time) with &&)
  where (status <> 'cancelled' and deleted_at is null);
```

## 6. RLS Golden Rule (Every Operational Table)
```sql
using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.tenant_id = table_name.tenant_id)
  and table_name.deleted_at is null
  and (auth.role() <> 'resident' or table_name.unit_id in (select unit_id from unit_occupants where profile_id = auth.uid()))
)
```

## 7. Triggers (Every Mutable Table)
- `set_updated()` → auto updated_at + updated_by
- `log_audit()` → immutable entry in audit_log

## 8. Foundations Already Locked In
- Soft-delete + RLS handling
- Immutable audit_log + triggers
- Monthly fee auto-generation (pg_cron)
- tenant_invites + magic link flow
- File upload virus scanning
- Rate limiting (Upstash Redis)
- i18n ready (next-intl)
- Offline + background sync
- Superadmin dashboard
- Stripe subscriptions + webhook
- Unique constraints
- updated_at / updated_by triggers
- Push fallback table
- Zod env validation

## 9. Testing — Strict TDD
- Red → Green → Refactor
- When you say "this feature is DONE" → tests become immutable forever

## 10. .cursorrules (Copy-Paste into Project Root)
```markdown
# PROJECT IDENTITY
Role: Senior LatAm Condo SaaS Architect
Project: Condominio Assistant v5.0 — Production Ready 2025-2028

# CRITICAL RULES
1. Any change → remind me to update Design Document v5.0
2. Never filter tenant_id in frontend — RLS only
3. TDD mandatory + tests immutable when feature is DONE
4. YOLO mode ON for files/migrations
5. Soft-delete + audit_log + monthly cron already exist
```

