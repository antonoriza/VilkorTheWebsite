# Vilkor — Vilkor

**Vilkor** is a multi-tenant residential property management SaaS. It digitizes every physical interaction within a residential community — payments, tickets, amenity bookings, package tracking, governance polls, and resident communications — into a single, unified, and highly delegable interface.

> North Star KPI: `AgentResolutionRate` > 80% | `units_per_manager` ratio  
> Build order: **Phase 0 ✅ → Phase 1 (current) → Phase 2 → Phase 3**

---

## 🏗 Architecture Overview

```mermaid
graph TB
    subgraph Client["Client — apps/web"]
        direction TB
        WEB["Vite 6 + React 19\nTypeScript · TailwindCSS"]
        ROUTER["React Router v7\nRole-based guards"]
        STORE["useReducer Store
API-backed · optimistic updates"]
        APILIB["apps/web/src/lib/api.ts\nfetch wrapper + auth headers"]
    end

    subgraph Server["Server — apps/api"]
        direction TB
        HONO["Hono 4 on Bun\nHTTP + WebSocket"]
        BETTERAUTH["Better Auth\nSession · Email+PW · RBAC"]
        TENANT_MW["Tenant Middleware\nX-Tenant-ID → per-tenant DB"]
        AUDIT_MW["Audit Middleware\nImmutable audit_log"]
        ROUTES["Route Handlers\n12 domain modules"]
    end

    subgraph Data["Data Layer — SQLite"]
        direction TB
        MASTER_DB[("master.db\nauth + tenant registry")]
        TENANT_DB[("tenant_{id}.db\nper-tenant business data")]
        DRIZZLE["Drizzle ORM\nType-safe schema"]
    end

    subgraph Shared["packages/shared"]
        TYPES["Canonical TypeScript Types\nZod Validators"]
    end

    subgraph Future["🔮 Phase 1 — Not Yet Built"]
        AGENT["Agent Engine\nsrc/agent/"]
        CLASSIFIER["Classifier\nRule-based, bilingual"]
        RESOLVER["Resolver\nDeterministic rules + LLM fallback"]
        ESCALATION["Escalation Engine\nSLA-based routing"]
    end

    WEB --> APILIB
    APILIB -- "REST + Cookies" --> HONO
    HONO --> BETTERAUTH
    HONO --> TENANT_MW
    TENANT_MW --> AUDIT_MW
    AUDIT_MW --> ROUTES
    BETTERAUTH --> MASTER_DB
    ROUTES --> DRIZZLE
    DRIZZLE --> TENANT_DB
    Shared --> Client
    Shared --> Server
    Future -. "planned" .-> ROUTES
```

---

## 📦 Monorepo Structure

```mermaid
graph LR
    ROOT["Vilkor/\nBun Workspaces"]

    ROOT --> APPS["apps/"]
    ROOT --> PKGS["packages/"]
    ROOT --> DOCKER["docker/\nDockerfile + compose"]
    ROOT --> DOCS["docs/\ndesignDoc · implementationPlan"]

    APPS --> WEB_APP["apps/web\n@vilkor/web\nVite · React · TailwindCSS"]
    APPS --> API_APP["apps/api\n@vilkor/api\nBun · Hono · Drizzle"]

    PKGS --> SHARED_PKG["packages/shared\n@vilkor/shared\nTypes · Validators"]

    WEB_APP --> WEB_SRC["src/\n  App.tsx\n  features/   (10 domains)\n  core/       (auth, store)\n  layouts/\n  lib/api.ts"]

    API_APP --> API_SRC["src/\n  index.ts    (Hono entry)\n  auth.ts     (Better Auth)\n  db/         (Drizzle + migrations)\n  routes/     (12 handlers)\n  middleware/ (tenant, audit, rbac)\n  ws/         (WebSocket hub)"]
```

---

## 🔐 Authentication & Multi-Tenancy

```mermaid
sequenceDiagram
    participant B as Browser
    participant H as Hono API
    participant BA as Better Auth
    participant MDB as master.db
    participant TDB as tenant_{id}.db

    B->>H: POST /api/auth/sign-in
    H->>BA: emailAndPassword handler
    BA->>MDB: validate credentials, create session
    BA-->>B: Set-Cookie (session)

    B->>H: GET /api/residents (+ X-Tenant-ID header)
    H->>BA: getSession(headers)
    BA-->>H: { user, session }
    H->>H: tenantMiddleware — resolve tenant DB
    H->>TDB: Drizzle query (scoped to tenant)
    TDB-->>H: rows
    H-->>B: JSON response

    Note over H,MDB: master.db: auth tables + tenant registry
    Note over H,TDB: tenant.db: all business data per building
```

---

## 🗄 Database Design

Two databases, strictly separated:

