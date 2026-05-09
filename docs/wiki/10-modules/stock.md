---
title: Hammadde / Stok Modülü
module: stock
status: stable
last_reviewed: 2026-05-07
related: [[orders]], [[push]]
---

# Hammadde / Stok

## Sorumluluk
8 kategori hammaddenin (paspas tabanı, biye, topukluk, amblem, koltuk kumaşı, direksiyon, paketleme, iplik) anlık miktarını ve hareket geçmişini tutar. Sipariş `in_production`'a geçince otomatik düşer; kritik altına inerse admin'e push.

## Kritik dosyalar
- `apps/web/src/server/stock.ts` — repo (listStock, getStockBySku, applyMovement, hasOrderConsumed, getCriticalItems)
- `apps/web/src/server/stock-recipes.ts` — `computeConsumption(order)` formülleri
- `apps/web/src/pages/api/stock/index.ts` — GET liste
- `apps/web/src/pages/api/stock/adjust.ts` — POST manuel düzeltme (delta veya setQty)
- `apps/web/src/pages/api/stock/movements.ts` — GET hareket geçmişi
- `apps/web/src/pages/admin/stok/index.astro` — admin liste UI
- `apps/web/src/pages/admin/stok/[sku].astro` — SKU detay + manuel düzeltme + hareketler
- `scripts/seed-stock.mjs` — ilk seed (~100 SKU)

## SKU naming convention
```
MAT_BASE_<COLOR>          → MAT_BASE_SIYAH, MAT_BASE_GRI...
BORDER_<COLOR>            → BORDER_KIRMIZI, BORDER_LACIVERT...
HEEL_PAD_<TYPE>           → HEEL_PAD_STANDART, HEEL_PAD_ANTRASIT-KARBON...
LOGO_PLATE_<BRAND>        → LOGO_PLATE_BMW, LOGO_PLATE_AUDI...
SEAT_FABRIC_<MAT>_<COLOR> → SEAT_FABRIC_LEATHER_BLACK
STEERING_<SIZE>_<PATTERN> → STEERING_M_CARBON
THREAD_GENERIC
PACKAGING_BOX | PACKAGING_NYLON | PACKAGING_FOAM | PACKAGING_LABEL
```

## Recipe (computeConsumption)
Bir paspas için:
- 0.55m taban (mat color SKU)
- 0.08kg biye (border color SKU)
- 0.005kg iplik (THREAD_GENERIC)

Bir set için: 2 (2'li), 4 (4'lü), 5 (4'lü+bagaj) paspas çarpı yukarısı.

Topukluk (heelPosition):
- `driver-only` → 1 ped
- `passenger-only` → 1 ped
- `both` → 2 ped
- `none` → 0 ped

Logo plakaları (logos[]):
- Her `brandSlug !== null` olan logoConfig için 1 plaka

Paketleme (her sipariş için):
- 1 kutu + 1 naylon + 1 etiket

## Akış: in_production → tüketim
```
PATCH order productionStatus='in_production'
  ↓
hasOrderConsumed(orderNo) ?
  ├─ true  → skip (idempotency)
  └─ false → computeConsumption(order)
              ↓
              for each entry: applyMovement({sku, delta, reason:'order_consume', orderNo})
              ↓
              for each: getStockBySku().qty <= criticalThreshold ?
                ├─ true → sendPush('admin', 'Kritik Stok ⚠')
                └─ false → continue
```

## Storage
- `data/stock.json` — current state (mutable)
- `data/stock-movements.json` — append-only, rolling 5000

## İlk seed
Production'da (`/data/stock.json` boşsa):
```bash
node scripts/seed-stock.mjs
```
veya admin panelden manuel SKU eklenebilir. Seed dosyası ~100 SKU yazıyor.

## For an AI agent
- **Asla** `stock-movements.json`'ı overwrite etme — sadece append (`applyMovement`)
- `setQty` ile sayım modu çalışır (delta otomatik hesaplanır)
- Recipe değişikliği: `stock-recipes.ts` PER_MAT sabitleri — değişiklik backward compat değildir, dikkat
- Kritik push throttling şu an yok — aynı SKU 2 kez critical'a düşerse 2 push gelir (V2'de düzelt)
