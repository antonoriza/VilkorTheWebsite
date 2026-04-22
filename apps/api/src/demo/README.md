# Demo Module

This folder contains everything needed to populate the application with realistic demo data.

## Structure

```
demo/
├── seed.ts           ← Orchestrator: runs all fixtures in order
└── fixtures/
    ├── residents.ts      ← 116 Mexican-named residents across 2 towers
    ├── staff.ts          ← 4 staff members with roles and shifts
    ├── amenities.ts      ← 3 outdoor grill amenities
    ├── pagos.ts          ← Payment constants (amount, month, status cycle)
    ├── tickets.ts        ← 4 sample maintenance/complaint tickets
    ├── avisos.ts         ← 2 sample announcements
    ├── building-config.ts ← Full building configuration object
    └── accounts.ts       ← Which residents get demo login credentials
```

## How it's triggered

`db/seed.ts` dynamically imports `demo/seed.ts` when `APP_MODE=demo`:

```bash
APP_MODE=demo bun run src/db/seed.ts
```

In production (`APP_MODE=production`), this module is never imported.

## Excluding from production builds

Add to `.dockerignore`:

```
apps/api/src/demo/
```

This reduces the production Docker image size and ensures demo code never ships.

## Demo credentials

| Role       | Email                | Password   |
|------------|----------------------|------------|
| super_admin| admin@property.com   | admin123   |
| residente  | B0101@gmail.com      | demo123    |
| residente  | B0102@gmail.com      | demo123    |
| residente  | A0101@gmail.com      | demo123    |
| residente  | A0102@gmail.com      | demo123    |
