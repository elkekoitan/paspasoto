---
title: Deploy Runbook
status: stable
last_reviewed: 2026-05-07
related: [[../00-architecture/01-stack]]
---

# Deploy

## Otomatik
GitHub `main` push → Coolify webhook → otomatik build + redeploy.

## Manuel deploy
```bash
TOKEN="<COOLIFY_API_TOKEN>"
APP="kw1f0tskisx5pl6i5jw2tzgw"
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  "http://185.255.95.111:8000/api/v1/deploy?uuid=$APP&force=true"
```

## Build dosyası
`apps/web/Dockerfile` (multi-stage):
1. Builder stage: `node:20-alpine`, pnpm install + build
2. Runner: SSR entry `node ./dist/server/entry.mjs`
3. Healthcheck: GET `/` 200

## Env değişkenleri (Coolify panel)
Coolify dashboard → paspasoto-web → Environment Variables:

| Key | Value |
|---|---|
| ADMIN_PASSWORD | (admin login şifresi) |
| SESSION_SECRET | (rastgele 64 char) |
| COOKIE_SECURE | `true` (HTTPS varsa) |
| VAPID_PUBLIC_KEY | (üret: `web-push generate`) |
| VAPID_PRIVATE_KEY | (aynı çift) |
| VAPID_SUBJECT | `mailto:atolye@carmat.com.tr` |
| PUBLIC_SITE_URL | `https://carmat.com.tr` |
| DATA_DIR | `/data` (default) |
| TRENDYOL_SUPPLIER_ID | (P4) |
| TRENDYOL_API_KEY | (P4) |
| TRENDYOL_API_SECRET | (P4) |
| TRENDYOL_WEBHOOK_SECRET | (P4) |

## Volume
Coolify persistent storage (bind mount):
- Mount path: `/data`
- Host path: `/var/lib/coolify-data/paspasoto`

İçerikler:
- `orders.json`
- `stock.json`
- `stock-movements.json`
- `push-subscriptions.json`
- `integration-events.json`

## İlk deploy (sıfırdan)
1. Coolify'da yeni Application → GitHub repo `elkekoitan/paspasoto`
2. Build pack: Dockerfile (`apps/web/Dockerfile`)
3. Domain: `carmat.com.tr` veya sslip subdomain
4. Env'leri ekle (yukarıdaki tablo)
5. Persistent storage `/data` ekle
6. Deploy
7. SSH veya Terminal'den seed (opsiyonel):
   ```bash
   docker exec <container> node /app/scripts/seed.mjs
   docker exec <container> node /app/scripts/seed-stock.mjs
   ```

## Sorun giderme
| Belirti | Çözüm |
|---|---|
| Bad Gateway | Container ayakta değil — Coolify deployment log'a bak |
| 401 Unauthorized | SESSION_SECRET değişmiş, kullanıcı re-login |
| Cookie tarayıcıya gelmiyor | HTTPS yok ama COOKIE_SECURE=true → false yap |
| Push gelmiyor | VAPID env eksik veya `Notification.permission` denied |
| Stok düşmüyor | `productionStatus` zaten `in_production`'daydı (idempotency) — manuel düzelt |
| Webhook 401 | İmza secret env'i panelde tanımlı + Trendyol panelde ekli ile aynı mı? |

## Rollback
Coolify dashboard → paspasoto-web → Deployments → eski commit → "Redeploy"

## Yedekleme
```bash
ssh root@185.255.95.111
cd /var/lib/coolify-data/paspasoto
tar -czf /tmp/carmat-backup-$(date +%Y%m%d).tar.gz *.json
```
Backup'ı dış lokasyona kopyala (S3, başka sunucu, vs.).
