# CantonAlfa (Evolution of PropertyPulse)

**CantonAlfa** is a state-of-the-art residential management platform built on the philosophy of **Zero-Friction Management**. It digitizes every physical interaction within a residential community into a single, unified, and highly delegable interface.

## 🚀 Strategic Value Pillars
* **Operational Excellence:** Automatic payment ledgers, reservations, and package logistics.
* **Safety & Trust:** Secure perimeter management and identity verification.
* **High ROI:** Data-driven maintenance that preserves property value.
* **Community Intelligence:** Collaborative decision-making through an integrated voting system.

## 🛠 Tech Stack
- **Frontend**: Vite 6 + React 19 + TypeScript.
- **Styling**: Tailwind CSS v3.4 (Forms & Container Queries).
- **Icons**: Material Symbols (Outlined).
- **Architecture**: Context API + `useReducer` for reactive persistence.
- **Design System**: Architectural Minimalist (Editorial Spacing & Tonal Layering).

## 📦 Functional Modules
- **Avisos**: High-fidelity community channel with document management.
- **Pagos**: Dual-role ledger for resident transparency and admin oversight.
- **Paquetería**: Automated receipt-to-delivery logistics.
- **Amenidades (Asadores)**: Calendar-based booking for complex amenities.
- **Votaciones**: Decision-making engine for community consensus.

## 🧪 Development & Setup

### Prerequisites
- Node.js (Latest stable)
- npm (Latest)

### Running Locally
```bash
npm install
npm run dev
```

### Authentication (Local Dev)
The application uses a local `AuthContext` with a toggle in the header to switch between:
- **Residente**: Juan Antonio (A201)
- **Administrador**: Control over all global entities.

## 🏗 Documentation
For detailed architecture and LLM agent instructions, see:
- [AGENTS.md](AGENTS.md) — Primary context for AI coding assistants.
- `src/data/seed.ts` — Initial state for all modules.

---

*CantonAlfa: The Operating System for Modern Living.*
