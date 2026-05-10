---
title: WhatsApp / Evolution API
module: whatsapp
status: evolution-deployed
last_reviewed: 2026-05-10
related: [[orders]], [[../40-runbooks/evolution-api-setup]]
---

# WhatsApp Otomasyonu

Carmat'ta sipariş `productionStatus` geçişlerinde müşteriye otomatik WhatsApp mesajı atılır. **Evolution API** (open-source MIT, self-host Coolify) kullanılır.

## Sorumluluk

3 trigger noktasında otomatik mesaj:
| productionStatus geçişi | Mesaj şablonu |
|---|---|
| `received → in_production` | "Üretime alındı + takip linki" |
| `in_production → ready` | "Hazır + kargo no varsa" |
| `ready → delivered` | "Teslim edildi + memnuniyet ricası" |

## Kritik dosyalar

- `apps/web/src/server/whatsapp-client.ts` — Evolution REST API client
  - `sendWhatsAppText(phone, message)` — fire-and-forget
  - `sendWhatsAppTextAsync(...)` — background trigger
  - 3 şablon: `buildProductionStartedMessage`, `buildReadyMessage`, `buildDeliveredMessage`
  - `toEvolutionPhone(...)` — TR tel format normalize (90XXXXXXXXXX)
- `apps/web/src/lib/whatsapp.ts` — Admin manuel için wa.me deeplink helper
  - `buildProductionStartedWaUrl(order)` — atölye telefonunda WhatsApp açar
- `apps/web/src/pages/api/orders/[orderNo].ts` — PATCH trigger
  - productionStatus değiştiğinde `sendWhatsAppTextAsync` çağrılır
- `apps/web/src/components/admin/OrderEditor.tsx` — yeşil "WhatsApp Bildir" butonu

## Env değişkenleri (Coolify)

```
EVOLUTION_API_URL=https://wa.carmat.com.tr
EVOLUTION_API_KEY=<global apikey>
EVOLUTION_INSTANCE_NAME=carmat
WHATSAPP_AUTO_SEND=true|false
```

`WHATSAPP_AUTO_SEND=false` → sadece `console.log`, gerçek mesaj gitmez (debug).
`EVOLUTION_API_URL/KEY` tanımsız → `skipped: true` döner, akış bozulmaz.

## Coolify deployment

- **Service UUID**: `rtivtocvfog3cfc3p9no5un3`
- **Stack**: Evolution API + Postgres + Redis (Docker compose)
- Detaylı kurulum: [[../40-runbooks/evolution-api-setup]]

## Akış

```
Admin /admin/orders/{orderNo} → "Üretime Al" tıkla
   ↓
PATCH /api/orders/{orderNo} { productionStatus: 'in_production' }
   ↓
sendWhatsAppTextAsync(phone, buildProductionStartedMessage(order))
   ↓
POST {EVOLUTION_API_URL}/message/sendText/{instance}
   ↓
Evolution API container (Coolify)
   ↓
Atölye WhatsApp Business (instance bağlı)
   ↓
Müşteri WhatsApp inbox 📲
```

## Fail-soft tasarım

- Env tanımsız → log only, akış devam
- HTTP 4xx/5xx → console.error, akış devam
- Phone format hatalı → `{ ok: false, error: 'Geçersiz telefon' }`, sipariş yine güncellenir

## Manuel mod (atölye telefonundan tek tıkla)

Admin order detail'de yeşil "WhatsApp ile Müşteriye Bildir" butonu:
- `wa.me/<phone>?text=<encoded>` linki
- Atölye WhatsApp Business açılır, mesaj prefilled
- Admin "Send" basar → müşteriye gerçek WhatsApp mesajı gider
- Evolution API kurulmadan da çalışır (yarı-otomatik fallback)

## For an AI agent

- Tam otomatik gönderim Evolution API service Coolify'da çalışıyor olmalı + `WHATSAPP_AUTO_SEND=true`
- Yeni şablon eklenirken: `whatsapp-client.ts`'e `buildXxxMessage(args)` ekle, sonra `[orderNo].ts` PATCH'e tetikleyici
- Test: `curl -X POST {EVOLUTION_API_URL}/message/sendText/carmat -H "apikey: $KEY" -d '{"number":"905551234567","textMessage":{"text":"test"}}'`
- Meta WhatsApp Cloud API alternatif (V2): `apps/web/src/server/whatsapp-meta.ts` (gelecek)
