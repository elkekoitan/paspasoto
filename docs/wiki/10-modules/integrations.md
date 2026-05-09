---
title: E-Ticaret Entegrasyonları
module: integrations
status: trendyol-scaffold
last_reviewed: 2026-05-07
related: [[orders]], [[push]]
---

# E-Ticaret Entegrasyonları

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

## Trendyol kurulum (admin için)
1. partner.trendyol.com → Hesabım → Hesap Bilgileri → Entegrasyon Bilgileri
2. Cari ID, API Key, Secret al → Coolify env'e ekle
3. Webhook Yönetimi → Yeni Webhook:
   - URL: `https://carmat.com.tr/api/integrations/trendyol/webhook`
   - Olaylar: `OrderCreated`, `OrderStatusChanged`, `OrderPackageCreated`
   - İmza: HMAC-SHA256
   - Secret: `TRENDYOL_WEBHOOK_SECRET` env ile aynı
4. Ürün eşleştirmelerini `trendyol-mapping.ts`'e ekle (V1 manuel, V2 admin UI)
5. Test sipariş ver → admin panel "Entegrasyonlar" sayfasında görünmeli

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
