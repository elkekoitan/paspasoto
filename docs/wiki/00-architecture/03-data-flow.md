---
title: Veri Akışı
module: architecture
status: stable
last_reviewed: 2026-05-07
related: [[02-data-model]], [[10-modules/orders]]
---

# Veri Akışı

## 1) Müşteri talep akışı (Konfigüratörden ön sipariş)

```mermaid
sequenceDiagram
  participant C as Müşteri (web/mobile)
  participant CFG as Configurator (Preact)
  participant API as POST /api/quote
  participant DB as data/orders.json
  participant PUSH as Web Push
  participant ADMIN as Admin (PWA)

  C->>CFG: 7 adımlı seçim
  CFG->>CFG: localStorage'a draft kaydet
  C->>CFG: "Teklif İste" + ad/telefon/adres
  CFG->>API: POST { customer, shippingAddress, items, totals }
  API->>DB: kind='quote', status='received'
  API->>PUSH: sendPush('admin', 'Yeni Teklif Talebi')
  PUSH->>ADMIN: OS notification (kapalıyken bile)
  API-->>CFG: { orderNo, accessToken }
  CFG->>CFG: localStorage temizle, success ekranı
```

## 2) Admin teklif → kesin sipariş dönüşümü

```mermaid
sequenceDiagram
  participant ADMIN as Admin
  participant TLP as /admin/talepler
  participant API as PATCH /api/orders/[orderNo]
  participant DB as orders.json
  participant STK as stock.ts (consume)
  participant PUSH as Web Push
  participant CUST as Müşteri

  ADMIN->>TLP: WhatsApp ile fiyat ver
  ADMIN->>TLP: "Siparişe Çevir"
  TLP->>API: kind='order', productionStatus='in_production'
  API->>DB: update
  API->>STK: computeConsumption(order)
  STK->>STK: hammadde düş, movement append
  STK-->>API: criticalSkus[]
  alt critical varsa
    API->>PUSH: sendPush('admin', 'Kritik Stok')
  end
  API->>PUSH: sendPush('order:'+orderNo, 'Teklifiniz Onaylandı')
  PUSH->>CUST: OS notification
```

## 3) Trendyol webhook akışı

```mermaid
sequenceDiagram
  participant TY as Trendyol
  participant WH as POST /api/integrations/trendyol/webhook
  participant ADP as trendyol.ts adapter
  participant MAP as trendyol-mapping.ts
  participant DB as orders.json
  participant LOG as integration-events.json
  participant PUSH as Web Push
  participant ADMIN as Admin

  TY->>WH: POST + X-Trendyol-Signature
  WH->>ADP: verify(req, body, secret)
  alt İmza geçersiz
    WH->>LOG: status=invalid_signature
    WH-->>TY: 401
  end
  WH->>ADP: parse(payload)
  ADP->>MAP: getMappingByExternalCode('trendyol', code)
  MAP-->>ADP: mapping || null
  ADP-->>WH: NormalizedOrder
  WH->>DB: getByExternalRef('trendyol', externalId)
  alt Duplicate
    WH->>LOG: status=duplicate
    WH-->>TY: 200 OK (skip)
  end
  WH->>DB: insertOrder({channel:'trendyol', externalRef, ...})
  WH->>LOG: status=success | unmapped
  WH->>PUSH: sendPush('admin', 'Yeni Trendyol Siparişi')
  PUSH->>ADMIN: notification
  WH-->>TY: 200 OK
```

## 4) Sipariş status değişimi → push fan-out

```mermaid
flowchart TB
  PATCH[PATCH /api/orders/orderNo] --> STATUS{productionStatus<br/>değişti mi?}
  STATUS -->|received → in_production| PUSH1[sendPush 'order:X' Üretimde]
  STATUS -->|in_production → ready| PUSH2[sendPush 'order:X' Hazır]
  STATUS -->|ready → delivered| PUSH3[sendPush 'order:X' Teslim Edildi]
  STATUS -->|in_production'a yeni geçti| CONS[consumeStockForOrder]
  CONS --> CRIT{Kritik altı<br/>SKU var mı?}
  CRIT -->|evet| PUSH4[sendPush 'admin' Kritik Stok]
  PATCH --> PAY{paymentStatus<br/>tamamlandi mı?}
  PAY -->|evet| PUSH5[sendPush 'order:X' Ödeme Onaylandı]
  PATCH --> CARGO{cargoTrackingNo<br/>eklendi mi?}
  CARGO -->|evet| PUSH6[sendPush 'order:X' Kargo Yola Çıktı]
```

## For an AI agent
- Push fan-out tetikleyicileri tek dosyada: `apps/web/src/pages/api/orders/[orderNo].ts`
- Stok consume hook'u aynı dosyada — çift yere yazma
- Webhook adapter'ları registry pattern: yeni platform = `registry.ts` + `<platform>.ts` + webhook endpoint
