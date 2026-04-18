# Project: PropertyPulse (Modular Property OS)
> **Vision:** Transform any physical space into a smart, programmable asset through a micro-module architecture.
> **Mission:** Provide a robust Kernel that allows administrators to "build" their ideal Property OS using industry-specific building blocks (plugins).

## 1. Core Principles & Workflow (Agent Rules)
- **The "Lego" Approach**: Anything that isn't core Auth or Navigation must be a "Plugin".
- **Atomic Entity Model**: Objects are `Assets`, people are `Users` with `Permissions`, and actions are `Events`.
- **Plan Mode Default**: Enter plan mode for ANY non-trivial task (3+ steps). Write specs before coding.
- **Verification**: Never mark a task complete without proving it works. "Would a staff engineer approve this?"
- **Self-Improvement Loop**: Update `tasks/lessons.md` after any user correction to prevent repeating mistakes.

## 2. Tech Stack
- **Frontend**: Vite 6 + React 19 + TypeScript.
- **Styling**: Tailwind CSS v3.4 (utilizing `container-queries` for modular responsiveness).
- **Icons**: Material Symbols Outlined.
- **Typography**: `Manrope` (Headlines) & `Inter` (UI/Sans).
- **Persistence**: Hybrid (Current: LocalStorage `propertypulse-store` | Target: Supabase).

## 3. Core Architecture: "The Universal Kernel"

### Context & State Management
- **`AuthContext`**: Manages `role` (Admin, Resident, Staff, Guest) and **`PropertyType`** (Hotel, Factory, Condo, Airbnb).
- **`StoreContext`**: Centralized state via `useReducer`. 
  - *Refactor Goal*: Partition the store into `state.core` and `state.plugins.[name]`.
- **`PluginOrchestrator`**: Logic to enable/disable feature sets based on the active `PropertyType`.

### Design System: "Architectural Minimalist"
- **Palette**: Highly curated Slate/Tonal grays (`slate-900` text, `slate-50` backgrounds).
- **Surfaces**: White cards, `slate-200` delicate borders, `backdrop-blur-xl` glassmorphism for overlays.
- **Spacing**: Editorial-style spacing with wide margins and clear visual hierarchy.

## 4. Modular Ecosystem (The Lego Blocks)

### Base Modules (Cross-Industry)
- **Announcements (Comms)**: Community updates with document download capabilities.
- **Finance**: Dual-view ledger (User balance vs. Admin master ledger).

### Industry Layers (Specialty Plugins)
- **[Residential]**: Package tracking (Paquetería), Amenity booking, Voting/Polls.
- **[Hospitality/Airbnb]**: Automated Check-in/out, Housekeeping status, Guest digital keys.
- **[Industrial/Factory]**: Asset lifecycle tracking, Preventive maintenance, IoT Sensor telemetry.

## 5. Development Patterns for Agents
- **Plugin Isolation**: Before building, ask: "Is this Core or Plugin?". Specific logic lives in `src/plugins/`.
- **Component Consistency**: Use `StatusBadge` for indicators and `ActionCanvas` (side-panel) for all forms.
- **Naming Conventions**: Use singular entity names: `notice`, `payment`, `package`, `booking`, `industrial_asset`.
- **File Integrity**: All files containing JSX must use the `.tsx` extension.

## 6. Infrastructure & Edge (PicoClaw)
- **Efficiency**: Code targeting industrial nodes (Edison) must be lightweight and dependency-minimal.
- **Agentic Middleware**: Agents must be able to hook into `StoreContext` and trigger events (e.g., "If maintenance ticket > 48h, escalate to Manager").

## 7. Migration & Roadmap
- [ ] Implement `PropertyType` in `AuthContext` for UI-layer filtering.
- [ ] Migrate from LocalStorage to **Supabase** (using PostgreSQL JSONB for extensible metadata).
- [ ] Decouple `seed.ts` to provide industry-specific initial states.# PropertyPulse — All Phases + Agent Prompts

Paste each prompt to your coding agent in order. Do not move to the next prompt
until you have verified the Definition of Done for the current one.

---

## PHASE MAP

```
Pre-Flight  →  Phase 0 Close  →  1.0  →  1.1  →  1.2  →  1.3  →  1.4
→  2.1  →  2.2  →  2.3  →  3.1  →  3.2  →  3.3
```

---

## PRE-FLIGHT — Cleanup Commit

**You verify:** `npm run build` produces zero TypeScript errors after.

---

### PROMPT: Pre-Flight

