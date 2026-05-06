# Multi-stage build: Node build → Nginx static serve
# ----------------- Builder -----------------
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /repo

# Monorepo root manifest (workspace) ve web paketi
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/

# Sadece web bağımlılıkları (tüm workspace'i kurmak yerine)
RUN pnpm install --filter web... --frozen-lockfile

# Source
COPY apps/web ./apps/web

# Build args (PUBLIC_*) build-time'da bake edilir
ARG PUBLIC_SITE_URL=https://paspasoto.com
ARG PUBLIC_STRAPI_URL=https://admin.paspasoto.com
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL
ENV PUBLIC_STRAPI_URL=$PUBLIC_STRAPI_URL
ENV PWA_DISABLED=false
ENV NODE_ENV=production

WORKDIR /repo/apps/web
RUN pnpm build

# ----------------- Runner -----------------
FROM nginx:1.27-alpine AS runner

# Custom nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Static dist
COPY --from=builder /repo/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O - http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
