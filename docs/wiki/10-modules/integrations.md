---
title: E-Ticaret Entegrasyonları + WhatsApp
module: integrations
status: trendyol-live + whatsapp-via-evolution-api
last_reviewed: 2026-05-10
related: [[orders]], [[push]], [[../40-runbooks/evolution-api-setup]]
---

> **2026-05-10 güncellemeleri**:
> - **Trendyol API path migration** (commit 46b99d1): `/sapigw/suppliers/{id}/...` → `/integration/.../sellers/{id}/...` (Trendyol 2024'te eski endpoint'i kapattı)
> - **subscribedStatuses UPPERCASE** (commit 6005ecf): CREATED/PICKING/INVOICED/SHIPPED/CANCELLED/DELIVERED/RETURNED (eski PascalCase reddediliyor)
> - **Evolution API WhatsApp** (commit 5b5af11): self-host Coolify gateway + auto-send. Kurulum: [[../40-runbooks/evolution-api-setup]]
> - Trendyol bağlantı testi: ✅ canlıda `{"ok":true}`. Webhook kayıt için `carmat.com.tr` domain'inin canlı olması bekleniyor (sslip.io URL Trendyol "valid" görmüyor).

# E-Ticaret Entegrasyonları + WhatsApp Otomasyon

## WhatsApp (Evolution API)

`apps/web/src/server/whatsapp-client.ts` — Evolution API REST client.

| productionStatus geçişi | Otomatik mesaj |
|---|---|
| `received → in_production` | "Üretime alındı" + takip linki |
| `in_production → ready` | "Hazır" + kargo no varsa |
| `ready → delivered` | "Teslim edildi" + memnuniyet ricası |

Env: `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME`, `WHATSAPP_AUTO_SEND`.

`AUTO_SEND=false` ise sadece `console.log` (debug). Env tanımsızsa "skipped" döner — akış bozulmaz.



## Sorumluluk
Trendyol, Hepsiburada, WooCommerce gibi platformlardan gelen siparişleri webhook ile otomatik DB'ye yazıp üretime düşürür. Adapter pattern.

## Kritik dosyalar
- `apps/web/src/server/integrations/types.ts` — `PlatformAdapter` interface, `NormalizedOrder`, `IntegrationEvent`
- `apps/web/src/server/integrations/registry.ts` — platform → adapter map
- `apps/web/src/server/integrations/trendyol.ts` — Trendyol HMAC verify + payload parse
- `apps/web/src/server/integrations/trendyol-mapping.ts` — Trendyol product code → Carmat OrderItem map
- `apps/web/src/server/integrations/events-log.ts` — webhook olay log'u (`data/integration-events.json` rolling 500)
- `apps/web/src/pages/api/integrations/trendyol/webhook.ts` — endpoint
- `apps/web/src/pages/admin/entegrasyonlar/index.astro` — admin UI

## Adapter interface
```ts
interface PlatformAdapter {
  platform: Channel
  verify(req: Request, body: string, secret: string): Promise<boolean>
  parse(payload: unknown): Promise<NormalizedOrder>
}
```

## Webhook akışı
```
POST /api/integrations/trendyol/webhook
  ↓
adapter.verify(req, body, env.TRENDYOL_WEBHOOK_SECRET)
  ├─ false → logEvent('invalid_signature') + 401
  └─ true → continue
  ↓
JSON.parse(body)
  ├─ fail → logEvent('parse_error') + 400
  └─ ok → continue
  ↓
adapter.parse(payload) → NormalizedOrder
  ↓
getByExternalRef('trendyol', externalId)
  ├─ exists → logEvent('duplicate') + 200
  └─ null → continue
  ↓
insertOrder({channel:'trendyol', externalRef, ...})
  ↓
items.some(i => i.brandSlug === 'unmapped') ?
  ├─ true → logEvent('unmapped') + sendPush('admin','⚠ Eşleşmemiş Ürün')
  └─ false → logEvent('success') + sendPush('admin','🛒 Yeni Sipariş')
  ↓
200 OK
```

## Trendyol kurulum (production)

### 1) Trendyol panelden bilgileri al
- partner.trendyol.com → Hesabım → Hesap Bilgileri → **Entegrasyon Bilgileri**
- 4 değer: Cari ID, Entegrasyon Referans Kodu, API Key, API Secret
- ⚠️ Ekran görüntüsü/chat ile paylaşma — credential rotate etmek zorunda kalırsın

### 2) Coolify env'e gir (UI veya API ile)

**Yöntem A: Coolify Web UI**
- Application → Environment Variables sekmesi → "Add"

