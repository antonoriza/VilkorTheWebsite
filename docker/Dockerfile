# Vilkor API — Multi-stage Docker Build
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copy workspace root + package configs
COPY package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source code
COPY packages/shared packages/shared
COPY apps/api apps/api

# ─── Production Image ────────────────────────────────────────────────
FROM oven/bun:1-alpine
WORKDIR /app

# Copy installed dependencies + source
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/package.json ./

# Data directory for SQLite files (mount as Docker volume)
RUN mkdir -p /app/apps/api/data/tenants

VOLUME ["/app/apps/api/data"]

EXPOSE 3000

# Run migrations + start server
CMD ["sh", "-c", "cd apps/api && bun run src/db/migrate.ts && bun run src/index.ts"]
