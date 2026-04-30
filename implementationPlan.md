# Vilkor — Engineering Development Process
> Correct build order: **Cleanup Commit → [Phase 0: DONE] → Agent Engine → Supabase Schema → Production UI**
> North Star KPI: `AgentResolutionRate` > 80% | `units_per_manager` ratio

---

## Code Analysis Summary (April 2026)

Existing codebase analyzed. Verdict: **Scenario A — salvageable. Build on it.**

| Question | Answer | Implication |
|---|---|---|
| Components touch LocalStorage directly? | No — isolated in StoreProvider only | Components need no changes for Supabase migration |
| Data shape matches agent types? | Partially — `tickets` slice is proto-AgentEvent | Evolve existing slices, don't replace them |
| Business logic inside components? | No — only display filtering in TicketsPage | Feature components stay intact |
| Single state source? | Yes — one `useReducer` in StoreProvider | One swap point for Supabase |

**Dead code to remove before anything else:**

```
src/data/store.tsx          ← DELETE (superseded by src/core/store/store.tsx)
src/data/seed.ts            ← DELETE
src/context/AuthContext.tsx ← DELETE (superseded by src/core/auth/AuthContext.tsx)
src/components/Modal.tsx    ← DELETE (superseded by src/core/components/Modal.tsx)
src/components/StatusBadge.tsx ← DELETE
```

---

## Build Philosophy

Every phase gate is a hard stop. You do not proceed to the next phase until the current Definition of Done (DoD) is fully satisfied. A passing test suite is not optional — it is the proof of correctness.

The order is non-negotiable because:
- The agent's data needs define the schema. Not the reverse.
- The UI reflects real system state. It cannot be built against fake state and then migrated.
- Discovering schema mistakes at Phase 3 means rebuilding Phase 1 and 2 artifacts. Discovering them at Phase 1 is a 30-minute fix.

## LLM Usage Policy

This is a hard architectural decision made once, not revisited per feature:

| Component | LLM? | Reason |
|---|---|---|
| Classifier | **No** | Keyword + rule-based. Deterministic, testable, zero latency, zero cost per event. LLM adds no correctness here. |
| Resolver | **Yes** | Generating `HumanContext.summary` and `recommended_action` requires synthesizing event history into natural language. LLM is the right tool for this specific output. |
| Escalation router | **No** | Threshold logic. An LLM making routing decisions is non-deterministic and untestable. |
| Outbound resident comms | **Yes** | Drafting contextual messages. Progressive enhancement — templating works first, LLM improves quality. |

**LLM in prototype: No.** The prototype validates interaction layout, not system intelligence. The resolver in the prototype returns hardcoded `HumanContext` objects. LLM is wired into the resolver in Phase 1 only.

---

## Pre-Flight — Cleanup Commit

**Do this before writing a single new line of code.** This is not optional.

**Step 1 — verify nothing still imports from the old paths:**
```bash
grep -rn "from.*['\"]../data\|from.*['\"]../../data\|from.*['\"]../context\|from.*['\"]../../context\|from.*['\"]../components/Modal\|from.*['\"]../components/StatusBadge" src/ --include="*.tsx" --include="*.ts"
```

If this returns hits, update those imports to point at `src/core/` equivalents first.

**Step 2 — delete the dead files:**
```bash
rm src/data/store.tsx
rm src/data/seed.ts
rm src/context/AuthContext.tsx
rm src/components/Modal.tsx
rm src/components/StatusBadge.tsx
```

**Step 3 — verify app still runs:**
```bash
npm run dev
npm run build   # must produce zero TypeScript errors
```

**Step 4 — commit:**
```bash
git add -A
git commit -m "chore: remove legacy duplicates (data/, context/, components/ superseded by core/)"
```

**Definition of Done:**
- [ ] `npm run build` passes with zero errors
- [ ] No imports referencing `src/data/`, `src/context/`, or old `src/components/Modal|StatusBadge`
- [ ] Git history has a clean commit for this change — not mixed with feature work

---

## Phase 0 — UI Prototype ✅ COMPLETE

**Your existing UI is the prototype.** Navigation validated, design validated, interaction patterns validated. This phase is done.

**One remaining artifact to produce before closing Phase 0:**

