# Multi-stage build: Node build → Node SSR runtime
# Astro 5 hybrid (output: server) + @astrojs/node standalone
# ----------------- Builder -----------------
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# pnpm CI modunda interaktif onay isteme — Coolify build no-TTY çalışıyor
ENV CI=true

WORKDIR /repo

# Monorepo root manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/

# Tüm bağımlılıkları kur (build için tipler/dev tooling de gerek)
RUN pnpm install --filter web... --frozen-lockfile

# Source
COPY apps/web ./apps/web

# Build args
ARG PUBLIC_SITE_URL=https://paspasoto.com
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL
ENV PWA_DISABLED=false
ENV NODE_ENV=production

WORKDIR /repo/apps/web
RUN pnpm build

# Prod node_modules: dev deps'leri kaldır (CI=true sayesinde no-TTY OK)
WORKDIR /repo
RUN pnpm prune --prod --filter web... --config.confirmModulesPurge=false || \
    pnpm install --filter web... --prod --frozen-lockfile --ignore-scripts --config.confirmModulesPurge=false

# ----------------- Runner -----------------
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
# Sipariş JSON'u kalıcı volume içinde kalsın
ENV DATA_DIR=/data

WORKDIR /app

# Astro standalone build output + prod node_modules
COPY --from=builder /repo/apps/web/dist ./dist
COPY --from=builder /repo/apps/web/package.json ./package.json
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/web/node_modules ./apps/web/node_modules

# Veri klasörü (volume mount noktası)
RUN mkdir -p /data && chown -R node:node /data /app

USER node

EXPOSE 4321

# Healthcheck — Astro server hazır mı?
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:4321/ >/dev/null 2>&1 || exit 1

CMD ["node", "./dist/server/entry.mjs"]