```
You are working on the PropertyPulse codebase at /Users/joriza/Desktop/Repos/PropertyPulse.

The codebase has duplicate files from an incomplete refactor. Your job is to
clean them up safely.

STEP 1 — Check for any remaining imports from the old paths:
Run this and show me the output:
  grep -rn "from.*['\"]../data\|from.*['\"]../../data\|from.*['\"]../context\|from.*['\"]../../context\|from.*['\"]../components/Modal\|from.*['\"]../components/StatusBadge" src/ --include="*.tsx" --include="*.ts"

STEP 2 — If Step 1 returns any hits, update those import paths to point at
their src/core/ equivalents:
  src/data/store.tsx       → src/core/store/store.tsx
  src/data/seed.ts         → src/core/store/seed.ts
  src/context/AuthContext  → src/core/auth/AuthContext.tsx
  src/components/Modal     → src/core/components/Modal.tsx
  src/components/StatusBadge → src/core/components/StatusBadge.tsx

STEP 3 — Delete the dead files:
  src/data/store.tsx
  src/data/seed.ts
  src/context/AuthContext.tsx
  src/components/Modal.tsx
  src/components/StatusBadge.tsx

STEP 4 — Run the build and show me the full output:
  npm run build

Do not proceed past Step 4 until the build is clean.
Do not modify any feature files, layouts, or core components beyond import paths.
```

---

## PHASE 0 CLOSE — Document UI Decisions

**You verify:** file exists and answers all four sections honestly.

---

### PROMPT: Phase 0 Close

```
You are working on the PropertyPulse codebase at /Users/joriza/Desktop/Repos/PropertyPulse.

Create the file docs/ui_decisions.md with the following structure.
Fill in each section based on what you can observe from the existing
src/features/ and src/layouts/ files. Be specific, not generic.

---
# UI Decisions (Phase 0 Output)

## What exists and works
List every screen in src/features/ with one sentence describing what it does.

## What the agent surface is missing
Answer these specifically:
- Does AdminDashboard have an exception queue component? (yes/no)
- Does AdminDashboard have a metrics bar showing resolution rate? (yes/no)
- Does TicketsPage route submissions through any processing logic, or does it
  dispatch ADD_TICKET directly?

## Incorrect flows found
List any flows in the existing UI where the interaction does not match the
intended behavior (e.g. form submits without validation, missing empty states,
navigation dead ends). If none found, write "None identified."

## What must not change in Phase 3
List the things that are working well and should be preserved exactly:
navigation structure, design system, component patterns.
---

Do not invent content. Only document what you can observe in the code.
```

---

## PHASE 1 — Agent Engine

---

### PROMPT: Milestone 1.0 — Extend the Store

**You verify:** app loads, existing features work, `agent` slice visible in
browser devtools localStorage.

```
You are working on the PropertyPulse codebase at /Users/joriza/Desktop/Repos/PropertyPulse.

Extend the existing store at src/core/store/store.tsx.
Do NOT rewrite or restructure the store. Only add what is specified.

STEP 1 — Create src/agent/types.ts with these exact types:

  type EventClass =
    | 'maintenance_request'
    | 'payment_issue'
    | 'communication_gap'
    | 'compliance_trigger'
    | 'access_request'
    | 'unclassified'

  interface AgentEvent {
    id: string
    raw_input: string
    source: 'resident' | 'staff' | 'sensor' | 'schedule'
    property_type: string
    timestamp: string       // ISO8601
    metadata: Record<string, unknown>
  }

  interface ClassifiedEvent extends AgentEvent {
    classification: EventClass
    confidence: number      // 0.0–1.0
    classifier_version: string
  }

  type ResolutionStatus = 'resolved' | 'escalated' | 'pending' | 'failed'

  interface HumanContext {
    summary: string
    history: AgentEvent[]
    recommended_action: string
    urgency: 'low' | 'medium' | 'high' | 'critical'
  }

  interface AgentAction {
    type: 'notify' | 'route' | 'update_ledger' | 'schedule' | 'log'
    payload: Record<string, unknown>
    executed_at: string
    success: boolean
  }

  interface ResolutionResult {
    event_id: string
    status: ResolutionStatus
    actions_taken: AgentAction[]
    escalation_reason?: string
    resolved_at?: string
    requires_human: boolean
    human_context?: HumanContext
  }

  Export all types.

STEP 2 — In src/core/store/store.tsx, add to the StoreState interface:

  agent: {
    events: AgentEvent[]
    resolutions: ResolutionResult[]
  }

STEP 3 — Add these action types to the Action union:

  | { type: 'AGENT_EVENT_RECEIVED'; payload: AgentEvent }
  | { type: 'AGENT_RESOLUTION_COMPLETE'; payload: ResolutionResult }
  | { type: 'AGENT_ESCALATION_RESOLVED'; payload: { resolutionId: string; resolvedBy: string } }

STEP 4 — Add reducer cases for all three new action types:
  AGENT_EVENT_RECEIVED → prepend to state.agent.events
  AGENT_RESOLUTION_COMPLETE → prepend to state.agent.resolutions
  AGENT_ESCALATION_RESOLVED → find matching resolution by event_id,
    set status to 'resolved', set resolved_at to new Date().toISOString()

STEP 5 — In loadInitialState():
  Add migration guard: if (!parsed.agent) parsed.agent = { events: [], resolutions: [] }
  Add to the fallback seed return: agent: { events: [], resolutions: [] }

STEP 6 — Run npm run build. Show me the full output. Fix any TypeScript errors.

STEP 7 — Run the app with npm run dev. Open browser devtools → Application →
LocalStorage. Show me the value of the cantonalfa_store key and confirm the
agent slice is present.

Do not touch any feature files, layout files, or existing store logic
beyond what is specified above.
```