Create `docs/ui_decisions.md` with answers to these questions. This file informs Phase 3 so you don't rebuild what already works:

```markdown
# UI Decisions (Phase 0 Output)

## What works and stays
- Navigation structure: [describe what you like]
- Design system: Architectural Minimalist — Slate palette, Manrope/Inter, glassmorphism overlays
- Which feature screens feel right as-is

## What's missing for the agent surface
- ExceptionQueue component does not exist yet
- AgentMetricsBar does not exist yet
- TicketsPage needs to route submissions through agent loop instead of direct dispatch

## What the resident submit form is missing
- [walk through TicketsPage submit — does it produce AgentEvent-shaped data?]
- [what fields are invented vs. what the agent needs]

## Urgency sort — validated?
- [yes/no — can you find critical items in under 5 seconds in current UI?]
```

**Phase 0 Gate:**
- [ ] `docs/ui_decisions.md` exists and answers all four sections
- [ ] Cleanup commit is merged (Pre-Flight done)

---

## Phase 1 — Agent Engine

**Goal:** A working autonomous resolution loop for one `PropertyType` (Residential/Condo), end-to-end, wired into the existing store. Zero UI changes required.

---

### Milestone 1.0 — Extend Existing Store (not replace it)

**What you build:**
- Two new slices added to the existing `StoreState` in `src/core/store/store.tsx`
- New action types for agent operations
- Seed defaults for the new slices

**The existing store shape stays intact.** You are adding to it, not refactoring it.

```typescript
// src/core/store/store.tsx — ADD these to existing StoreState interface
export interface StoreState {
  // ── all existing slices unchanged ──
  notificaciones: Notificacion[]
  avisos: Aviso[]
  pagos: Pago[]
  tickets: Ticket[]           // ← this evolves: ticket creation now routes through agent
  // ...rest unchanged...

  // ── NEW: agent slices ──
  agent: {
    events: AgentEvent[]
    resolutions: ResolutionResult[]
  }
}
```

**New action types to add to the existing Action union:**
```typescript
  | { type: 'AGENT_EVENT_RECEIVED'; payload: AgentEvent }
  | { type: 'AGENT_RESOLUTION_COMPLETE'; payload: ResolutionResult }
  | { type: 'AGENT_ESCALATION_RESOLVED'; payload: { resolutionId: string; resolvedBy: string } }
```

**New reducer cases:**
```typescript
case 'AGENT_EVENT_RECEIVED':
  return { ...state, agent: { ...state.agent, events: [action.payload, ...state.agent.events] } }

case 'AGENT_RESOLUTION_COMPLETE':
  return { ...state, agent: { ...state.agent, resolutions: [action.payload, ...state.agent.resolutions] } }

case 'AGENT_ESCALATION_RESOLVED':
  return {
    ...state,
    agent: {
      ...state.agent,
      resolutions: state.agent.resolutions.map(r =>
        r.event_id === action.payload.resolutionId
          ? { ...r, status: 'resolved', resolved_at: new Date().toISOString() }
          : r
      )
    }
  }
```

**Seed defaults — add to `loadInitialState()` fallback:**
```typescript
agent: { events: [], resolutions: [] }
```

**And add migration guard in `loadInitialState()` for existing stored states:**
```typescript
if (!parsed.agent) parsed.agent = { events: [], resolutions: [] }
```

**Definition of Done:**
- [ ] `npm run build` passes with zero errors after store changes
- [ ] `agent` slice present in localStorage output after app loads (check devtools)
- [ ] Existing features (tickets, pagos, avisos) work identically — no regressions
- [ ] New action types dispatch and update state correctly — verified via React DevTools

**Artifacts produced:**
- Updated `src/core/store/store.tsx`
- Updated `src/core/store/seed.ts` (agent slice defaults)

---

### Milestone 1.1 — Event Model & Classifier

**What you build:**
- `src/agent/types.ts` — canonical type definitions
- `src/agent/classifier.ts` — pure function: `Event → EventClass`

**Implementation approach: keyword + rule-based. No LLM.**

The classifier is a decision tree over keyword sets and structured patterns. It is synchronous, has zero network calls, and costs nothing per event. This is the correct tool — the classification problem for property management is closed-domain and enumerable.

**Important — your existing data is in Spanish.** The classifier keyword map must cover Spanish terms. Residents submit in Spanish. The existing seed data and UI labels are Spanish. Both languages needed.

