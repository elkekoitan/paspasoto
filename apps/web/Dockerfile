# Multi-stage build: Node build → Node SSR runtime
# ----------------- Builder -----------------
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++ libc6-compat \
  && corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --filter web... --frozen-lockfile

COPY apps/web ./apps/web

ARG PUBLIC_SITE_URL=https://paspasoto.com
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL
ENV PWA_DISABLED=false
ENV NODE_ENV=production

WORKDIR /repo/apps/web
RUN pnpm build

# ----------------- Runtime -----------------
FROM node:20-alpine AS runner

RUN apk add --no-cache wget tini libc6-compat \
  && corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
ENV DATA_DIR=/data

# Sadece prod bağımlılıklar
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
RUN pnpm install --filter web... --frozen-lockfile --prod

# Build çıktısı
COPY --from=builder /repo/apps/web/dist ./apps/web/dist

# Persistent data dizini (Coolify volume buraya mount edilir)
RUN mkdir -p /data && chown -R node:node /data /app
USER node

EXPOSE 4321

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O- http://127.0.0.1:4321/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/dist/server/entry.mjs"]
