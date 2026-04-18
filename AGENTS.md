# PropertyPulse — Engineering Development Process
> Correct build order: **UI Prototype (throwaway) → Agent Engine → Supabase Schema → Production UI**
> North Star KPI: `AgentResolutionRate` > 80% | `units_per_manager` ratio

---

## Build Philosophy

Every phase gate is a hard stop. You do not proceed to the next phase until the current Definition of Done (DoD) is fully satisfied. A passing test suite is not optional — it is the proof of correctness.

The order is non-negotiable because:
- The prototype validates interaction patterns only — not system behavior. It gets thrown away.
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

## Phase 0 — UI Prototype (Throwaway)

**Goal:** Validate interaction patterns and information layout with hardcoded data. Confirm the manager, resident, and staff surfaces feel right before building the engine behind them.

**Hard rule: zero production code comes out of this phase.** No component from Phase 0 is imported into Phase 1, 2, or 3. When Phase 0 is done, the folder is archived or deleted.

**Time budget: 3 days maximum.** If it takes longer, you're building production UI, not a prototype.

---

### What you build

A single self-contained React app in `prototype/` (outside `src/`):

```
prototype/
  index.html
  App.tsx
  data/
    mock_events.ts        ← hardcoded AgentEvent-shaped objects
    mock_resolutions.ts   ← hardcoded ResolutionResult-shaped objects
  screens/
    ManagerDashboard.tsx  ← exception queue + metrics bar
    ResidentSubmit.tsx    ← request submission form
    StaffQueue.tsx        ← escalation queue with HumanContext
```

**Mock data shape must mirror real types.** Use the same field names as `AgentEvent` and `ResolutionResult` even though data is hardcoded. This is the one discipline that carries over — it prevents prototype-to-production shape mismatches.

```typescript
// prototype/data/mock_resolutions.ts
// Hardcoded — no agent, no LLM, no API calls
const mockResolutions: ResolutionResult[] = [
  {
    event_id: 'evt_001',
    status: 'escalated',
    requires_human: true,
    human_context: {
      summary: 'Leaking pipe in unit 3B, unassigned for 52 hours.',
      recommended_action: 'Call plumber on vendor list, notify resident of ETA.',
      urgency: 'high',
      history: [],
    },
    actions_taken: [],
  },
  // 4-5 more covering: resolved, pending, critical urgency, low urgency
];
```

**What to validate in this phase:**

| Question | How to validate |
|---|---|
| Does the exception queue surface the right information? | Show to someone unfamiliar with the system. Can they act without asking questions? |
| Is urgency sort order intuitive? | Can a manager find the critical item in under 5 seconds? |
| Does ResolutionCard have the right fields? | Attempt to mentally resolve each mock item using only the card. Is anything missing? |
| Is 3-click resolution achievable? | Count the actual clicks in the prototype. |
| Does the resident submit form produce the right shape of event? | Log the form output to console. Does it match `AgentEvent` fields? |

**What NOT to validate here:**
- Whether classification is correct — that's Phase 1
- Whether the LLM summary is good — that's Phase 1
- Whether anything actually saves — that's Phase 2
- Performance, loading states, error handling — that's Phase 3

### Definition of Done (Phase 0 Gate)

- [ ] Manager can identify and act on the highest-urgency escalation in under 5 seconds
- [ ] `ResolutionCard` fields match what a real manager needs — confirmed by manually walking through each mock item
- [ ] Resident submission form fields map directly to `AgentEvent` fields — zero invented fields
- [ ] Mock data shape matches `AgentEvent` and `ResolutionResult` field names exactly
- [ ] Written answers to all 5 validation questions above — stored in `prototype/VALIDATION.md`
- [ ] `prototype/` folder isolated — zero imports from or into `src/`

### Artifacts produced

- `prototype/` — entire throwaway app
- `prototype/VALIDATION.md` — answers to the 5 validation questions
- `docs/ui_decisions.md` — what you learned: what changed, what stayed, what surprised you. This file informs Phase 3.

---

## Phase 1 — Agent Engine

**Goal:** A working autonomous resolution loop for one `PropertyType` (Residential), end-to-end, with zero UI dependency.

---

### Milestone 1.1 — Event Model & Classifier

**What you build:**
- `src/agent/types.ts` — canonical type definitions
- `src/agent/classifier.ts` — pure function: `Event → EventClass`

**Implementation approach: keyword + rule-based. No LLM.**

The classifier is a decision tree over keyword sets and structured patterns. It is synchronous, has zero network calls, and costs nothing per event. This is the correct tool — the classification problem for property management is closed-domain and enumerable.