```typescript
// src/agent/classifier.ts — implementation strategy
const KEYWORD_MAP: Record<EventClass, string[]> = {
  maintenance_request: [
    // English
    'leak', 'broken', 'repair', 'noise', 'heat', 'ac', 'door', 'window', 'pipe', 'toilet', 'ceiling',
    // Spanish
    'fuga', 'goteo', 'roto', 'ruido', 'calor', 'puerta', 'ventana', 'tubería', 'baño', 'techo', 'reparar', 'arreglar'
  ],
  payment_issue: [
    'rent', 'payment', 'invoice', 'charge', 'fee', 'balance', 'overdue', 'paid',
    'renta', 'pago', 'factura', 'cobro', 'cuota', 'adeudo', 'mensualidad', 'pagué'
  ],
  communication_gap: [
    'nobody told', 'not informed', 'didn\'t know', 'unaware',
    'nadie avisó', 'no me informaron', 'no sabía', 'sin aviso', 'no me dijeron'
  ],
  compliance_trigger: [
    'sensor:', 'temp:', 'pressure:', 'fire', 'gas', 'flood',
    'incendio', 'inundación', 'fuga de gas', 'alarma'
  ],
  access_request: [
    'key', 'access', 'locked out', 'entry', 'fob', 'gate',
    'llave', 'acceso', 'sin acceso', 'entrada', 'control', 'portón', 'me quedé fuera'
  ],
};
```

**Canonical types to define:**
```typescript
type EventClass =
  | 'maintenance_request'
  | 'payment_issue'
  | 'communication_gap'
  | 'compliance_trigger'
  | 'access_request'
  | 'unclassified';

interface AgentEvent {
  id: string;
  raw_input: string;           // original text/trigger
  source: 'resident' | 'staff' | 'sensor' | 'schedule';
  property_type: PropertyType;
  timestamp: ISO8601String;
  metadata: Record<string, unknown>;
}

interface ClassifiedEvent extends AgentEvent {
  classification: EventClass;
  confidence: number;          // 0.0–1.0
  classifier_version: string;
}
```

**Definition of Done:**
- [ ] Classifier is a pure function with no side effects
- [ ] Returns `EventClass` + `confidence` for every input, including malformed ones
- [ ] `confidence < 0.6` → always returns `'unclassified'`
- [ ] Zero external dependencies (no API calls, no DB, no context)

**Tests — `src/agent/__tests__/classifier.test.ts`:**
```typescript
// Required test cases — all must pass:
classify("toilet is leaking in unit 4B")          // → maintenance_request, confidence > 0.8
classify("hay una fuga en el baño del 3B")        // → maintenance_request, confidence > 0.8
classify("I haven't paid rent yet")               // → payment_issue
classify("no he podido pagar la mensualidad")     // → payment_issue
classify("nobody told me the gym was closed")     // → communication_gap
classify("nadie me avisó que cerraban el gimnasio") // → communication_gap
classify("")                                      // → unclassified, confidence = 0
classify(null)                                    // → unclassified, no throw
classify("asdkjhasd random garbage")              // → unclassified, confidence < 0.6
classify("sensor:temperature:unit_3:45C")         // → compliance_trigger
```

**Artifacts produced:**
- `src/agent/types.ts`
- `src/agent/classifier.ts`
- `src/agent/__tests__/classifier.test.ts`
- `tasks/lessons.md` entry: document any edge cases found during testing

---

### Milestone 1.2 — Resolution Engine

**What you build:**
- `src/agent/resolver.ts` — async function: `ClassifiedEvent → ResolutionResult`
- `src/agent/rules/residential.ts` — first rule set
- `src/agent/llm.ts` — LLM adapter (used only for `HumanContext` generation)

**LLM boundary — this is precise, not approximate.**

The resolver has two layers:
1. **Rule execution** — deterministic, no LLM. Fires rules, determines `status`, `actions_taken`, `requires_human`.
2. **Context generation** — LLM only, and only when `requires_human === true`. Generates `HumanContext.summary` and `recommended_action` by summarizing event history.

