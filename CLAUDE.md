# Carmat Project — Claude Code Entry Point

> **Konya merkezli oto paspas atölyesi** için custom built e-ticaret + atölye yönetim sistemi.
> Bu dosya, projeyi açan Claude Code (veya başka AI agent) için **giriş noktası**dır.

## Hızlı Başlangıç

Projeyi anlamak için sırayla oku:
1. [docs/wiki/00-architecture/01-stack.md](./docs/wiki/00-architecture/01-stack.md) — teknoloji stack'i
2. [docs/wiki/00-architecture/02-data-model.md](./docs/wiki/00-architecture/02-data-model.md) — Order, Stock, Push tipleri
3. [docs/wiki/00-architecture/03-data-flow.md](./docs/wiki/00-architecture/03-data-flow.md) — modüller arası akış
4. [docs/wiki/10-modules/](./docs/wiki/10-modules/) — modül-bazlı detaylar

## Repo yapısı (özet)

```
apps/web/                   # Astro SSR + Preact
  src/
    server/                 # Backend logic — Node-only
      db.ts                 # JSON-file DB (orders.json)
      auth.ts               # HMAC cookie session
      push.ts               # Web Push (VAPID + sub store)
      stock.ts              # Hammadde stok yönetimi
      stock-recipes.ts      # Order → consumption hesabı
      integrations/         # E-ticaret platform adapter'ları (Trendyol vs.)
    pages/
      api/                  # SSR endpoint'leri
      admin/                # Admin paneli (auth gerekir)
    components/
      configurator/         # Müşteri konfigüratör (Preact island)
      tracker/              # Sipariş takip (Preact island)
      admin/                # Admin formları (Preact island)
      layout/               # Header/Footer/MobileBottomNav
    layouts/
      Base.astro            # Müşteri sayfa layout'u
      AdminLayout.astro     # Admin sayfa layout'u
    sw.ts                   # Service Worker (Workbox + Push)
  public/
    logo.png                # Marka logosu
docs/wiki/                  # LLM Wiki — bu dokümantasyon
scripts/
  seed.mjs                  # Örnek sipariş seed
  seed-stock.mjs            # Hammadde başlangıç stok seed
```

## Kritik Invariant'lar

⚠ **Bunlara dokunma**:
- `data/orders.json` ve `data/stock-movements.json` **append-only** mantıklı — eski entry'lere overwrite yapma
- Push subscription store (`data/push-subscriptions.json`) endpoint+audience benzersiz
- HMAC cookie (`paspasoto_admin`) `httpOnly + sameSite=Lax`, secure flag env'e bağlı
- Stock consumption **idempotent** — `hasOrderConsumed(orderNo)` kontrolü atlanmamalı
- E-ticaret webhook'larında `externalRef.id` ile duplicate kontrolü zorunlu
- Service Worker **injectManifest** modunda — workbox-precaching elden tutuluyor

## Sık yapılan görevler

| Görev | Hangi dosya |
|---|---|
| Yeni sipariş status eklemek | `src/server/db.ts` (OrderStatus union) + `pages/api/orders/[orderNo].ts` (push trigger) |
| Yeni push senaryosu | `pages/api/orders/[orderNo].ts` PATCH bloğu — `sendPush('admin' \| 'order:X', ...)` |
| Yeni e-ticaret platformu | `server/integrations/<platform>.ts` adapter + `registry.ts` ekle + `pages/api/integrations/<platform>/webhook.ts` |
| Yeni stok kalemi | `scripts/seed-stock.mjs` veya admin'den manuel ekle (POST /api/stock/adjust) |
| Yeni recipe (tüketim formülü) | `src/server/stock-recipes.ts` `computeConsumption()` |
| Yeni admin sayfası | `src/pages/admin/<page>.astro` + `AdminLayout` `current` prop |

## Deploy

- **Coolify** üzerinde Docker deploy (`apps/web/Dockerfile`)
- Branch push → otomatik deploy
- Veri kalıcılığı: `/data` bind mount (`/var/lib/coolify-data/paspasoto`)
- Build: `pnpm install && pnpm --filter web build` + `node ./dist/server/entry.mjs`

## Env değişkenleri

Coolify'a ayarlanması gereken env'ler:

| Variable | Amaç |
|---|---|
| `ADMIN_PASSWORD` | Admin giriş şifresi |
| `SESSION_SECRET` | HMAC cookie imza |
| `COOKIE_SECURE` | HTTPS varsa `true` |
| `VAPID_PUBLIC_KEY` | Web Push public |
| `VAPID_PRIVATE_KEY` | Web Push private |
| `VAPID_SUBJECT` | `mailto:...` |
| `PUBLIC_SITE_URL` | Canonical site URL |
| `DATA_DIR` | Veri klasörü (default `.data`) |
| `TRENDYOL_SUPPLIER_ID` | (P4 entegrasyon) |
| `TRENDYOL_API_KEY` | (P4) |
| `TRENDYOL_API_SECRET` | (P4) |
| `TRENDYOL_WEBHOOK_SECRET` | (P4) |

## Kontak

- Sahibi: turhanhamza@gmail.com
- Atölye WA: 905545417561
- Coolify: 185.255.95.111:8000