### master.db — Auth & Registry

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : "has"
    USERS ||--o{ USER_TENANTS : "belongs to"
    TENANTS ||--o{ USER_TENANTS : "contains"

    USERS {
        text id PK
        text name
        text email
        text emailVerified
    }
    TENANTS {
        text id PK
        text name
        text slug
    }
    USER_TENANTS {
        text user_id FK
        text tenant_id FK
        text role
        text apartment
    }
```

### tenant.db — Business Domain (per-building)

```mermaid
erDiagram
    RESIDENTS ||--o{ PAGOS : "makes"
    RESIDENTS ||--o{ ADEUDOS : "owes"
    RESIDENTS ||--o{ TICKETS : "submits"
    RESIDENTS ||--o{ PAQUETES : "receives"
    RESIDENTS ||--o{ RESERVACIONES : "books"
    RESIDENTS ||--o{ AVISO_TRACKING : "acknowledges"
    TICKETS ||--o{ TICKET_ACTIVITIES : "has"
    AVISOS ||--o{ AVISO_TRACKING : "tracked by"
    VOTACIONES ||--o{ POLL_OPTIONS : "contains"
    POLL_OPTIONS ||--o{ POLL_VOTES : "receives"

    RESIDENTS {
        text id PK
        text name
        text apartment
        text tower
        text email
    }
    TICKETS {
        text id PK
        integer number
        text subject
        text category
        text priority
        text status
        text resident_id FK
    }
    PAGOS {
        text id PK
        text resident_id FK
        real amount
        text status
        text month_key
    }
    VOTACIONES {
        text id PK
        text title
        text status
        text period_start
        text period_end
    }
    AUDIT_LOG {
        text id PK
        text actor_id
        text action
        text resource
        integer status_code
        text created_at
    }
```

---

## 🌐 API Surface

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/health` | Server health check | None |
| POST | `/api/auth/sign-in` | Email + password login | None |
| GET | `/api/me` | Current user + tenant info | Session |
| GET | `/api/residents` | List residents | Tenant |
| POST | `/api/residents` | Create resident | Admin |
| GET/POST/PATCH/DELETE | `/api/pagos` | Payments CRUD | Tenant |
| GET/POST/PATCH/DELETE | `/api/tickets` | Support tickets | Tenant |
| GET/POST/PATCH/DELETE | `/api/avisos` | Announcements | Admin |
| GET/POST/PATCH/DELETE | `/api/paquetes` | Package tracking | Tenant |
| GET/POST/PATCH/DELETE | `/api/amenidades` | Amenity bookings | Tenant |
| GET/POST/PATCH/DELETE | `/api/votaciones` | Governance polls | Tenant |
| GET/POST/PATCH | `/api/egresos` | Expenses | Admin |
| GET/POST/PATCH | `/api/inventory` | Inventory | Admin |
| GET | `/api/dashboard` | Aggregated stats | Admin |
| GET | `/api/audit` | Audit log | Admin |
| GET/PUT | `/api/config` | Building config | Admin |

All tenant-scoped routes require `X-Tenant-ID` header and valid session cookie.

---

## 🖥 Frontend Routes & Roles

```mermaid
graph TD
    Login["/login\n(public)"] --> Auth{Authenticated?}
    Auth -->|No| Login
    Auth -->|Yes, residente| RD["/dashboard\nResidentDashboard"]
    Auth -->|Yes, admin/operador| AD["/admin\nAdminDashboard"]

    RD --> AV["/avisos\nAnnouncements"]
    RD --> PA["/pagos\nPayments"]
    RD --> PQ["/paqueteria\nPackages"]
    RD --> AM["/amenidades\nAmenities"]
    RD --> VO["/votaciones\nPolls"]
    RD --> TK["/tickets\nTickets"]
    RD --> RC["/mi-configuracion\nResident Settings"]

    AD --> AV
    AD --> PA
    AD --> PQ
    AD --> AM
    AD --> VO
    AD --> TK
    AD --> US["/usuarios\nUser Management\n(admin only)"]
    AD --> CF["/configuracion\nBuilding Config\n(admin only)"]

    classDef resident fill:#dbeafe,stroke:#2563eb,color:#1e3a5f
    classDef admin fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef shared fill:#f3e8ff,stroke:#7c3aed,color:#3b0764
    classDef protected fill:#fef9c3,stroke:#ca8a04,color:#713f12

    class RD,RC resident
    class AD,US,CF admin
    class AV,PA,PQ,AM,VO,TK shared
```

---

## 🔮 Phase 1 — Agent Engine (Planned, Not Built)

The Agent Engine is the next major milestone. It will sit between the UI's ticket submission and the store/API — invisible to the resident, transforming every submission into a classified, routed event.

```mermaid
flowchart TD
    Input(["Resident Submits\nTicket / Text / Sensor"]) --> BuildEvent["buildAgentEvent()\nMap form data → AgentEvent"]
    BuildEvent --> Classify["Classifier\nKeyword tree · Bilingual ES+EN\nPure function · Zero latency"]

    Classify -->|"confidence ≥ 0.6"| Classified["ClassifiedEvent\n+ EventClass\n+ confidence score"]
    Classify -->|"confidence < 0.6"| Unclassified["unclassified\n→ escalate immediately"]

    Classified --> Rules["Rule Engine\nresidential.ts rules\nDeclarative · Priority-ordered"]

    Rules -->|"resolves: true"| AutoResolved["status: resolved\nrequires_human: false\n✓ No LLM call"]
    Rules -->|"resolves: false"| NeedsHuman["status: escalated\nrequires_human: true"]
    Unclassified --> NeedsHuman

    NeedsHuman --> LLM["LLM Adapter\nAnthropic API\nGenerates HumanContext only"]
    LLM -->|"success"| HumanCtx["HumanContext\n· summary\n· recommended_action\n· urgency"]
    LLM -->|"failure"| Fallback["Templated Fallback\nNo crash · Degraded context"]

    AutoResolved --> Dispatch["dispatch AGENT_RESOLUTION_COMPLETE\nStore state updated"]
    HumanCtx --> Dispatch
    Fallback --> Dispatch

    Dispatch --> ExceptionQueue["ExceptionQueue\nAdmin Dashboard\n(Phase 3 component)"]
    Dispatch --> Ticket["ADD_TICKET\nExisting TicketsPage\nunchanged for resident"]

    classDef done fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef planned fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef llm fill:#ede9fe,stroke:#7c3aed,color:#3b0764
    classDef notbuilt fill:#fee2e2,stroke:#dc2626,color:#7f1d1d

    class Input,BuildEvent done
    class Classify,Classified,Rules,AutoResolved planned
    class LLM,HumanCtx,Fallback llm
    class NeedsHuman,Dispatch,ExceptionQueue notbuilt
```

---

## 📊 Current Phase Tracker

```mermaid
gantt
    title Vilkor — Build Phases
    dateFormat  YYYY-MM
    section Phase 0 — Prototype
    UI design & navigation validated     :done, p0, 2026-01, 1w
    section Phase 1 — Infrastructure (complete)
    Monorepo + Bun workspaces            :done, p1a, after p0, 2w
    Multi-tenant SQLite (20 tables)      :done, p1b, after p1a, 2w
    Better Auth + RBAC middleware        :done, p1c, after p1a, 2w
    12 REST route modules                :done, p1e, after p1b, 2w
    API-backed store (optimistic sync)   :done, p1f, after p1e, 2w
    section Phase 1 — Agent Engine (next)
    Agent classifier (bilingual)         :active, p1g, after p1f, 2w
    Resolution engine + LLM adapter      :p1h, after p1g, 2w
    Escalation engine                    :p1i, after p1h, 1w
    section Phase 2 — Gaps
    WebSocket client integration         :p2a, after p1i, 1w
    Real push notifications              :p2b, after p1i, 1w
    section Phase 3 — Production UI
    ExceptionQueue component             :p3a, after p2a, 2w
    AgentMetricsBar                      :p3b, after p2a, 1w
    Resident status feedback             :p3c, after p3b, 1w
```

---

## ✅ What Works Today / ⚠️ What Doesn't

| Area | Status | Notes |
|------|--------|-------|
| Multi-tenant auth (login/session) | ✅ Working | Better Auth + master.db |
| Per-tenant SQLite isolation | ✅ Working | `X-Tenant-ID` middleware |
| Residents CRUD | ✅ Working | Full REST + Drizzle |
| Payments (pagos) | ✅ Working | Full REST |
| Support tickets | ✅ Working | Activities, priority, status |
| Announcements (avisos) | ✅ Working | Pinning, attachments, tracking |
| Package tracking | ✅ Working | Porter flow |
| Amenity reservations | ✅ Working | Conflict detection |
| Governance polls | ✅ Working | 1-unit-1-vote enforced |
| Expenses (egresos) | ✅ Working | Admin only |
| Building config | ✅ Working | JSON document store |
| Audit log | ✅ Working | Immutable, every mutation |
| API-backed store with optimistic sync | ✅ Working | `loadStateFromAPI` + `syncActionToAPI` on every dispatch |
| WebSocket hub (server-side) | ✅ Working | Bun pub/sub, per-tenant topics |
| Docker deploy | ✅ Files exist | `docker/Dockerfile` + compose — not smoke-tested |
| **WebSocket client** | ⚠️ Not wired | Server broadcasts; web app has no `WebSocket` connection |
| **Agent classifier** | ⚠️ Not built | Phase 1 next milestone |
| **Resolution engine** | ⚠️ Not built | Phase 1 |
| **Escalation engine** | ⚠️ Not built | Phase 1 |
| **ExceptionQueue UI** | ⚠️ Not built | Phase 3 |
| **AgentMetricsBar** | ⚠️ Not built | Phase 3 |
| **Resident status feedback** | ⚠️ Not built | Phase 3 |
| **LLM context generation** | ⚠️ Not built | Phase 1 |
| **Real push notifications** | ⚠️ Not built | Unscheduled |

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Runtime | **Bun** | JS runtime + package manager |
| API Framework | **Hono 4** | Ultra-fast HTTP + WebSocket |
| Auth | **Better Auth 1.2** | Sessions, email+pw, RBAC |
| ORM | **Drizzle ORM** | Type-safe SQLite schema |
| Database | **SQLite** (bun:sqlite) | Embedded per-tenant isolation (20 tables) |
| State | **useReducer** + React Context | Optimistic updates, API-synced on every mutation |
| Frontend | **Vite 6 + React 19** | SPA with HMR |
| Styling | **TailwindCSS 3** | Utility-first CSS |
| Routing | **React Router v7** | Client-side navigation |
| Shared types | **Zod** | Runtime validation |
| Validation | **@hono/zod-validator** | Request body validation |
| Container | **Docker** | Production deploy |
| Monorepo | **Bun Workspaces** | `apps/*` + `packages/*` |

> **No Supabase.** Auth, database, and real-time are all self-hosted via Better Auth + SQLite + Hono WebSocket. No external managed services required beyond an LLM API key (Phase 1).

---

## 🚀 Development Setup

### Prerequisites
- **Bun** ≥ 1.1 — [bun.sh](https://bun.sh)
- **Node.js** not required (Bun handles everything)

### Install

```bash
bun install
```

### Run (both apps simultaneously)

```bash
bun run dev          # starts api (port 3000) + web (port 5173)
bun run dev:api      # API only
bun run dev:web      # web only
```

### Database

```bash
# Generate new migration from schema changes
bun run --filter=@vilkor/api db:generate

# Run migrations
bun run --filter=@vilkor/api db:migrate

# Seed with demo data
bun run --filter=@vilkor/api db:seed
```

### Type-check all packages

```bash
bun run typecheck
```

### Docker

```bash
docker compose -f docker/docker-compose.yml up
```

### Environment Variables

Copy `.env.example` to `apps/api/.env`:

```bash
cp .env.example apps/api/.env
```

| Variable | Description |
|----------|-------------|
| `PORT` | API server port (default: 3000) |
| `CORS_ORIGIN` | Web app origin (default: http://localhost:5173) |
| `BETTER_AUTH_SECRET` | 32-char random string for session signing |
| `BETTER_AUTH_URL` | API base URL |
| `ADMIN_EMAIL` | Seed admin email |
| `ADMIN_PASSWORD` | Seed admin password |

---

## 🗺 Areas of Opportunity

### High Priority
- **Agent Engine** — The classifier and resolver are designed but unbuilt. This is the core differentiator of the product (Phase 1 next milestones).
- **WebSocket client** — The server-side pub/sub hub exists and broadcasts per-tenant events. The web app has zero WebSocket connection code — live updates for tickets, packages, and notifications are not working despite the infrastructure being ready.

### Medium Priority
- **Push notifications** — Notification stubs exist in the plan; real Web Push / FCM integration is unscheduled.
- **PDF receipts** — `@react-pdf/renderer` is installed but PDF generation routes aren't wired end-to-end.
- **File storage** — Receipt and attachment data is stored as base64 in SQLite (noted in schema as "Phase C: move to filesystem"). This will hit row-size limits at scale.
- **E2E test suite** — No Playwright or integration tests exist yet. Unit tests are planned for the agent layer.

### Low Priority / Future
- **LLM provider abstraction** — The plan specifies Anthropic. An adapter layer would allow swapping providers.
- **Offline support** — The PWA / IndexedDB + background sync mentioned in the design doc is not in the current architecture.
- **Multi-language UI** — The API supports bilingual classification (ES + EN) but the web UI has no i18n layer.
- **Billing / Stripe** — Mentioned in early design docs but not in the current build plan.

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| [AGENTS.md](AGENTS.md) | Engineering process, phase gates, Definition of Done per milestone |
| [implementationPlan.md](implementationPlan.md) | Detailed sprint tasks, code templates, integration test scenarios |
| [docs/designDoc.md](docs/designDoc.md) | Original design document v5.0 (historical reference) |

---

*Vilkor — The Operating System for Modern Living.*