---

### PROMPT: Milestone 1.1 — Classifier

**You verify:** all test cases pass including Spanish inputs.

```
You are working on the PropertyPulse codebase at /Users/joriza/Desktop/Repos/PropertyPulse.

Create src/agent/classifier.ts.

REQUIREMENTS:
- Pure function: takes a string (or null/undefined), returns { classification: EventClass, confidence: number }
- No side effects, no imports beyond src/agent/types.ts
- Synchronous — zero async, zero network calls
- If confidence < 0.6 across all classes → return { classification: 'unclassified', confidence: 0 }
- Never throws — handles null, undefined, empty string, and garbage input

Keyword map must include BOTH Spanish and English terms:

  maintenance_request:
    EN: leak, broken, repair, noise, heat, ac, door, window, pipe, toilet, ceiling
    ES: fuga, goteo, roto, rota, ruido, calor, puerta, ventana, tubería, tuberia,
        baño, bano, techo, reparar, arreglar, mantenimiento, plomería, plomeria

  payment_issue:
    EN: rent, payment, invoice, charge, fee, balance, overdue, paid
    ES: renta, pago, pagué, pague, factura, cobro, cuota, adeudo, mensualidad,
        debo, deuda, no he pagado

  communication_gap:
    EN: nobody told, not informed, didn't know, unaware, no notice
    ES: nadie avisó, nadie aviso, no me informaron, no sabía, no sabia,
        sin aviso, no me dijeron, no nos avisaron

  compliance_trigger:
    EN: fire, gas, flood, sensor:, temp:, pressure:
    ES: incendio, inundación, inundacion, fuga de gas, alarma, humo

  access_request:
    EN: key, access, locked out, entry, fob, gate
    ES: llave, acceso, sin acceso, entrada, control, portón, porton,
        me quedé fuera, me quede fuera, no puedo entrar

Confidence scoring: for a given input, score each class by the fraction of
its keywords found in the lowercased input. Return the class with the highest
score if it exceeds 0.6, otherwise return unclassified.

After creating the file, create src/agent/__tests__/classifier.test.ts and
write tests for ALL of these cases (every one must pass):

  classify("toilet is leaking in unit 4B")         → maintenance_request, > 0.6
  classify("hay una fuga en el baño del 3B")       → maintenance_request, > 0.6
  classify("I haven't paid rent yet")              → payment_issue, > 0.6
  classify("no he podido pagar la mensualidad")    → payment_issue, > 0.6
  classify("nobody told me the gym was closed")    → communication_gap, > 0.6
  classify("nadie me avisó que cerraban el gym")   → communication_gap, > 0.6
  classify("me quedé fuera no tengo llave")        → access_request, > 0.6
  classify("sensor:temperature:unit_3:45C")        → compliance_trigger, > 0.6
  classify("")                                     → unclassified, confidence 0
  classify(null)                                   → unclassified, no throw
  classify("asdkjhasd 1234 !!!")                   → unclassified, < 0.6

Run the tests and show me the full output. Fix failures until all pass.
```

---

### PROMPT: Milestone 1.2 — Resolver + LLM

**You verify:** all 6 resolver scenarios pass including LLM failure scenario.

