# CantonAlfa Agent Context & Architecture

This document serves as the primary technical context for LLM agents working on the **CantonAlfa** (formerly PropertyPulse) platform. Use this to understand the architecture, design philosophy, and established patterns.

## 1. Project Vision
**Zero-Friction Management**: Digitizing every physical interaction in a residential complex into a single, unified, and delegable interface.

## 2. Tech Stack
- **Frontend**: Vite 6 + React 19 + TypeScript.
- **Styling**: Tailwind CSS v3.4 (with `forms`, `container-queries`).
- **Icons**: Material Symbols Outlined.
- **Typography**: 
  - `font-headline`: Manrope (ExtraBold for headers).
  - `font-sans`: Inter (Medium/SemiBold for UI text).
- **Persistence**: Temporary LocalStorage-backed store (ready for Supabase migration).

## 3. Core Architecture

### Context & State
- **`AuthContext` (`src/context/AuthContext.tsx`)**:
  - Manages `role` ('residente' | 'admin').
  - Provides `user` info and `apartment` context.
  - Global role toggle in the header for testing.
- **`StoreContext` (`src/data/store.tsx`)**:
  - Centralized state using `useReducer`.
  - Persists entire state to `localStorage` under `cantonalfa-store`.
  - Handles CRUD for: Avisos, Pagos, Paquetes, Reservaciones, Votaciones.

### Layout & Navigation
- **`DashboardLayout` (`src/layouts/DashboardLayout.tsx`)**:
  - Responsive sidebar with active state mapping.
  - Header with dynamic role-based actions, notifications, and profile.
  - Tonal layering background (`bg-slate-50`).

### Design System: "Architectural Minimalist"
- **Color Palette**: Highly curated Slate/Tonal grays (`slate-900` for primary text/buttons, `slate-400/500` for secondary).
- **Surface**: White cards with delicate borders (`slate-200`) and subtle shadows.
- **Spacing**: Editorial-style spacing (wide margins, clear hierarchy).
- **Interactive**: Glassmorphism modals (`backdrop-blur-xl`), smooth transitions, and distinct focus states.

## 4. Functional Modules
1. **Avisos**: community announcements with card-based UI and document download.
2. **Pagos**: Dual-view (Resident balance vs. Admin ledger) with status tracking.
3. **Paquetería**: Receipt and delivery control with search and location tracking.
4. **Asadores**: Amenity booking with calendar/time validation.
5. **Votaciones**: Decision-making polls with progress visualization and role-based voting rules.

## 5. Development Patterns for Agents
- **Roles**: Always check `role` from `useAuth()` to render restricted buttons (e.g., "Add", "Edit", "Delete").
- **Data**: Always use `state` and `dispatch` from `useStore()` for entity operations.
- **Consistency**: Use the `StatusBadge` component for state indicators and `Modal` for forms.
- **Naming**: Follow the established entity names: `aviso`, `pago`, `paquete`, `reservacion`, `votacion`.
- **Tech Debt**: The `.ts` files containing JSX must be named `.tsx`.

## 6. Seed Data
Initial state is populated from `src/data/seed.ts`. To reset the application, clear `localStorage` and refresh.
