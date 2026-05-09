---
title: Teknoloji Stack'i
module: architecture
status: stable
last_reviewed: 2026-05-07
related: [[02-data-model]], [[03-data-flow]]
---

# Stack

## Frontend
- **Astro 5** — `output: 'server'` + `@astrojs/node` adapter (standalone)
- **Preact** — interactive island'lar (Configurator, OrderTracker, NewOrderForm, OrderEditor)
- **Tailwind CSS 4** + **Inter font** + custom CSS vars (`--color-primary`, `--color-bg` vs.)
- **simple-icons** — gerçek brand color marka logoları (40 marka)

## PWA
- **vite-pwa** + Workbox `injectManifest` modu — `src/sw.ts` özel SW
- VAPID Web Push (server: `web-push`)
- Manifest: `/manifest.webmanifest` (müşteri) + `/admin-manifest.webmanifest` (yönetim)
- Mobil "Ana ekrana ekle" smart banner — auto slide-down

## Backend
- **Astro SSR API routes** (`src/pages/api/**`)
- **JSON-file DB** — `data/orders.json`, `data/stock.json`, `data/stock-movements.json`, `data/push-subscriptions.json`, `data/integration-events.json`
- Atomik write (write-temp + rename) + in-process write queue
- Auth: HMAC-SHA256 imzalı cookie session (`paspasoto_admin`, 30 gün)

## Deploy
- **Coolify** (self-hosted, 185.255.95.111)
- Docker multi-stage build → Node SSR runtime
- Traefik reverse proxy + Let's Encrypt SSL
- `/data` bind mount (`/var/lib/coolify-data/paspasoto`) — kalıcı veri
- Auto-deploy: GitHub `main` push tetikleyici

## Sürüm seçim mantığı
- Astro 5 SSR → tek ürün-yönetim platformu (Strapi yerine), JSON-file DB ile native bağımlılık yok
- Preact yerine React değil → bundle ~3KB, performans büyüklük
- JSON-file DB → tek operatör atölye, eş zamanlı yazma az; PostgreSQL/SQLite gerekmedi
- Coolify → kendi sunucu, mağaza onayı yok, hızlı iterasyon

## Bağımlılık politikası
- Yeni paket eklemekten kaçın
- `web-push`, `simple-icons`, `workbox-precaching` haricinde 3rd party minimal

## For an AI agent
- Bağımlılık eklemek isterseniz [[04-decision-log]]'a ADR ekleyin
- Build doğrulama: `cd apps/web && pnpm build`
- SSR entry: `apps/web/dist/server/entry.mjs`