```
You are working on the PropertyPulse codebase at /Users/joriza/Desktop/Repos/PropertyPulse.

Create two files: src/agent/llm.ts and src/agent/resolver.ts.

--- src/agent/llm.ts ---

Single responsibility: generate HumanContext from a classified event and its history.
Uses the Anthropic API.

  async function generateHumanContext(
    event: ClassifiedEvent,
    history: AgentEvent[]
  ): Promise<HumanContext>

Implementation:
- Build a prompt that includes: event classification, raw_input, metadata,
  and the last 3 items from history
- Call the Anthropic API (claude-haiku-4-5-20251001, max_tokens: 300)
- Parse the response into HumanContext shape
- If the API call throws for any reason, return this fallback — never throw:

  {
    summary: `${event.classification} recibido de ${event.source} — ${event.raw_input.slice(0, 80)}`,
    recommended_action: 'Revisar el evento y determinar la respuesta apropiada.',
    urgency: deriveUrgency(event),   // see urgency rules below
    history
  }

Urgency rules (rule-based, no LLM):
  compliance_trigger → always 'critical'
  maintenance_request + metadata.age_hours > 48 → 'high'
  maintenance_request → 'medium'
  payment_issue → 'medium'
  access_request → 'high'
  communication_gap → 'low'
  unclassified → 'medium'

--- src/agent/resolver.ts ---

  async function resolve(event: ClassifiedEvent): Promise<ResolutionResult>

Rules for Residential/Condo property type:

  Rule 1 — maint_auto_route:
    trigger: maintenance_request
    condition: metadata.category !== 'structural'
    action: { type: 'route', payload: { target: 'maintenance_staff' } }
    resolves: true (requires_human: false)
    LLM: NOT called

  Rule 2 — maint_escalate_48h:
    trigger: maintenance_request
    condition: metadata.age_hours > 48 AND metadata.status !== 'assigned'
    action: { type: 'notify', payload: { target: 'manager' } }
    resolves: false (requires_human: true)
    LLM: called to generate HumanContext

  Rule 3 — payment_reminder:
    trigger: payment_issue
    condition: !metadata.reminder_sent
    action: { type: 'notify', payload: { target: 'resident', message: 'recordatorio de pago' } }
    resolves: true (requires_human: false)
    LLM: NOT called

  Rule 4 — unclassified_escalate:
    trigger: unclassified
    action: escalate
    resolves: false (requires_human: true)
    LLM: called with fallback prompt

  Default for any unmatched classified event:
    route to staff, resolves: true, LLM NOT called

Critical rules for resolver:
- Rules execute in order — first matching rule wins
- LLM is called ONLY after all rule logic is complete
- LLM is called ONLY when requires_human === true
- If LLM throws → use fallback HumanContext, resolution still completes
- Resolver never throws — failures produce status: 'failed' with error in actions_taken
- requires_human: false → LLM is never called, verified by test

After creating both files, create src/agent/__tests__/resolver.test.ts.
Mock the LLM adapter in tests — do not make real API calls.

Required test scenarios (all must pass):

  Scenario 1: maintenance_request, no structural metadata
    → status: 'resolved', requires_human: false, LLM mock never called

  Scenario 2: maintenance_request, age_hours: 73, status: 'unassigned'
    → status: 'escalated', requires_human: true, LLM mock called once,
      human_context populated

  Scenario 3: payment_issue, reminder_sent: false
    → status: 'resolved', requires_human: false, LLM mock never called

  Scenario 4: unclassified event
    → status: 'escalated', escalation_reason populated, LLM mock called

  Scenario 5: rule throws internally
    → status: 'failed', error captured in actions_taken, no unhandled exception

  Scenario 6: LLM mock throws
    → fallback HumanContext used, resolution still completes,
      status unchanged from what rules determined

Run tests. Show full output. Fix all failures.
```

---

### PROMPT: Milestone 1.3 — Escalation Engine + Notification Stubs

**You verify:** escalation packets are complete, stubs log to console, no throws.

```
You are working on the PropertyPulse codebase at /Users/joriza/Desktop/Repos/PropertyPulse.

Create two files: src/agent/escalation.ts and src/agent/notifications.ts.

--- src/agent/notifications.ts ---

Stub implementation — all methods log to console and return Promise.resolve().
The interface must match exactly what the real implementation will use in Phase 2.

  export const notify = {
    push: async (target: string, message: string): Promise<void> =>
      console.log('[STUB:push]', target, message),
    email: async (target: string, subject: string, body: string): Promise<void> =>
      console.log('[STUB:email]', target, subject),
    sms: async (target: string, message: string): Promise<void> =>
      console.log('[STUB:sms]', target, message),
  }

--- src/agent/escalation.ts ---

  interface EscalationPacket {
    target_role: 'manager' | 'owner' | 'emergency_services'
    channel: ('push' | 'email' | 'sms')[]
    context: HumanContext
    deadline_minutes: number
    auto_escalate_if_no_response: boolean
  }

  async function escalate(
    result: ResolutionResult,
    propertyName: string
  ): Promise<EscalationPacket>

Routing rules:
  urgency critical → emergency_services, channels: [push, sms], deadline: 15
  urgency high     → manager, channels: [push, email], deadline: 60
  urgency medium   → manager, channels: [email], deadline: 240
  urgency low      → manager, channels: [email], deadline: 1440

All packets: auto_escalate_if_no_response: true

After sending the escalation packet through notify stubs, return the packet.
Never throw — if notify stubs throw (they shouldn't), catch and log.

Write tests in src/agent/__tests__/escalation.test.ts:

  urgency critical → target: emergency_services, deadline: 15, channels includes sms
  urgency high     → target: manager, deadline: 60, channels includes push
  urgency low      → target: manager, deadline: 1440, channels: [email] only
  notify stubs     → console.log called with correct args, function returns packet

Run tests. Show full output. Fix all failures.
```

