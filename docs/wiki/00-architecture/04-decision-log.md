---
title: Karar Geçmişi (ADR)
module: architecture
status: living
last_reviewed: 2026-05-10
---

# Architecture Decision Records

Önemli mimari kararların kısa kayıtları. Yeni karar verince **buraya yeni ADR ekleyin**, eskiyi silmeyin.

---

## ADR-009 · Logo placement 3-yön → 9-yön (3×3 grid)
**Tarih**: 2026-05-10 (commit 64f16c9)
**Bağlam**: Kullanıcı "logo yerleşim sağ sol da ekle" istedi. Eski 3-yön (top/middle/bottom — hep ortada) yetersizdi.
**Karar**: 9 pozisyon (top/middle/bottom × left/center/right) + 3 legacy alias geriye dönük uyum. UI: 64×64 px 3×3 grid picker — paspas yüzeyinin görsel temsili.
**Alternatif reddedildi**: 5 pozisyon (4 köşe + merkez) — UX yetersiz (kullanıcı sağ-sol bazlı ofset istedi).
**Sonuç**: `LogoPlacement` 12 değer (9 yeni + 3 legacy), `PLACEMENT_COORDS` export, `PLACEMENT_GRID` UI iterator, `PLACEMENT_LABELS` Türkçe dil.

## ADR-010 · Logo orientation horizontal/vertical
**Tarih**: 2026-05-10 (commit 3791d05)
**Bağlam**: Bazı markaların logosu yatay (BMW yuvarlak, VW kare), bazıları dikey daha iyi (markaya bağlı). Kullanıcı "yatay dikey seçenekleri de koy" istedi.
**Karar**: `LogoOrientation = 'horizontal' | 'vertical'`, `MatLogoConfig.orientation` opsiyonel field. UI: 9-yön placement grid altında "Yatay/Dikey" toggle butonu. Default 'horizontal'.
**Sonuç**: Müşteri her paspas için ayrı yön seçebilir. Preview component orientation'a göre logo SVG rotate eder.

## ADR-011 · Container root user (Docker)
**Tarih**: 2026-05-09 (commit e269878)
**Bağlam**: Coolify persistent volume `/data` host'tan root:root mount ediyor. Docker container `USER node` (UID 1000) altında çalışınca EACCES yaşanıyor (orders.json yazma izni yok).
**Karar**: Dockerfile'dan `USER node` kaldır. Container root olarak çalışsın. `apk add su-exec` çıkarıldı, entrypoint script kaldırıldı.
**Alternatif reddedildi**: su-exec entrypoint chown — denenip rollback yapıldı (healthcheck `starting → ExitCode 1`, container ayağa kalkmadı).
**Sonuç**: Dockerfile basitleşti, /data write çalışıyor. MVP güvenlik trade-off kabul edildi — production'da Coolify volume host-side chown 1000:1000 ile node user'a düşürülebilir.

## ADR-012 · Trendyol API path migration (/sapigw → /integration)
**Tarih**: 2026-05-09 (commit 46b99d1)
**Bağlam**: Trendyol 2024'te API gateway taşıdı. Eski `/sapigw/suppliers/{id}/...` path'leri HTTP 556 Service Unavailable dönmeye başladı. Bizim kod hâlâ eski path'leri kullanıyordu.
**Karar**: Tüm `/sapigw/suppliers/{id}/*` → `/integration/<modul>/sellers/{id}/*` olarak güncelle. `subscribedStatuses` enum PascalCase ('Created', 'Picking') → UPPERCASE ('CREATED', 'PICKING'). Yeni API 400 Bad Request dönüyordu eski enum ile.
**Sonuç**: Bağlantı testi `{"ok":true,"status":200}` ✓. Webhook kayıt UPPERCASE statuses ile geçiyor. Listening endpoints: `/integration/sellers/{id}/addresses`, `/integration/order/sellers/{id}/orders`, `/integration/webhook/sellers/{id}/webhooks`, `/integration/product/brands`.

---

## ADR-001 · JSON-file DB (Strapi/PostgreSQL yerine)
**Tarih**: 2026-05-06
**Bağlam**: Atölyenin tek operatörlü, eş zamanlı yazma az olan bir KOBİ kullanım profili var. Strapi 5 + PostgreSQL planı vardı ama setup karmaşıklığı + native bağımlılık (better-sqlite3) sorunları çıktı.
**Karar**: Server tarafında JSON-file DB. Atomik write (write-temp + rename) + in-process write queue. Tek node container.
**Sonuç**: Sıfır native bağımlılık, tek container deploy, Coolify'da kolay yönetim. Eş zamanlı 5+ yazıcıya çıkmadan ölçekleniyor.
**Trade-off**: Filtreleme/agg query'leri JS'te yapılıyor (bin-on-binlerce kayıt için yavaşlar — V2'de SQLite'a geçilebilir).