```typescript
// src/agent/classifier.ts — implementation strategy
const KEYWORD_MAP: Record<EventClass, string[]> = {
  maintenance_request: ['leak', 'broken', 'repair', 'noise', 'heat', 'ac', 'door', 'window', 'pipe', 'toilet', 'ceiling'],
  payment_issue:       ['rent', 'payment', 'invoice', 'charge', 'fee', 'balance', 'overdue', 'paid'],
  communication_gap:   ['nobody told', 'not informed', 'didn\'t know', 'unaware', 'no notice'],
  compliance_trigger:  ['sensor:', 'temp:', 'pressure:', 'fire', 'gas', 'flood'],
  access_request:      ['key', 'access', 'locked out', 'entry', 'fob', 'gate'],
};

// Confidence = (matched keywords / total keywords in class) * coverage weight
// If max confidence across all classes < 0.6 → unclassified
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
classify("I haven't paid rent yet")               // → payment_issue
classify("nobody told me the gym was closed")     // → communication_gap
classify("")                                      // → unclassified, confidence = 0
classify(null)                                    // → unclassified, no throw
classify("asdkjhasd random garbage")              // → unclassified, confidence < 0.6
classify("sensor:temperature:unit_3:45C")         // → compliance_trigger (if rule exists) or unclassified
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

### Milestone 1.4 — Agent Loop Integration Test

**What you build:**
- `src/agent/loop.ts` — orchestrates the full pipeline
- `src/agent/__tests__/loop.integration.test.ts` — end-to-end scenarios

**The loop:**
```typescript
async function processEvent(rawInput: string, context: EventContext): Promise<ResolutionResult> {
  const event = buildEvent(rawInput, context);
  const classified = classify(event);
  const resolution = await resolve(classified);
  if (resolution.status === 'escalated') {
    await escalate(resolution, context.property);
  }
  await log(event, classified, resolution);
  return resolution;
}
```

**Integration test scenarios (all must pass before Phase 2):**
```
Scenario A: Leaking toilet in Residential unit
  Input: "water leaking from ceiling in 3B"
  Expected: classified→maintenance_request, routed to staff, status→resolved
  AgentResolutionRate contribution: +1 resolved / +1 total

Scenario B: 72h unresolved maintenance ticket
  Input: synthetic event, age=73h, status=unassigned
  Expected: escalated to manager, human_context.urgency=high, deadline=60min

Scenario C: Payment event, already has reminder sent
  Input: payment_issue, metadata.reminder_sent=true
  Expected: no duplicate action, status→escalated for human review

Scenario D: Garbage input
  Input: "!!!asdf 123"
  Expected: unclassified→escalated, no throw, escalation_reason populated

Scenario E: Five concurrent events
  Input: 5 simultaneous processEvent calls
  Expected: all resolve independently, no shared state corruption
```

**Definition of Done (Phase 1 Gate):**
- [ ] All 5 integration scenarios pass
- [ ] `AgentResolutionRate` measurable from loop output (resolved/total)
- [ ] Zero unhandled promise rejections across all test cases
- [ ] Entire agent layer has no UI imports, no LocalStorage references, no React dependencies
- [ ] `tasks/lessons.md` updated with at least 3 learnings from Phase 1

**Artifacts produced:**
- `src/agent/loop.ts`
- `src/agent/__tests__/loop.integration.test.ts`
- `src/agent/metrics.ts` — `AgentResolutionRate` calculator
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
- `src/agent/store.ts` — Supabase client wrapper replacing LocalStorage

**Seed data requirements:**
```sql
-- Minimum viable seed for Residential PropertyType
INSERT INTO properties VALUES ('...', 'Test Condo', 'Condo', now());
INSERT INTO user_profiles VALUES ('...', 'Admin', property_id, '{}');
INSERT INTO user_profiles VALUES ('...', 'Resident', property_id, '{"unit": "3B"}');