---

### PROMPT: Milestone 1.4 — Wire Agent Loop into TicketsPage

**You verify:** submit a ticket in the UI, check browser devtools localStorage,
confirm `agent.events` and `agent.resolutions` have new entries.

```
You are working on the PropertyPulse codebase at /Users/joriza/Desktop/Repos/PropertyPulse.

Create src/agent/loop.ts and src/agent/adapters/ticketAdapter.ts.
Then modify src/features/tickets/TicketsPage.tsx to route submissions
through the agent loop.

--- src/agent/adapters/ticketAdapter.ts ---

Two functions:

  function buildAgentEvent(formData: any, context: { source: string, property_type: string }): AgentEvent
    Maps the existing ticket form fields to AgentEvent shape.
    id: crypto.randomUUID()
    raw_input: formData.description or formData.title — whichever is the free-text field
    source: context.source
    property_type: context.property_type
    timestamp: new Date().toISOString()
    metadata: include all remaining formData fields as-is

  function buildTicketFromResolution(event: AgentEvent, resolution: ResolutionResult): Ticket
    Maps back to the existing Ticket type so TicketsPage renders identically.
    Look at the existing Ticket type in src/core/store/seed.ts to get all required fields.
    Map: event.id → ticket id, event.raw_input → description, resolution.status → ticket status
    For any Ticket fields not available from the agent, use sensible defaults.

--- src/agent/loop.ts ---

  async function processEvent(
    rawInput: string,
    context: EventContext,
    dispatch: React.Dispatch<any>
  ): Promise<ResolutionResult>

  Pipeline:
    1. build AgentEvent from rawInput + context
    2. dispatch AGENT_EVENT_RECEIVED
    3. classify the event
    4. resolve the classified event
    5. dispatch AGENT_RESOLUTION_COMPLETE
    6. if resolution.status === 'escalated', call escalate()
    7. return resolution

--- src/features/tickets/TicketsPage.tsx ---

Find the form submission handler. Change it so that instead of dispatching
ADD_TICKET directly, it:
  1. Calls processEvent() with the form's free-text description field
  2. Awaits the resolution
  3. Builds a Ticket from the resolution using buildTicketFromResolution()
  4. Dispatches ADD_TICKET with that ticket

The UI must look and behave identically to before for the resident.
Do not change any JSX, layout, or styling.
Do not remove the ADD_TICKET dispatch — it still fires, just after the agent runs.

After making changes, run npm run build. Show full output. Fix all errors.

Then write src/agent/__tests__/loop.integration.test.ts with these scenarios:

  Scenario A: "hay una fuga en el baño" → maintenance_request → resolved
    Verify: AGENT_EVENT_RECEIVED dispatched, AGENT_RESOLUTION_COMPLETE dispatched,
    ADD_TICKET dispatched, ticket status matches resolution

  Scenario B: event with age_hours: 73, status: unassigned → escalated
    Verify: AGENT_ESCALATION dispatched, requires_human: true in resolution

  Scenario C: "no he podido pagar la mensualidad" → payment_issue → resolved

  Scenario D: "asdfg 1234 !!" → unclassified → escalated, no crash

  Scenario E: 5 concurrent processEvent calls → all resolve independently,
    no shared state corruption

Run tests. Show full output. Fix all failures.
```

---

## PHASE 2 — Supabase Schema

---

### PROMPT: Milestone 2.1 — Schema Design

**You verify:** every table column maps to a field in src/agent/types.ts.
Run `supabase db reset` and confirm it passes.