```typescript
// src/agent/llm.ts — LLM adapter, single responsibility
export async function generateHumanContext(
  event: ClassifiedEvent,
  history: AgentEvent[]
): Promise<HumanContext> {
  const prompt = buildContextPrompt(event, history);
  const response = await callLLM(prompt);   // Anthropic API
  return parseHumanContext(response);
}

// The resolver calls this ONLY at the end, ONLY if requires_human === true
// Rule execution is complete before LLM is called — LLM cannot affect routing
```

**Why this boundary matters:** If the LLM call fails, the resolution still happened. The escalation still fires. The `HumanContext` degrades to a templated fallback — the manager gets less context but the system doesn't stop.

```typescript
// Fallback if LLM call fails:
const fallbackContext: HumanContext = {
  summary: `${event.classification} received from ${event.source} at ${event.timestamp}.`,
  recommended_action: 'Review event details and determine appropriate response.',
  urgency: deriveUrgency(event),   // rule-based fallback
  history,
};
```

**Resolution result type:**
```typescript
type ResolutionStatus = 'resolved' | 'escalated' | 'pending' | 'failed';

interface ResolutionResult {
  event_id: string;
  status: ResolutionStatus;
  actions_taken: AgentAction[];
  escalation_reason?: string;      // populated only if status === 'escalated'
  resolved_at?: ISO8601String;
  requires_human: boolean;
  human_context?: HumanContext;    // pre-built context packet for manager
}

interface AgentAction {
  type: 'notify' | 'route' | 'update_ledger' | 'schedule' | 'log';
  payload: Record<string, unknown>;
  executed_at: ISO8601String;
  success: boolean;
}

interface HumanContext {
  summary: string;               // one sentence: what happened
  history: AgentEvent[];         // related prior events
  recommended_action: string;    // what the agent would do if it could
  urgency: 'low' | 'medium' | 'high' | 'critical';
}
```

**Residential rule set — minimum viable:**
```typescript
// src/agent/rules/residential.ts
const rules: Rule[] = [
  {
    id: 'maint_auto_route',
    trigger: { classification: 'maintenance_request' },
    condition: (event) => event.metadata.category !== 'structural',
    action: 'route_to_maintenance_staff',
    resolves: true,
  },
  {
    id: 'maint_escalate_48h',
    trigger: { classification: 'maintenance_request' },
    condition: (event) => ageInHours(event) > 48 && event.metadata.status !== 'assigned',
    action: 'escalate_to_manager',
    resolves: false,
  },
  {
    id: 'payment_reminder',
    trigger: { classification: 'payment_issue' },
    condition: (event) => !event.metadata.reminder_sent,
    action: 'send_payment_reminder',
    resolves: true,
  },
];
```

**Definition of Done:**
- [ ] `resolver` executes applicable rules in priority order
- [ ] Every resolution produces a complete `ResolutionResult` — no undefined fields
- [ ] `requires_human: true` always populates `human_context` with all three fields
- [ ] Resolver never throws — failures produce `status: 'failed'` with error captured in actions
- [ ] Rules are declarative data structures, not imperative code blocks
- [ ] LLM is called only after rule execution is complete — verified by test execution order
- [ ] LLM failure produces templated fallback, not a thrown error or empty `human_context`
- [ ] `requires_human: false` resolutions never call the LLM — verified by mocking the LLM adapter

**Tests — `src/agent/__tests__/resolver.test.ts`:**
```typescript
// Required scenarios:
scenario_1: maintenance_request → auto-routed → status: 'resolved', requires_human: false, LLM never called
scenario_2: maintenance_request > 48h unassigned → status: 'escalated', LLM called once, human_context populated
scenario_3: payment_issue, no reminder sent → reminder action taken, status: 'resolved', LLM never called
scenario_4: unclassified event → status: 'escalated', escalation_reason: 'unclassified input', LLM called with fallback prompt
scenario_5: rule throws internally → status: 'failed', error captured, no unhandled exception
scenario_6: LLM call throws → fallback HumanContext used, resolution still completes, status unchanged
```

**Artifacts produced:**
- `src/agent/resolver.ts`
- `src/agent/llm.ts` — LLM adapter with fallback
- `src/agent/rules/residential.ts`
- `src/agent/__tests__/resolver.test.ts`

---

### Milestone 1.3 — Escalation Engine & Notification Stubs

