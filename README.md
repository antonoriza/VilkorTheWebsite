# CantonAlfa (Evolution of PropertyPulse)

**CantonAlfa** is a state-of-the-art residential management platform built on the philosophy of **Zero-Friction Management**. It digitizes every physical interaction within a residential community into a single, unified, and highly delegable interface.

> Correct build order: **UI Prototype (throwaway) → Agent Engine → Supabase Schema → Production UI**  
> North Star KPI: `AgentResolutionRate` > 80% | `units_per_manager` ratio

---

## 🧠 Core Architecture: The Agent Engine

CantonAlfa is powered by an autonomous resolution loop designed for high reliability and deterministic routing. Unlike traditional "black box" AI, our agent uses a hybrid approach: **Rule-based Classification** for speed/certainty and **LLM-assisted Context** for human handoffs.

### The Resolution Loop
```mermaid
flowchart TD
    Start([Raw Input]) --> BuildEvent[Build AgentEvent]
    BuildEvent --> Classifier{Classifier<br/>Rule-based}
    
    Classifier -->|Unclassified| Escalator[Escalation Engine]
    Classifier -->|Classified| Resolver[Resolution Engine]
    
    subgraph ResolutionEngine [Resolution Engine]
        direction TB
        Rules[Deterministic Rules] --> HumanCheck{Requires Human?}
        HumanCheck -->|Yes| LLMCall[LLM Context Gen]
        HumanCheck -->|No| AutoAction[Automated Action]
    end
    
    ResolutionEngine --> Result{Status}
    Result -->|Escalated| Escalator
    Result -->|Resolved| Log[Audit Log]
    Escalator --> Log
    Log --> End([Final Resolution])
    
    classDef logic fill:#e1f5fe,stroke:#01579b,color:#01579b
    classDef engine fill:#f3e5f5,stroke:#4a148c,color:#4a148c
    classDef action fill:#e8f5e9,stroke:#1b5e20,color:#1b5e20
    
    class Classifier,HumanCheck logic
    class ResolutionEngine,Escalator engine
    class AutoAction,Log action
```

### Interaction Sequence
```mermaid
sequenceDiagram
    participant R as Resident
    participant A as Agent Engine
    participant S as Supabase
    participant M as Manager (UI)
    
    R->>A: Submits Request (Text/Sensor)
    A->>A: Classify & Resolve
    
    alt Auto-resolved
        A->>S: Store Resolution
        A-->>R: Notify Outcome
    else Escalated (Human Required)
        A->>S: Store Escalation + Context
        A->>M: Push Notification (Urgency-based)
        M->>S: Fetch ResolutionCard (HumanContext)
        M->>R: Finalize Resolution
    end
```

---

## 📊 Database Design

Our schema is derived directly from the agent's data requirements, ensuring that every byte stored contributes to the **AgentResolutionRate** KPI.

```mermaid
erDiagram
    PROPERTIES ||--o{ EVENTS : "belongs to"
    PROPERTIES ||--o{ USER_PROFILES : "contains"
    EVENTS ||--o| CLASSIFIED_EVENTS : "results in"
    EVENTS ||--o| RESOLUTIONS : "generates"
    
    EVENTS {
        uuid id PK
        text raw_input
        text source "resident | staff | sensor"
        jsonb metadata
        timestamptz created_at
    }
    CLASSIFIED_EVENTS {
        uuid id PK
        uuid event_id FK
        text classification
        numeric confidence "0.0 - 1.0"
        text classifier_version
    }
    RESOLUTIONS {
        uuid id PK
        uuid event_id FK
        text status "resolved | escalated | pending"
        boolean requires_human
        jsonb human_context "LLM Generated"
        timestamptz resolved_at
    }
    PROPERTIES {
        uuid id PK
        text name
        text type "Hotel | Condo | Factory"
    }
    USER_PROFILES {
        uuid id PK
        text role "Admin | Resident | Staff"
        uuid property_id FK
    }
```

---

## 🛠 Tech Stack
- **Frontend**: Vite 6 + React 19 + TypeScript.
- **Styling**: Vanilla CSS (High-end Editorial Aesthetic).
- **Backend**: Supabase (PostgreSQL + RLS + Edge Functions).
- **Intelligence**: Rule-based Decision Trees + LLM (Anthropic/Gemini) for Synthesis.
- **Architecture**: Domain-Driven Design (DDD) with a central Agent Loop.

## 🚀 Development Phases

| Phase | Goal | Definition of Done |
|---|---|---|
| **Phase 0** | **UI Prototype** | Throwaway app validating manager click-flow and card layout. |
| **Phase 1** | **Agent Engine** | Working `processEvent` loop with 100% test coverage and LLM stubs. |
| **Phase 2** | **Supabase** | Schema migration, RLS policies, and real persistence layer. |
| **Phase 3** | **Production UI** | High-fidelity dashboard reading directly from the agent loop. |

---

## 🧪 Setup & Development

### Prerequisites
- Node.js (Latest stable)
- Supabase CLI (for Phase 2+)

### Running Locally
```bash
npm install
npm run dev
```

### Documentation Links
- [AGENTS.md](AGENTS.md) — Detailed Engineering Development Process & Rules.
- [implementationPlan.md](implementationPlan.md) — Current sprint and task tracking.

---
*CantonAlfa: The Operating System for Modern Living.*
