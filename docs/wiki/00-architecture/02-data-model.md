---
title: Veri Modeli
module: architecture
status: stable
last_reviewed: 2026-05-10
related: [[01-stack]], [[10-modules/orders]], [[10-modules/stock]], [[10-modules/configurator]]
---

> **2026-05-10 güncellemesi (commit ecc1bed):** `VehicleTrim` tipi eklendi.
> Order.items[].trim* alanları opsiyonel olarak (trimId, trimName, trimEngine,
> trimFuel, trimTransmission, trimPackage). Sahibinden seviyesi
> Marka×Model×Yıl×Versiyon hiyerarşisi için. Detay: [[10-modules/configurator]]
>

# Veri Modeli

Tek kaynak: [`apps/web/src/server/db.ts`](../../../apps/web/src/server/db.ts) ve [`apps/web/src/server/stock.ts`](../../../apps/web/src/server/stock.ts).

## Order (sipariş)

```
Order
├── orderNo           "PO-YYMMDD-XXXX"
├── accessToken       UUID, müşteri takip linki için
├── kind?             'order' | 'quote' (default: 'order')
├── channel?          'manual' | 'configurator' | 'physical_store' | 'trendyol' | ...
├── externalRef?      { platform, id, rawPayload? } — Trendyol vs.
├── customer          { fullName, phone, email? }
├── shippingAddress   { fullName, phone, city, district, addressLine }
├── items             OrderItem[]
├── subtotal/shipping/discount?/total
├── paidAmount, paymentMethod, paymentStatus
├── paymentInstallments? — taksit planı
├── productionStatus  4 ana durum: received | in_production | ready | delivered (+ cancelled)
├── deliveryMethod?   'cargo' | 'pickup'
├── customerNote, internalNote
├── cargoCompany, cargoTrackingNo, shippedAt, deliveredAt
├── createdAt, paidAt
└── events            { status, at, note, by }[] — audit trail
```

### OrderStatus (sadeleştirilmiş)
- `received` — Sipariş alındı
- `in_production` — Üretimde (tek başlık; eski: payment_confirmed/cutting/sewing/quality_check)
- `ready` — Hazır (kargoda VEYA dükkanda teslim almaya hazır)
- `delivered` — Teslim edildi
- `cancelled` — İptal

Eski granular status'ler (`payment_confirmed`, `production_cutting` vb.) **legacy desteği** için Order union'da kalır; `customerStageOf()` ile 4 grup'a map'lenir.

## OrderItem

```
OrderItem
├── category?          'mat' | 'seat-cover' | 'steering-cover' (default 'mat')
├── brandSlug/Name, modelSlug/Name, modelChassis
├── productSlug/Name, productParts
├── matSlug/Name/SwatchUrl
├── borderSlug/Name/SwatchUrl
├── heelSlug/Name/SwatchUrl
├── heelPosition?      'driver-only' | 'passenger-only' | 'both' | 'none'
├── heelPadPassenger   (legacy, backward compat)
├── logos?             MatLogoConfig[] — per-mat amblem (yeni şema)
├── logoBrandSlug      (legacy, backward compat: ilk dolu logo)
├── logoQty            (aktif logo sayısı)
├── seatMaterialSlug?, seatColorSlug?, seatFitmentBrand?  (category='seat-cover')
├── steeringSize?, steeringPatternSlug?, steeringMaterialSlug?  (category='steering-cover')
├── qty, unitPrice
```

### MatLogoConfig (per-mat logo)
```
{ position: MatPosition, brandSlug: string | null, placement: LogoPlacement }
```

- `MatPosition`: 'driver' | 'passenger' | 'leftRear' | 'rightRear' | 'trunk'
- `LogoPlacement`: 'top' | 'middle' | 'bottom'

## Stock (hammadde)

```
StockItem
├── sku                "MAT_BASE_BLACK", "LOGO_BMW", "BORDER_RED" — kuralı
├── kind               StockKind (8 tip)
├── label              "Siyah paspas tabanı"
├── unit               'meter' | 'kg' | 'piece'
├── qty                current
├── criticalThreshold
├── reorderQty?
├── supplierNote?
└── lastUpdated
```

### StockKind (8 tip)
`mat_base` · `border_trim` · `heel_pad` · `logo_plate` · `seat_fabric` · `steering_grip` · `packaging` · `thread`

## StockMovement (hareket log'u)
Append-only, rolling 5000.

```
{ id, sku, delta, reason, orderNo?, actor, note?, at }
```

`reason`: `order_consume` | `manual_in` | `manual_out` | `fire` | `count_fix`

## Push Subscription

```
StoredSubscription
├── endpoint, keys.p256dh, keys.auth   (W3C Push API)
├── audience    'admin' | 'order:<orderNo>'
├── createdAt, ua?
```

`audience='admin'` → atölye yönetim cihazları
`audience='order:PO-...'` → o siparişin sahibi müşteri

## IntegrationEvent (webhook log)

```
{ id, platform, receivedAt, status, externalId?, orderNo?, payloadDigest?, message?, raw? }
```

`status`: `success` | `invalid_signature` | `parse_error` | `duplicate` | `unmapped` | `error`

## Storage

| Dosya | İçerik | Lifecycle |
|---|---|---|
| `data/orders.json` | Order[] | Append-only mantık |
| `data/stock.json` | StockItem[] | Mutable (qty güncellenir) |
| `data/stock-movements.json` | StockMovement[] | Append-only, rolling 5000 |
| `data/push-subscriptions.json` | StoredSubscription[] | Mutable (sub eklenir/silinir) |
| `data/integration-events.json` | IntegrationEvent[] | Append-only, rolling 500 |

## For an AI agent
- Tip değişikliği yaparken **backward compat** zorunlu — eski alan kalır + yeni alan optional eklenir
- `Order.events[]` audit trail; silme/değiştirme yok, sadece append
- `Order.kind === 'quote'` → ön talep (admin onayı bekler), `kind === 'order'` → kesin sipariş
- Stock idempotency: aynı `orderNo + reason='order_consume'` ikinci kez işlenmez (`hasOrderConsumed()`)