**What you build:**
- `src/agent/escalation.ts` — routes escalations to the correct manager role
- `src/agent/notifications.ts` — stub interface (real implementation in Phase 2)

**Escalation router logic:**
```typescript
// Priority order: urgency → role → channel
escalate(result: ResolutionResult, propertyContext: PropertyContext): EscalationPacket

interface EscalationPacket {
  target_role: 'manager' | 'owner' | 'emergency_services';
  channel: 'push' | 'email' | 'sms';
  context: HumanContext;
  deadline_minutes: number;    // SLA for human response
  auto_escalate_if_no_response: boolean;
}
```

**Notification stub:**
```typescript
// src/agent/notifications.ts
// All methods are no-ops in Phase 1 — they log to console and return Promise.resolve()
// Real implementation wired in Phase 2 via Supabase edge functions
export const notify = {
  push: async (target: string, message: string) => console.log('[STUB:push]', target, message),
  email: async (target: string, subject: string, body: string) => console.log('[STUB:email]'),
  sms: async (target: string, message: string) => console.log('[STUB:sms]'),
};
```

**Definition of Done:**
- [ ] Escalation packet is always complete and routable
- [ ] Notification stubs log correctly — every call is traceable in console output
- [ ] `deadline_minutes` is set per urgency level (critical: 15, high: 60, medium: 240, low: 1440)
- [ ] Stub interface matches the signature the real implementation will use — verified by TypeScript

**Tests:**
```typescript
escalation_critical → target: emergency_services, deadline: 15min
escalation_high → target: manager, channel: push + email
escalation_low → target: manager, channel: email only
stub_notify_push → console.log called with correct args, no throw
```

**Artifacts produced:**
- `src/agent/escalation.ts`
- `src/agent/notifications.ts` (stub)
- `src/agent/__tests__/escalation.test.ts`

---

### Milestone 1.4 — Wire Agent Loop into Existing TicketsPage

**This is the integration point between the existing UI and the new agent.** No component is rewritten — only the dispatch path changes.

**Current flow (before):**
```typescript
// TicketsPage.tsx — current behavior
dispatch({ type: 'ADD_TICKET', payload: newTicket })
// ticket goes directly into store, no classification, no routing
```

**New flow (after):**
```typescript
// TicketsPage.tsx — new behavior
// Resident submits → agent processes → result dispatched back to store
const handleSubmit = async (formData: TicketFormData) => {
  const event = buildAgentEvent(formData, { source: 'resident', property_type: 'Condo' })
  dispatch({ type: 'AGENT_EVENT_RECEIVED', payload: event })

  const classified = classify(event)
  const resolution = await resolve(classified)

  dispatch({ type: 'AGENT_RESOLUTION_COMPLETE', payload: resolution })

  // Existing ticket slice still updated — UI unchanged
  dispatch({ type: 'ADD_TICKET', payload: buildTicketFromResolution(event, resolution) })
}
```

**`buildAgentEvent`** maps existing `TicketFormData` fields to `AgentEvent` shape. This is the seam between old and new — document every field mapping explicitly.

**`buildTicketFromResolution`** maps `ResolutionResult` back to the existing `Ticket` type so `TicketsPage` renders identically. The component never knows the agent ran.

**Integration test scenarios (all must pass before Phase 2):**
```
Scenario A: "hay una fuga en el baño" submitted via TicketsPage form
  Expected: classified→maintenance_request, routed to staff, ADD_TICKET dispatched, TicketsPage renders new ticket

Scenario B: ticket created, age=73h, status=unassigned (simulated via store state)
  Expected: escalation rule fires, AGENT_RESOLUTION_COMPLETE with requires_human:true, appears in escalation queue

Scenario C: payment_issue submitted
  Expected: classified→payment_issue, auto-reminder action, resolved without human

Scenario D: garbage text submitted ("asdfg")
  Expected: unclassified→escalated, ticket still created, no crash

Scenario E: 5 concurrent submissions
  Expected: all process independently, no store corruption
```

**Definition of Done (Phase 1 Gate):**
- [ ] All 5 integration scenarios pass
- [ ] `TicketsPage` UI is visually and functionally identical to pre-agent behavior for the resident
- [ ] `state.agent.resolutions` correctly accumulates results after submissions
- [ ] `AgentResolutionRate` calculable from `state.agent.resolutions`
- [ ] Agent files have zero imports from `src/features/` or `src/layouts/`
- [ ] `tasks/lessons.md` updated with at least 3 learnings from Phase 1

