---
title: Siparişler Modülü
module: orders
status: stable
last_reviewed: 2026-05-07
related: [[../00-architecture/02-data-model]], [[push]], [[stock]]
---

# Siparişler

## Sorumluluk
Tüm sipariş yaşam döngüsünü (oluşturma, güncelleme, takip) yönetir. İki kind:
- **`order`** — kesin sipariş (admin oluşturur veya quote'tan dönüşür veya webhook'tan gelir)
- **`quote`** — müşteri konfigüratörden ön talep (admin onayı bekler)

## Kritik dosyalar
- `apps/web/src/server/db.ts` — Order, OrderItem, OrderStatus, Channel tipleri + repo fonksiyonları (load/save/insert/update/getBy*)
- `apps/web/src/pages/api/orders/index.ts` — GET listele, POST yeni sipariş (admin)
- `apps/web/src/pages/api/orders/[orderNo].ts` — GET, PATCH (status update + push fan-out + stok consume), DELETE
- `apps/web/src/pages/api/quote.ts` — POST public ön talep
- `apps/web/src/pages/api/track.ts` + `track/[token].ts` — müşteri takip
- `apps/web/src/components/admin/NewOrderForm.tsx` — manuel sipariş açma
- `apps/web/src/components/admin/OrderEditor.tsx` — sipariş düzenleme
- `apps/web/src/components/tracker/OrderTracker.tsx` — müşteri takip UI
- `apps/web/src/pages/admin/orders/*.astro` — admin sayfaları
- `apps/web/src/pages/admin/talepler.astro` — quote yönetimi

## Status state machine
```
received  ─→  in_production  ─→  ready  ─→  delivered
   ↓              ↓                ↓
   └──────── cancelled ────────────┘
```

## PATCH side effects (orders/[orderNo].ts)
PATCH her başarılı uygulamada şunları tetikler:
1. `kind: quote → order` → push: "Teklifiniz Onaylandı" (müşteriye)
2. `productionStatus` değişir → push: aşamaya özel başlık (müşteriye)
3. `paymentStatus = 'tamamlandi'` → push: "Ödeme Onaylandı" (müşteriye)
4. `cargoTrackingNo` eklenir → push: "Kargo Yola Çıktı" (müşteriye)
5. `productionStatus → in_production` (yeni geçiş) → **stok consume** + critical altı SKU varsa "Kritik Stok" push (admin'e)

İdempotency: `hasOrderConsumed(orderNo)` ile aynı sipariş 2. kez consume edilmez.

## Yeni manuel sipariş akışı
1. `/admin/orders/new` — Müşteri + Konfig + Atölye Fiyatlama + Ödeme & Notlar
2. POST `/api/orders` → DB insert
3. Sipariş detay sayfasına yönlendirme
4. Admin `productionStatus`'u ilerletir → push fan-out

## Quote → Order dönüşümü
1. Müşteri konfigüratörden talep gönderir → `kind: 'quote'`, status: 'received'
2. Admin `/admin/talepler` → "Teklif Gönder" (WhatsApp deeplink — hazır mesaj şablonu)
3. Müşteri WhatsApp ile onaylar
4. Admin `/admin/talepler` → "✓ Siparişe Çevir" → PATCH `kind: 'order', productionStatus: 'in_production'`
5. Stok consume + push fan-out

## For an AI agent
- **Asla** `Order.events[]` array'inden silme — sadece append
- Yeni status eklerken: union'a ekle + `customerStageOf()` map'le + `STATUS_LABEL` ekle (orders/[orderNo].ts)
- PATCH side effect eklemek istiyorsan bu dosyada "1)..5)" sırasına 6) ekle
- Quote yetkisi: public — `kind: 'quote'` zorunlu, manipülasyona dikkat