```
You are working on the PropertyPulse codebase at /Users/joriza/Desktop/Repos/PropertyPulse.

Create the Supabase migration files. The schema must be derived from
src/agent/types.ts and src/core/store/store.tsx StoreState — not from UI screens.

Create supabase/migrations/001_core_schema.sql:

  -- Properties
  CREATE TABLE properties (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    type          TEXT NOT NULL CHECK (type IN ('Condo','Hotel','Factory','Airbnb')),
    created_at    TIMESTAMPTZ DEFAULT now()
  );

  -- User profiles (extends Supabase auth.users)
  CREATE TABLE user_profiles (
    id            UUID PRIMARY KEY REFERENCES auth.users(id),
    role          TEXT NOT NULL CHECK (role IN ('Admin','Resident','Staff','Guest')),
    property_id   UUID REFERENCES properties(id),
    apartment     TEXT,
    tower         TEXT,
    metadata      JSONB DEFAULT '{}'
  );

  -- Agent events (maps to AgentEvent type)
  CREATE TABLE agent_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_input       TEXT NOT NULL,
    source          TEXT NOT NULL CHECK (source IN ('resident','staff','sensor','schedule')),
    property_type   TEXT NOT NULL,
    property_id     UUID REFERENCES properties(id),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now()
  );

  -- Classified events (maps to ClassifiedEvent type)
  CREATE TABLE classified_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id            UUID REFERENCES agent_events(id) ON DELETE CASCADE,
    classification      TEXT NOT NULL,
    confidence          NUMERIC(4,3) CHECK (confidence BETWEEN 0 AND 1),
    classifier_version  TEXT NOT NULL DEFAULT '1.0',
    classified_at       TIMESTAMPTZ DEFAULT now()
  );

  -- Resolutions (maps to ResolutionResult type)
  CREATE TABLE resolutions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id          UUID REFERENCES agent_events(id) ON DELETE CASCADE,
    status            TEXT NOT NULL CHECK (status IN ('resolved','escalated','pending','failed')),
    actions_taken     JSONB DEFAULT '[]',
    escalation_reason TEXT,
    requires_human    BOOLEAN NOT NULL DEFAULT false,
    human_context     JSONB,
    resolved_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT now()
  );

  -- North star KPI view
  CREATE VIEW agent_resolution_rate AS
  SELECT
    COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
    COUNT(*) AS total,
    ROUND(
      COUNT(*) FILTER (WHERE status = 'resolved')::numeric / NULLIF(COUNT(*),0) * 100, 2
    ) AS rate_percent
  FROM resolutions;

Create supabase/migrations/002_rls_policies.sql:

  ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;
  ALTER TABLE resolutions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

  -- Admin sees everything
  CREATE POLICY admin_all ON agent_events FOR ALL
    USING (auth.jwt()->>'role' = 'Admin');

  -- Resident sees only their own events (matched by apartment in metadata)
  CREATE POLICY resident_own ON agent_events FOR SELECT
    USING (
      metadata->>'apartment' = (
        SELECT apartment FROM user_profiles WHERE id = auth.uid()
      )
    );

  -- Staff sees events routed to them
  CREATE POLICY staff_assigned ON resolutions FOR SELECT
    USING (
      human_context->>'target_role' = 'staff'
      OR auth.jwt()->>'role' = 'Admin'
    );

Create docs/schema_type_mapping.md listing every table column and which
TypeScript field in src/agent/types.ts it maps to.

Run: supabase db reset
Show me the full output. Fix any SQL errors until it passes cleanly.
```

---

### PROMPT: Milestone 2.2 — Seed + Store Supabase Swap

**You verify:** app loads from Supabase, `supabase db diff` is clean,
all Phase 1 integration tests still pass.

```
You are working on the PropertyPulse codebase at /Users/joriza/Desktop/Repos/PropertyPulse.

Two tasks: create the seed file, then swap localStorage for Supabase in StoreProvider.

--- TASK 1: supabase/seed/residential.sql ---

Seed data for Cosmopol HU Lifestyle (Coacalco, Condo type).
Mirror the shape of the existing src/core/store/seed.ts data.

Include:
  - 1 property: name 'Cosmopol HU Lifestyle', type 'Condo'
  - 2 user_profiles: one Admin, one Resident (apartment: '3B', tower: 'A')
  - 10 agent_events covering all 5 EventClass types (2 per class)
  - 10 classified_events (one per agent_event)
  - 10 resolutions: 3 resolved, 2 escalated, 5 pending
  Goal: agent_resolution_rate view returns rate_percent = 30.00

Run: supabase db reset && supabase db seed
Show me the output of: SELECT * FROM agent_resolution_rate;
It must return rate_percent = 30.00.

--- TASK 2: Supabase swap in StoreProvider ---

In src/core/store/store.tsx, make these specific changes only:

1. Add supabase client import (assume @supabase/supabase-js is installed,
   client is at src/lib/supabase.ts — create that file if it doesn't exist
   using the project's SUPABASE_URL and SUPABASE_ANON_KEY env vars).

2. Change the persistence useEffect from:
     localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
   to:
     supabase.from('store_state').upsert({ key: STORAGE_KEY, value: state })
       .then(({ error }) => { if (error) console.error('[store:persist]', error) })

3. Change loadInitialState to also try Supabase before falling back to seed:
     First try: localStorage (keep existing logic — offline fallback)
     Then try: supabase.from('store_state').select('value').eq('key', STORAGE_KEY)
     Fallback: seed data

   Wrap the Supabase call in try/catch — if Supabase is unreachable, the app
   still loads from localStorage. Never let a Supabase error crash the app.

4. Add a loading state to StoreProvider so the UI doesn't flash before state loads:
     Show a simple loading indicator (reuse any existing spinner/loading component)
     until initial state is resolved.

Do not change anything else in the store.

Run npm run build. Show full output. Fix all errors.
Run the Phase 1 integration tests. Show full output. All must still pass.
```