**Artifacts produced:**
- `src/agent/loop.ts`
- `src/agent/__tests__/loop.integration.test.ts`
- `src/agent/metrics.ts` — `AgentResolutionRate` calculator
- Updated `src/features/tickets/TicketsPage.tsx` (dispatch path only)
- `src/agent/adapters/ticketAdapter.ts` — `buildAgentEvent` and `buildTicketFromResolution`
- Updated `tasks/lessons.md`

---

## Phase 2 — Supabase Schema

**Goal:** A database schema derived entirely from the agent's data needs. Every table is justified by a specific field in `AgentEvent`, `ClassifiedEvent`, or `ResolutionResult`.

---

### Milestone 2.1 — Schema Design (Paper First)

**Rule:** Design the schema by reading the agent types, not by thinking about UI screens.

**Required tables — derived from agent types:**

```sql
-- Every AgentEvent
CREATE TABLE events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_input     TEXT NOT NULL,
  source        TEXT NOT NULL CHECK (source IN ('resident','staff','sensor','schedule')),
  property_type TEXT NOT NULL,
  property_id   UUID REFERENCES properties(id),
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Every ClassifiedEvent
CREATE TABLE classified_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID REFERENCES events(id) ON DELETE CASCADE,
  classification      TEXT NOT NULL,
  confidence          NUMERIC(4,3) CHECK (confidence BETWEEN 0 AND 1),
  classifier_version  TEXT NOT NULL,
  classified_at       TIMESTAMPTZ DEFAULT now()
);

-- Every ResolutionResult
CREATE TABLE resolutions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID REFERENCES events(id) ON DELETE CASCADE,
  status            TEXT NOT NULL CHECK (status IN ('resolved','escalated','pending','failed')),
  actions_taken     JSONB DEFAULT '[]',
  escalation_reason TEXT,
  requires_human    BOOLEAN NOT NULL,
  human_context     JSONB,
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- AgentResolutionRate view — the north star KPI lives in the DB
CREATE VIEW agent_resolution_rate AS
SELECT
  COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
  COUNT(*) AS total,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'resolved')::numeric / NULLIF(COUNT(*),0) * 100, 2
  ) AS rate_percent
FROM resolutions;

-- Properties
CREATE TABLE properties (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,  -- Hotel, Condo, Factory, Airbnb
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Users (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id),
  role          TEXT NOT NULL CHECK (role IN ('Admin','Resident','Staff','Guest')),
  property_id   UUID REFERENCES properties(id),
  metadata      JSONB DEFAULT '{}'  -- extensible per PropertyType
);
```

**Definition of Done:**
- [ ] Every column maps to a field in `src/agent/types.ts` — annotate where
- [ ] No table exists that is only justified by a UI screen
- [ ] `agent_resolution_rate` view returns correct values against test data
- [ ] Schema reviewed against Phase 1 types — zero mismatches

**Artifacts produced:**
- `supabase/migrations/001_agent_schema.sql`
- `supabase/migrations/002_resolution_view.sql`
- `docs/schema_type_mapping.md` — table column ↔ TypeScript field, one row per column

---

### Milestone 2.2 — Migration & Seed

**What you build:**
- `supabase/seed/residential.sql` — industry-specific initial state
- The Supabase swap in `StoreProvider` — **two `useEffect` calls change, nothing else**

**The exact swap point — this is the only code that changes in the existing store:**

```typescript
// src/core/store/store.tsx — StoreProvider

// BEFORE (Phase 1):
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}, [state])

// AFTER (Phase 2):
useEffect(() => {
  supabase.from('store_state').upsert({ key: STORAGE_KEY, value: state })
}, [state])

// And loadInitialState() becomes:
async function loadInitialState(): Promise<StoreState> {
  const { data } = await supabase.from('store_state').select('value').eq('key', STORAGE_KEY).single()
  if (data) return applyMigrations(data.value)
  return seedState
}
// Note: StoreProvider becomes async-initialized — use a loading state wrapper
```

The migration logic (`applyMigrations`) is the same function that currently runs inside `loadInitialState()`. It moves, it doesn't change.

