# === Build stage ===
FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace manifests
COPY pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared/ ./packages/shared/
COPY apps/server/ ./apps/server/

# Build TypeScript
RUN pnpm --filter @code-duo/server build

# === Production stage ===
FROM node:20-alpine AS runner

RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/packages/shared/src ./packages/shared/src

# Create data directory for SQLite
RUN mkdir -p /app/data
VOLUME ["/app/data"]

WORKDIR /app/apps/server

ENV NODE_ENV=production
ENV PORT=4000
ENV DATA_DIR=/app/data

EXPOSE 4000

CMD ["node", "dist/index.js"]