---

### PROMPT: Milestone 2.3 — Real Notifications via Supabase Edge Function

**You verify:** staging escalation triggers a real push notification.
Edge function deploys without error.

```
You are working on the PropertyPulse codebase at /Users/joriza/Desktop/Repos/PropertyPulse.

Create a Supabase Edge Function that replaces the notification stubs.

Create supabase/functions/notify/index.ts:

  Accepts POST with body: { channel: 'push'|'email'|'sms', target: string, message: string, subject?: string }

  For now, implement email only using Supabase's built-in email (or log to
  console if SMTP is not configured) — push and SMS are stubs that log and return 200.

  Always return 200 — never return 5xx. Log failures internally.
  Response: { success: boolean, channel: string, target: string }

Update src/agent/notifications.ts to replace stubs with real calls to this edge function:

  export const notify = {
    push: async (target, message) => {
      await fetch(`${SUPABASE_URL}/functions/v1/notify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'push', target, message })
      })
    },
    email: async (target, subject, body) => { ... same pattern ... },
    sms: async (target, message) => { ... same pattern ... },
  }

  On fetch failure: log the error, do not throw.

Deploy: supabase functions deploy notify
Show me the deploy output.

Run integration test Scenario B (72h escalation) and show that the escalation
fires without error. The edge function does not need to send a real email in
dev — console.log in the function is acceptable for now.

Verify Phase 2 gate:
  - Run: supabase db diff (must return no changes)
  - Run all Phase 1 integration tests (must all still pass)
  - Search for localStorage references: grep -rn "localStorage" src/agent/ --include="*.ts"
    (must return zero results)
```

---

## PHASE 3 — Production UI

---

### PROMPT: Milestone 3.1 — Agent Surface in AdminDashboard

**You verify:** AdminDashboard shows AgentMetricsBar and ExceptionQueue.
Submit a ticket, confirm it appears in the exception queue if escalated.

```
You are working on the PropertyPulse codebase at /Users/joriza/Desktop/Repos/PropertyPulse.

Add the agent surface to the existing AdminDashboard. Do not change any
existing layout, navigation, or feature components.

Create src/core/components/AgentMetricsBar.tsx:
  Reads from useStore(): state.agent.resolutions and state.agent.events
  Displays four metrics in a horizontal bar:
    - Tasa de Resolución: X% (resolved / total resolutions)
    - Eventos Hoy: count of events where timestamp is today's date
    - Escalaciones Pendientes: count of resolutions where requires_human AND status !== 'resolved'
    - Tiempo Promedio (hrs): avg hours between event created_at and resolved_at for resolved items
  Use the existing design system: Slate palette, Manrope/Inter, existing card styles
  Use existing StatusBadge component for the resolution rate (green > 80%, yellow > 50%, red otherwise)

Create src/core/components/ResolutionCard.tsx:
  Props: resolution: ResolutionResult
  Displays: human_context.summary, urgency badge (using existing StatusBadge),
    human_context.recommended_action, a "Resolver" button and a "Reasignar" button
  "Resolver" dispatches AGENT_ESCALATION_RESOLVED with the current admin's name
  Use existing ActionCanvas pattern for any forms that open from this card

Create src/core/components/ExceptionQueue.tsx:
  Reads from useStore(): state.agent.resolutions
  Filters: requires_human === true AND status !== 'resolved'
  Sorts: critical first, then high, medium, low — within same urgency by created_at ASC
  Renders a ResolutionCard for each item
  Empty state: a clean card with text "Sin excepciones — el agente está gestionando todo"

In src/features/dashboard/AdminDashboard.tsx:
  Add <AgentMetricsBar /> at the top of the dashboard, above existing content
  Add <ExceptionQueue /> as a new section below existing dashboard content
  Do not remove or reorder any existing elements

Run npm run build. Show full output. Fix all errors.

Verify:
  - AgentMetricsBar renders without crashing on empty agent state
  - ExceptionQueue renders empty state when state.agent.resolutions is empty
  - Submit a ticket via TicketsPage that will trigger an escalation
    (use description "tubería rota sin asignar" and manually set age in metadata)
    Confirm it appears in ExceptionQueue in AdminDashboard
```

---

### PROMPT: Milestone 3.2 — Resident Status Feedback

**You verify:** resident submits a ticket, sees a status update within 2 seconds.

```
You are working on the PropertyPulse codebase at /Users/joriza/Desktop/Repos/PropertyPulse.

