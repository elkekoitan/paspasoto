---
title: Web Push Bildirim
module: push
status: stable
last_reviewed: 2026-05-07
related: [[orders]], [[../00-architecture/03-data-flow]]
---

# Web Push Bildirim

## Sorumluluk
VAPID tabanlı Web Push API ile hem admin hem müşteriye OS-seviyesi bildirim gönderir. Tarayıcı kapalıyken bile çalışır (PWA olarak yüklendiğinde arka planda).

## Kritik dosyalar
- `apps/web/src/server/push.ts` — sendPush(), addSubscription(), VAPID setup
- `apps/web/src/sw.ts` — SW push event handler + notificationclick
- `apps/web/src/pages/api/push/subscribe.ts` — POST yetki bağlamlı kayıt
- `apps/web/src/pages/api/push/unsubscribe.ts` — POST silme
- `apps/web/src/pages/api/push/vapid.ts` — GET public anahtar
- `apps/web/src/layouts/AdminLayout.astro` — admin auto-subscribe scripti
- `apps/web/src/components/tracker/OrderTracker.tsx` — müşteri opt-in butonu

## Audience
- `'admin'` — atölye yönetim cihazları (admin login + permission grant)
- `'order:<orderNo>'` — o siparişin sahibi müşteri (takip sayfasında "Bildirim Al" → permission grant)

## Senaryolar (5 tetikleyici)
| # | Olay | Hedef audience | Title |
|---|---|---|---|
| 1 | Yeni quote (konfigüratörden) | admin | 🔔 Yeni Teklif Talebi |
| 2 | Yeni Trendyol siparişi | admin | 🛒 Yeni Trendyol Siparişi |
| 3 | quote → order dönüşümü | order:X | ✓ Teklifiniz Onaylandı |
| 4 | productionStatus değişimi | order:X | 🔧 Üretimde / ✓ Hazır / 🎉 Teslim Edildi |
| 5 | paymentStatus = tamamlandi | order:X | 💰 Ödeme Onaylandı |
| 6 | cargoTrackingNo eklendi | order:X | 📦 Kargo Yola Çıktı |
| 7 | Stok kritik (in_production consume sonrası) | admin | ⚠ Kritik Stok |

## Subscription lifecycle
1. Tarayıcı `pushManager.subscribe({ applicationServerKey: VAPID_PUBLIC })` ile native sub al
2. POST `/api/push/subscribe { subscription, audience, token? }` → `data/push-subscriptions.json`
3. Server `sendPush(audience, payload)` ile o audience'taki tüm sub'lara HTTP push gönderir
4. Sub geçersiz (404/410) → otomatik silinir
5. SW `pushsubscriptionchange` event'inde otomatik re-subscribe

## VAPID env
```
VAPID_PUBLIC_KEY   = ...
VAPID_PRIVATE_KEY  = ...
VAPID_SUBJECT      = mailto:atolye@carmat.com.tr
```

Anahtar üretmek için: `node -e "console.log(require('web-push').generateVAPIDKeys())"`

## For an AI agent
- VAPID anahtarları env'de yoksa `sendPush()` no-op çalışır (log atar) — uygulama kırılmaz
- Yeni senaryo eklerken trigger noktasını **orders/[orderNo].ts** PATCH'te yapar veya yeni endpoint'te
- `tag` ile aynı bildirim 2 kez gelmez (renotify: true)
- `requireInteraction: true` → bildirim manuel kapatılana kadar kalır (kritik durumlar)