**Seed data requirements:**
```sql
-- Mirrors existing seed.ts data — same residents, same building config
-- Add agent slice defaults
INSERT INTO properties VALUES ('...', 'Test Condo', 'Condo', now());
INSERT INTO user_profiles VALUES ('...', 'Admin', property_id, '{}');
INSERT INTO user_profiles VALUES ('...', 'Resident', property_id, '{"apartment": "3B", "tower": "A"}');

-- 10 synthetic agent events covering all EventClass types
-- 3 pre-resolved, 2 pre-escalated, 5 pending
-- Verifies AgentResolutionRate base calculation = 30%
```

**Definition of Done:**
- [ ] `supabase db reset` runs cleanly
- [ ] Seed produces expected base `AgentResolutionRate` (30%)
- [ ] All Phase 1 integration tests pass with Supabase as backend
- [ ] RLS policies defined: Resident sees only own events, Staff sees assigned, Admin sees all
- [ ] `loadInitialState()` falls back to seed if Supabase returns empty — no blank app

**Artifacts produced:**
- `supabase/migrations/001_agent_schema.sql`
- `supabase/migrations/002_rls_policies.sql`
- `supabase/seed/residential.sql`
- Updated `src/core/store/store.tsx` (two useEffect swaps + async loadInitialState)

---

### Milestone 2.3 — Notification Real Implementation

**What you build:**
- `supabase/functions/notify/index.ts` — Supabase Edge Function replacing stubs
- Wire into `src/agent/notifications.ts`

**Definition of Done:**
- [ ] All Phase 1 notification stubs replaced with real implementations
- [ ] Edge function deployable: `supabase functions deploy notify` succeeds
- [ ] Integration test Scenario B (72h escalation) triggers real push notification in staging
- [ ] Failed notifications do not crash the loop — they produce `success: false` in `AgentAction`

**Phase 2 Gate — Definition of Done:**
- [ ] All Phase 1 integration tests pass against Supabase (not in-memory state)
- [ ] `AgentResolutionRate` readable from DB view at any time
- [ ] Schema diff is zero between local and staging: `supabase db diff` is clean
- [ ] Zero LocalStorage references remain in `src/agent/`

---

## Phase 3 — Production UI

**Goal:** Add the agent surface to the existing UI. Most of what you built already works. This phase adds what's missing and wires what exists to real data.

---

### What already exists and needs only data-source wiring

| Screen | File | Change needed |
|---|---|---|
| TicketsPage | `src/features/tickets/TicketsPage.tsx` | Already wired in Phase 1 — verify renders from Supabase |
| PagosPage | `src/features/pagos/PagosPage.tsx` | Swap store reads to Supabase — no layout changes |
| AvisosPage | `src/features/avisos/AvisosPage.tsx` | Swap store reads — no layout changes |
| PaqueteriaPage | `src/features/paqueteria/PaqueteriaPage.tsx` | Swap store reads — no layout changes |
| AmenidadesPage | `src/features/amenidades/AmenidadesPage.tsx` | Swap store reads — no layout changes |
| VotacionesPage | `src/features/votaciones/VotacionesPage.tsx` | Swap store reads — no layout changes |
| UsuariosPage | `src/features/usuarios/UsuariosPage.tsx` | Swap store reads — no layout changes |

---

### Milestone 3.1 — Agent Surface (New Components)

These do not exist yet. Build them into the existing `AdminDashboard`:

**What you build:**
- `src/core/components/ExceptionQueue.tsx`
- `src/core/components/ResolutionCard.tsx`
- `src/core/components/AgentMetricsBar.tsx`

**Wire into existing `AdminDashboard`:**
```typescript
// src/features/dashboard/AdminDashboard.tsx — add to existing layout
// AgentMetricsBar goes at the top, above existing stats
// ExceptionQueue goes as a new section below existing dashboard content
// Nothing existing is removed

const { state } = useStore()
const escalations = state.agent.resolutions.filter(r => r.requires_human && r.status !== 'resolved')
const resolutionRate = calculateRate(state.agent.resolutions)
```

**ExceptionQueue contract:**
```typescript
// Renders only resolutions where requires_human === true AND status !== 'resolved'
// Sorted: critical → high → medium → low, then created_at ASC within same urgency
// Each ResolutionCard shows: summary, urgency StatusBadge, recommended_action, resolve button
// Uses existing StatusBadge component — do not create a new one
```