Update src/features/dashboard/ResidentDashboard.tsx to show agent resolution
status after a resident submits a ticket.

Requirements:
  - After submission, show a status card below the submit form (or as a modal/toast —
    use whatever pattern already exists in the codebase for feedback)
  - The status card reads from state.agent.resolutions filtered by the resident's apartment
  - Status labels must be in Spanish:
      pending   → "Tu solicitud está siendo procesada..."
      resolved  → "Solicitud resuelta — [human_context.summary if available]"
      escalated → "Escalada al administrador — recibirás una respuesta pronto"
      failed    → "Hubo un problema — por favor contacta a administración"
  - Resident only sees their own resolutions (filter by apartment from AuthContext)
  - Do not show other residents' resolutions under any circumstance

Do not change the submit form itself.
Do not change any other part of ResidentDashboard.

Run npm run build. Show full output. Fix all errors.

Verify by testing the flow:
  1. Log in as Resident
  2. Submit a ticket with description "hay una fuga en el baño"
  3. Confirm status feedback appears and shows the correct Spanish label
```

---

### PROMPT: Milestone 3.3 — Staff Escalation Queue + Final Gate

**You verify:** E2E loop works. Zero localStorage refs in src/. All features
work as before. `npm run build` clean.

```
You are working on the PropertyPulse codebase at /Users/joriza/Desktop/Repos/PropertyPulse.

TASK 1 — Add escalation view to staff role.

In src/features/dashboard/AdminDashboard.tsx (or create StaffDashboard.tsx if
a separate staff dashboard already exists — check src/features/dashboard/):

  If staff role is logged in, show a section "Cola de Escalaciones" that:
  - Filters state.agent.resolutions where requires_human === true
    AND status !== 'resolved'
    AND human_context.urgency is NOT 'critical' (critical goes to manager/owner)
  - Shows ResolutionCard for each item
  - Staff "Resolver" button dispatches AGENT_ESCALATION_RESOLVED with staff member's name

TASK 2 — Final verification checklist. Run each of these and show me the output:

  1. Full build:
       npm run build
     Must complete with zero TypeScript errors.

  2. LocalStorage references:
       grep -rn "localStorage" src/ --include="*.ts" --include="*.tsx"
     Must return only the two lines in StoreProvider (the offline fallback). Zero elsewhere.

  3. E2E loop test — run this manually in the browser:
     a. Log in as Resident
     b. Submit ticket: "hay una fuga en el baño de mi departamento 3B"
     c. Confirm: status feedback appears in ResidentDashboard
     d. Log in as Admin
     e. Confirm: ticket appears in TicketsPage
     f. If escalated: confirm it appears in AdminDashboard ExceptionQueue
     g. Confirm: AgentMetricsBar shows updated counts
     Report what you see at each step.

  4. Existing features regression check — open each of these and confirm they
     load without errors:
       - PagosPage
       - AvisosPage
       - PaqueteriaPage
       - AmenidadesPage
       - VotacionesPage
       - UsuariosPage

  5. Agent resolution rate:
       In the browser console, run:
         const s = JSON.parse(localStorage.getItem('cantonalfa_store'))
         const r = s.agent.resolutions
         console.log('total:', r.length, 'resolved:', r.filter(x=>x.status==='resolved').length)
     Show me the output.

Report results for all 5 checks. Fix anything that fails before marking done.
```

---

## PHASE GATE SUMMARY

| Gate | What to check | Pass condition |
|---|---|---|
| Pre-Flight | `npm run build` | Zero errors, dead files gone |
| Phase 0 Close | `docs/ui_decisions.md` | All 4 sections answered |
| Milestone 1.0 | Browser devtools localStorage | `agent` slice present |
| Milestone 1.1 | Test output | All 11 classifier cases pass |
| Milestone 1.2 | Test output | All 6 resolver scenarios pass |
| Milestone 1.3 | Test output | All 4 escalation cases pass |
| Milestone 1.4 | Test output + UI | All 5 loop scenarios pass, UI unchanged |
| Milestone 2.1 | `supabase db reset` | Clean, rate view = 30% |
| Milestone 2.2 | Integration tests | All Phase 1 tests pass against Supabase |
| Milestone 2.3 | `supabase functions deploy` | Clean deploy, no localStorage in src/agent/ |
| Milestone 3.1 | Browser | ExceptionQueue and MetricsBar render in AdminDashboard |
| Milestone 3.2 | Browser | Resident sees Spanish status within 2s of submit |
| Milestone 3.3 | Full checklist | All 5 checks pass |

**A partial pass is a fail. Do not proceed until the gate is met.**