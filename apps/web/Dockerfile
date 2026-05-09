# Multi-stage build: Node build → Node SSR runtime
# Astro 5 hybrid (output: server) + @astrojs/node standalone
# ----------------- Builder -----------------
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Coolify build no-TTY → pnpm interaktif onay isteme
ENV CI=true

WORKDIR /repo

# Monorepo manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/

# Tüm dev+prod bağımlılıkları (typescript, astro check, vs. build için lazım)
RUN pnpm install --filter web... --frozen-lockfile

# Source + build
COPY apps/web ./apps/web

ARG PUBLIC_SITE_URL=https://carmat.com.tr
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL
ENV PWA_DISABLED=false
ENV NODE_ENV=production

WORKDIR /repo/apps/web
RUN pnpm build

# pnpm deploy → workspace bağımlılıklarını flat node_modules olarak /prod'a kopyalar
WORKDIR /repo
RUN pnpm --filter web deploy --prod --legacy /prod

# ----------------- Runner -----------------
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
# Sipariş JSON'u kalıcı volume içinde kalsın
ENV DATA_DIR=/data

# wget healthcheck için (alpine'da BusyBox wget zaten var, açıkça install yine de)
# Container as root: Coolify persistent volume root:root mount edildiğinde EACCES yaşamamak için.
# MVP'de güvenlik trade-off kabul edildi — node sandbox + reverse proxy zaten önde.

WORKDIR /app

# pnpm deploy çıktısı: package.json + flat node_modules (preact, sharp, vs.)
COPY --from=builder /prod/package.json ./package.json
COPY --from=builder /prod/node_modules ./node_modules
# Astro standalone build output (server entrypoint + client assets)
COPY --from=builder /repo/apps/web/dist ./dist

# Veri klasörü (volume mount noktası)
RUN mkdir -p /data

# USER node KASTEN kaldırıldı: container root olarak çalışır, /data permission sorunu yok.

EXPOSE 4321

# Healthcheck — Astro server hazır mı? (BusyBox wget alpine default)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1:4321/ || exit 1

CMD ["node", "./dist/server/entry.mjs"]