-- 10 synthetic events covering all EventClass types
-- 3 pre-resolved, 2 pre-escalated, 5 pending
-- Used to verify AgentResolutionRate calculates correctly (3/10 = 30% base rate)
```

**Store wrapper:**
```typescript
// src/agent/store.ts
// Replaces all LocalStorage calls — same interface, Supabase underneath
export const agentStore = {
  saveEvent: async (event: AgentEvent) => { ... },
  saveResolution: async (result: ResolutionResult) => { ... },
  getResolutionRate: async (): Promise<number> => { ... },  // queries the view
  getEscalationQueue: async (): Promise<ResolutionResult[]> => { ... },
};
```

**Definition of Done:**
- [ ] Migration runs cleanly on fresh Supabase project: `supabase db reset` passes
- [ ] Seed produces exactly the expected base `AgentResolutionRate` (30%)
- [ ] `agentStore` passes all Phase 1 integration tests when substituted for in-memory state
- [ ] Row Level Security (RLS) policies defined: Resident sees only own events, Staff sees assigned, Admin sees all

**Artifacts produced:**
- `supabase/migrations/001_agent_schema.sql`
- `supabase/migrations/002_rls_policies.sql`
- `supabase/seed/residential.sql`
- `src/agent/store.ts`

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

## Phase 3 — UI

**Goal:** Build a control panel for a real engine with real data. Every screen answers: "What does the manager need to see to handle their exception queue?"

---

### Milestone 3.1 — Manager Dashboard (Exception Queue)

**This is the most important screen in the product.** It is the surface where the force multiplier is visible.

**What you build:**
- `src/components/dashboard/ExceptionQueue.tsx`
- `src/components/dashboard/ResolutionCard.tsx`
- `src/components/dashboard/AgentMetricsBar.tsx`

**ExceptionQueue contract:**
```typescript
// Only renders resolutions where requires_human === true
// Sorted by urgency DESC, then created_at ASC
// Each item shows: summary, urgency badge, recommended_action, one-click resolve/reassign
```

**AgentMetricsBar must show at all times:**
```typescript
{
  resolution_rate: number,       // from agent_resolution_rate view
  events_today: number,
  escalated_pending: number,
  avg_resolution_time_hours: number
}
```

**Definition of Done:**
- [ ] ExceptionQueue renders only `requires_human: true` items — verified with test data
- [ ] Urgency sort order correct: critical → high → medium → low
- [ ] `AgentResolutionRate` in MetricsBar matches DB view value exactly
- [ ] Manager can resolve an escalation in ≤ 3 clicks
- [ ] Empty state is designed (not a blank screen): "No exceptions — agent is handling everything"

---

### Milestone 3.2 — Plugin UI Surfaces

Build plugin UIs in this order, gated by agent integration:

**[Residential] Maintenance Plugin:**
- `src/plugins/residential/MaintenanceBoard.tsx`
- Shows: open tickets, agent-assigned vs. human-assigned, resolution status
- Does NOT allow creating tickets without going through agent loop

**[Residential] Finance Plugin:**
- `src/plugins/residential/LedgerView.tsx`
- Dual view: resident balance (filtered) + admin master (full)
- Flagged anomalies surfaced from agent actions

**[Hospitality] Check-in Plugin:**
- `src/plugins/hospitality/CheckInBoard.tsx`
- Agent handles standard check-ins autonomously
- UI shows only exceptions: late arrivals, ID mismatches, special requests

**Definition of Done per plugin:**
- [ ] Plugin reads from Supabase, not from LocalStorage or local state
- [ ] Plugin renders agent-produced data — does not duplicate agent logic
- [ ] `PluginOrchestrator` correctly enables/disables plugin based on `PropertyType`
- [ ] Plugin is independently testable with a single seed dataset

---

### Milestone 3.3 — Resident & Staff Views

**Resident view principles:**
- Resident submits a request → it enters the agent loop immediately
- Resident sees status updates produced by agent actions, not by manual staff updates
- Resident never sees the agent layer — they see outcomes

**Staff view principles:**
- Staff sees their assigned queue (escalations routed to them)
- Pre-built `HumanContext` is displayed — staff never has to gather information manually
- Staff action closes the escalation and feeds result back into the loop

**Definition of Done:**
- [ ] Resident submission → agent processes → resident sees status update: full loop < 2s in staging
- [ ] Staff view loads `HumanContext` without additional queries (pre-fetched with escalation)
- [ ] RLS verified: Resident cannot see other residents' events even via direct API call

---

### Phase 3 Gate — Definition of Done

- [ ] All screens read from Supabase — zero mocked data in production paths
- [ ] `AgentResolutionRate` visible to Admin at all times
- [ ] E2E test: raw text input → agent classifies → resolves or escalates → correct UI state
- [ ] `units_per_manager` ratio is calculable from production data
- [ ] No UI component contains business logic that belongs in the agent layer

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
| Phase 0 → 1 | Validation questions answered, mock shapes match real types, `prototype/` isolated | Yes |
| Phase 1 → 2 | All 6 resolver scenarios pass (including LLM failure), agent has no UI dependencies | Yes |
| Phase 2 → 3 | All Phase 1 tests pass against Supabase, schema diff clean | Yes |
| Phase 3 done | E2E loop test passes, all data from Supabase, rate visible | Yes |

**You do not negotiate gate criteria.** A partial pass is a fail.