**AgentMetricsBar:**
```typescript
{
  resolution_rate: number,        // state.agent.resolutions resolved/total
  events_today: number,           // state.agent.events filtered by today's date
  escalated_pending: number,      // escalations.length
  avg_resolution_time_hours: number
}
```

**Definition of Done:**
- [ ] `AgentMetricsBar` visible in `AdminDashboard` — does not break existing layout
- [ ] `ExceptionQueue` renders only `requires_human: true` + `status !== 'resolved'` items
- [ ] Urgency sort correct — verified with seed data containing mixed urgency levels
- [ ] Manager can resolve an escalation in ≤ 3 clicks using existing `ActionCanvas` pattern
- [ ] Empty state designed: "Sin excepciones — el agente está manejando todo"
- [ ] `ResolutionCard` uses existing `StatusBadge` — no duplicate component created

---

### Milestone 3.2 — Resident Submit Flow

**The `ResidentDashboard` submit path needs one addition** — it must show the agent's resolution status back to the resident after submission. The form itself doesn't change.

```typescript
// src/features/dashboard/ResidentDashboard.tsx
// After ticket submission, poll state.agent.resolutions for the matching event_id
// Show: "Tu solicitud está siendo procesada" → "Asignado a mantenimiento" → "Resuelto"
// This is a status read from state — no new API calls
```

**Definition of Done:**
- [ ] Resident sees status update within 2 seconds of submission (from local agent processing)
- [ ] Status labels are in Spanish and match existing UI tone
- [ ] Resident cannot see other residents' resolutions — filtered by apartment in state

---

### Milestone 3.3 — Staff Escalation Queue

**`StaffQueue` is new** — staff currently see tickets but not agent-prepped escalation packets.

```typescript
// src/features/dashboard/StaffDashboard.tsx — new or extend existing
// Shows: escalations assigned to staff role, with full HumanContext pre-loaded
// Staff resolves → dispatches AGENT_ESCALATION_RESOLVED → queue updates
```

**Definition of Done:**
- [ ] Staff sees only escalations routed to their role (not manager-only escalations)
- [ ] `HumanContext` displayed without additional queries — already in store state
- [ ] Staff resolve action updates `state.agent.resolutions` immediately

---

### Phase 3 Gate — Definition of Done

- [ ] All screens read from Supabase — zero LocalStorage references remain anywhere in `src/`
- [ ] `AgentResolutionRate` visible in `AdminDashboard` at all times
- [ ] E2E test: Spanish text submitted via `TicketsPage` → agent classifies → resolves → correct UI state
- [ ] `units_per_manager` calculable: `state.residents.length / 1` (scale denominator as team grows)
- [ ] Existing features (pagos, avisos, paqueteria, votaciones) work identically to pre-agent behavior
- [ ] No UI component contains classification or routing logic

---

## Continuous Artifacts

These live documents are updated throughout all phases:

| Artifact | Location | Updated when |
|---|---|---|
| Lessons log | `tasks/lessons.md` | After any correction or unexpected finding |
| Type mapping | `docs/schema_type_mapping.md` | Any type change in Phase 1 or schema change in Phase 2 |
| Rule registry | `src/agent/rules/README.md` | Any new rule added |
| KPI log | `docs/kpi_log.md` | Weekly — track `AgentResolutionRate` and `units_per_manager` over time |

---

## Phase Gate Summary

| Gate | Requirement | Hard Blocker |
|---|---|---|
| Pre-Flight done | `npm run build` zero errors, dead files deleted, clean commit | Yes |
| Phase 0 → 1 | `docs/ui_decisions.md` complete, Pre-Flight merged | Yes |
| Milestone 1.0 | Store extended, no regressions in existing features | Yes |
| Phase 1 → 2 | All 5 integration scenarios pass, Spanish classification works, agent has no UI imports | Yes |
| Phase 2 → 3 | All Phase 1 tests pass against Supabase, schema diff clean, `supabase db reset` passes | Yes |
| Phase 3 done | E2E loop passes in Spanish, all data from Supabase, existing features unbroken | Yes |

**You do not negotiate gate criteria.** A partial pass is a fail.