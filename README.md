# PaspasOto.com

Konya merkezli butik oto paspas üreticisi için **araca özel 3D havuzlu paspas** e-ticaret + sipariş takip platformu.

> Detaylı PRD için bkz. [`docs/PRD.md`](./docs/PRD.md)

## Stack

| Katman | Teknoloji |
|---|---|
| Frontend | Astro 5 + Tailwind 4 + Preact Islands |
| CMS / API | Strapi 5 |
| DB (production) | PostgreSQL 16 |
| DB (lokal dev) | SQLite (zero-config) |
| Storage (production) | MinIO (S3-uyumlu) |
| Storage (lokal dev) | Local filesystem |
| Deploy | Coolify (self-host, 185.255.95.111) |

## Repo yapısı

```
paspasoto/
├─ apps/
│  ├─ web/          # Astro 5 frontend
│  └─ cms/          # Strapi 5 CMS + API
├─ packages/
│  └─ shared/       # Paylaşılan tipler ve Zod şemaları
├─ docs/
│  └─ PRD.md        # Ürün gereksinim dokümanı
├─ scripts/
│  └─ process-images.mjs  # Görsel işleme/swatch üretimi
└─ .github/workflows/     # CI/CD
```

## Hızlı başlangıç (lokal dev)

```bash
# Bağımlılıklar
pnpm install

# Strapi cms (1337) + Astro web (4321) paralel
pnpm dev

# Sadece web
pnpm dev:web

# Sadece cms
pnpm dev:cms

# İlk kurulumdan sonra seed
pnpm seed
```

## Ortam değişkenleri

`.env.example` dosyasını `.env` olarak kopyalayın. Kritik değişkenler:

- `DATABASE_*` — Postgres bağlantısı (production)
- `S3_*` — MinIO bağlantısı (production)
- `SMTP_*` — E-posta (Brevo / Resend)
- `STRAPI_API_TOKEN` — Web app'in Strapi'ye public read token'ı

## Production deploy

Coolify dashboard: http://185.255.95.111:8000  
Bkz. `docs/DEPLOY.md` (Sprint 0 sonrasında yazılır).

## Lisans

Proprietary — PaspasOto.com. Tüm hakları saklıdır.