**Yöntem B: Hazır script ile (önerilen)**
```powershell
# PowerShell — sadece bu oturum, hiçbiri diske yazılmaz
$env:COOLIFY_API_URL  = "http://185.255.95.111:8000"
$env:COOLIFY_TOKEN    = "<panelden_aldigin_api_token>"
$env:COOLIFY_APP_UUID = "kw1f0tskisx5pl6i5jw2tzgw"
$env:TY_SUPPLIER_ID     = "669085"
$env:TY_API_KEY         = "<rotate_edilmis_yeni_key>"
$env:TY_API_SECRET      = "<rotate_edilmis_yeni_secret>"
$env:TY_INTEGRATION_REF = "645c0a65-62f6-4865-bafe-f98455f0b0c9"
$env:TY_WEBHOOK_SECRET  = [System.Web.Security.Membership]::GeneratePassword(32, 0)  # rastgele üret
pwsh scripts/coolify-set-env.ps1
```

Eklenecek env değişkenleri:
| Key | Açıklama |
|---|---|
| `TRENDYOL_SUPPLIER_ID` | Cari ID (sayısal) |
| `TRENDYOL_API_KEY` | Trendyol API Key |
| `TRENDYOL_API_SECRET` | Trendyol API Secret |
| `TRENDYOL_INTEGRATION_REF` | Entegrasyon referans UUID'si |
| `TRENDYOL_WEBHOOK_SECRET` | Sen üreteceksin (rastgele 32 char) — Trendyol panele de gireceksin |
| `TRENDYOL_BASE_URL` | `https://apigw.trendyol.com` (default) |

### 3) Coolify Application Redeploy

Env'ler runtime, build-arg değil → restart yeterli:
- Application → "Redeploy" butonu (build atlanır)

### 4) Webhook'u Trendyol panele kayıt et

**İki seçenek:**

**A) Otomatik (Carmat admin panelinden)**:
- `/admin/entegrasyonlar` aç
- "🔌 Bağlantı Testi" → yeşil mi? credentials doğru mu?
- "🔔 Webhook Kaydet" → Carmat sunucusu Trendyol API'sine `https://carmat.com.tr/api/integrations/trendyol/webhook`'unu kaydeder
- Webhook secret env'deki `TRENDYOL_WEBHOOK_SECRET` ile aynı olur

**B) Manuel (Trendyol panel)**:
- partner.trendyol.com → **Webhook Yönetimi** → Yeni Webhook
- URL: `https://carmat.com.tr/api/integrations/trendyol/webhook`
- İmza Tipi: **BASIC_AUTHENTICATION** veya **HMAC-SHA256**
- Username: `carmat`, Password: `<TRENDYOL_WEBHOOK_SECRET ile aynı değer>`
- Olaylar (subscribedStatuses): `Created`, `Picking`, `Invoiced`, `Shipped`, `Cancelled`, `Delivered`, `Returned`

### 5) Ürün eşleştirmelerini ekle
`trendyol-mapping.ts`'e Trendyol'da yayınlanan her ürünün barkod/SKU'sunu Carmat ürün konfigürasyonuna eşle (V1 manuel, V2 admin UI). Eşleşmeyen siparişler "unmapped" olarak gelir, admin'e push gönderilir.

### 6) Test
- Trendyol'dan kendi mağazandan test sipariş ver (örn. 1₺ ürün)
- 30 sn içinde:
  - `/admin/entegrasyonlar` → "Son Webhook'lar" tablosunda görünür
  - Admin'e push bildirim
  - Sipariş `/admin/orders` listesinde channel="trendyol" badge'i ile görünür
- Webhook gelmezse "⬇ Son 24s Çek" butonu manuel polling yapar

### 7) Webhook fallback (cron)
Webhook rate-limit/down durumlarında her saat polling için:
```
curl -X POST -H "X-Admin-Token: <session-cookie>" \
  https://carmat.com.tr/api/integrations/trendyol/sync \
  -d '{"sinceHours": 1}'
```
İdeal olarak Coolify'da scheduled task / cron olarak ekle.

## Yeni platform ekleme rehberi
1. `src/server/integrations/<platform>.ts` — adapter implement et (verify + parse)
2. `src/server/integrations/<platform>-mapping.ts` — ürün eşleştirme (opsiyonel)
3. `src/server/integrations/registry.ts` — entry ekle
4. `src/pages/api/integrations/<platform>/webhook.ts` — endpoint (Trendyol'u kopyala)
5. `Channel` union'a yeni değer ekle (`db.ts`)
6. Env: `<PLATFORM>_WEBHOOK_SECRET` + Coolify'a ekle
7. Admin entegrasyonlar sayfasına platform kartı ekle (`pages/admin/entegrasyonlar/index.astro` `PLATFORMS` array)

## For an AI agent
- Idempotency kritik — `getByExternalRef()` kontrolünü atlama
- HMAC verify timing-safe olmalı (`timingSafeEqual`)
- Body'yi `text()` ile oku, sonra `JSON.parse()` — verify'a raw body lazım
- `logEvent()` her durumda çağrılmalı (success/error fark etmez) — admin debug eder
- `unmapped` durumunda da Order yaratılır (admin manuel düzeltir, kayıp olmasın)