---

## ADR-002 · 4-aşama sade üretim status (8 yerine)
**Tarih**: 2026-05-07
**Bağlam**: Önce 8 alt-status (cutting/sewing/quality_check vs.) kullanılıyordu. Müşteri "sade tutalım" dedi.
**Karar**: 4 ana aşama: `received` → `in_production` → `ready` → `delivered`. Eski granular değerler legacy desteği için union'da kalır, `customerStageOf()` ile map'lenir.
**Sonuç**: Müşteri tarafı 4 aşamalı sade timeline gösterir, admin de aynı 4'ü kullanır. UX basit.

---

## ADR-003 · injectManifest mode (generateSW yerine)
**Tarih**: 2026-05-07
**Bağlam**: Web Push entegrasyonu için service worker'a custom event handler (push, notificationclick) eklemek gerekti. `generateSW` modu Workbox'un kendi SW'sini üretir, custom kod ekleyemezsin.
**Karar**: vite-pwa `strategies: 'injectManifest'`, `src/sw.ts` özel SW. Workbox precaching `precacheAndRoute(self.__WB_MANIFEST)` ile korunur, push handler manuel eklenir.
**Sonuç**: Tek SW, hem precache hem push, ~17kb gz.

---

## ADR-004 · Cookie auth (HMAC) — JWT yerine
**Tarih**: 2026-05-06
**Bağlam**: Tek admin kullanıcı, RBAC gereksiz, JWT library bağımlılığı istemiyoruz.
**Karar**: HMAC-SHA256 imzalı cookie. Body = `base64url(JSON({sub:'admin', iat, exp}))`, signature = `hmac(SESSION_SECRET, body)`. 30 gün TTL.
**Sonuç**: Sıfır bağımlılık, tek dosya (`server/auth.ts`), kolay debug.

---

## ADR-005 · Bind mount /data (Docker named volume yerine)
**Tarih**: 2026-05-07
**Bağlam**: Docker named volume Coolify deploy'larda fonksiyonel sorun — bazen veri kaybı. Host filesystem path'i daha güvenilir.
**Karar**: Coolify persistent storage `host_path: /var/lib/coolify-data/paspasoto`, container `/data` mount. Her deploy aynı host klasörünü bind eder.
**Sonuç**: Veri kayıpları durdu. Backup için host filesystem'e direkt erişim.

---

## ADR-006 · Adapter pattern e-ticaret entegrasyonları
**Tarih**: 2026-05-07
**Bağlam**: İlk hedef Trendyol; ileride Hepsiburada, WooCommerce, Shopify. Her platform farklı payload + farklı imza.
**Karar**: `PlatformAdapter` interface. Her platform `verify()` + `parse()` implement eder. `registry.ts` map'iyle dispatch. Webhook endpoint platform-bazlı: `/api/integrations/<platform>/webhook`.
**Sonuç**: Yeni platform eklemek için 1 dosya (`<platform>.ts`) + registry entry. Test edilebilir, izole.

---

## ADR-007 · Stock recipe sabit kod (V2'de admin-editable)
**Tarih**: 2026-05-07
**Bağlam**: Üretim formülleri (paspas başına 0.55m taban, 0.08kg biye) sabit mi tutulsun yoksa admin UI'dan değiştirilebilir mi?
**Karar**: V1'de `stock-recipes.ts` içinde sabit kod. İlk hafta gerçek tüketim ile kalibre edilir, doğru sabitler bulunur. V2'de `data/recipes.json` + admin UI.
**Sonuç**: V1 hızlı çıktı, deploy kolay. Operasyon sırasında ölçü ayarlanabilir.

---

## ADR-008 · 1 sw.ts hem müşteri hem admin scope
**Tarih**: 2026-05-07
**Bağlam**: Admin için ayrı SW yazmak teknik olarak mümkün ama karmaşık.
**Karar**: Tek `src/sw.ts` `scope: '/'`. Hem müşteri (`/manifest.webmanifest`, `start_url:/`) hem admin (`/admin-manifest.webmanifest`, `start_url:/admin`, `scope:/admin`) aynı SW'i kullanır.
**Sonuç**: Tek deploy, tek precache, tek push handler. Audience ayrımı `'admin'` vs `'order:X'` ile yapılır.

---

## For an AI agent
Yeni mimari karar verirken bu dosyaya ADR-NNN formatında bir entry ekleyin. Sebep + alternatif + sonuç kısaca yazın. Eski ADR'leri silmeyin.
