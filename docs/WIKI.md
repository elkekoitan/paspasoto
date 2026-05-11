# PaspasOto.com — Modül Wiki

Proje genişledikçe **her yeni özellik burada bir bölüm açar**.
Kod yazmadan önce ilgili modülün dosya listesine ve sözleşmesine bakın — tek seferde her şeyi okumayalım.

> Detaylı ürün gereksinimleri için: [`docs/PRD.md`](./PRD.md)

---

## 0. Hızlı Yön Bulma

```
apps/web/src/
├─ pages/                    # Routes (public + admin + api)
│  ├─ {index,hakkimizda,...} # Vitrin (prerender = true)
│  ├─ konfigurator/          # 3 konfigüratör (paspas, koltuk, direksiyon)
│  ├─ siparis-takip/         # Müşteri sipariş takibi
│  ├─ admin/                 # KOBİ paneli (auth gerekli)
│  └─ api/                   # SSR endpoints
├─ server/                   # Backend (DB + auth + push + mail + integrations)
├─ lib/                      # Frontend katalog + helper'lar
├─ components/               # UI (admin / configurator / home / layout / tracker / ui)
└─ public/                   # Statik asset'ler (logo, swatches, hero, icons)
```

**Mimari özet:** Astro 5 hybrid (`output: 'server'` + node adapter), vitrin sayfaları `prerender = true` ile statik, admin + api dinamik SSR. JSON file backend (`/data/orders.json`, Coolify volume).

---

## 1. Sipariş Yönetimi *(Çekirdek)*

**Sözleşme:** `src/server/db.ts`

### Tipler
- **`OrderStatus`** — 4 aşama: `received` → `in_production` → `ready` → `delivered` + `cancelled`
- **`CustomerStage`** — `customerStageOf(status)` ile legacy granular kayıtlar (production_cutting vb.) 4 gruba düşer
- **`OrderKind`** — `'order'` (kesin sipariş) | `'quote'` (ön talep, atölye onayı bekliyor)
- **`Channel`** — `manual | configurator | physical_store | trendyol | hepsiburada | woocommerce | shopify | n11`
- **`DeliveryMethod`** — `cargo | pickup` (kargo veya dükkandan teslim)
- **`PaymentMethod`** — `elden-nakit | elden-kart | havale | kapida | sonra | taksit`
- **`PaymentStatus`** — `bekliyor | kismi | tamamlandi | iade`
- **`PaymentInstallment`** — çoklu tahsilat / taksit kaydı
- **`ProductCategory`** — `mat | seat-cover | steering-cover`
- **`MatLogoConfig`** — 3×3 grid logo yerleşimi (T/M/B × L/C/R), eski `logoBrandSlug` + `logoQty` backward compat
- **`HeelPosition`** — yeni şema, eski `heelPadPassenger: boolean` fallback

### API
```
POST   /api/orders                          → admin, yeni sipariş
GET    /api/orders                          → admin, liste
GET    /api/orders/[orderNo]                → admin, detay
PATCH  /api/orders/[orderNo]                → admin, durum/ödeme/kargo güncelle
DELETE /api/orders/[orderNo]                → admin, sil
GET    /api/orders/quotes-summary           → admin, ön talep sayım
POST   /api/track                           → public, orderNo+phoneLast4 → token
GET    /api/track/[token]                   → public-safe (internalNote filtrelenir)
```

### UI (admin)
- `pages/admin/index.astro` — gösterge (kpi + son siparişler)
- `pages/admin/orders/index.astro` — filtre/arama/sıralama listesi (chip + form)
- `pages/admin/orders/new.astro` — yeni sipariş (`NewOrderForm.tsx` island)
- `pages/admin/orders/[orderNo].astro` — detay/edit (`OrderEditor.tsx`)
- `pages/admin/talepler.astro` — ön talepler (kind=`quote` siparişler)

### UI (müşteri)
- `pages/siparis-takip/index.astro` — sorgu formu
- `pages/siparis-takip/detay.astro` — `?t=token` ile detay (`OrderTracker.tsx`)

### Yardımcılar
- `generateOrderNo()` → `PO-YYMMDD-XXXX`
- `generateToken()` → uuid v4
- `getByOrderNoAndPhoneLast4()` — public lookup
- `getByExternalRef(platform, id)` — webhook idempotency
- `insertOrder | updateOrder | deleteOrder` — atomik (`_writeQueue` mutex)

---

## 2. Auth

**Sözleşme:** `src/server/auth.ts`

- HMAC-SHA256 imzalı session cookie (`paspasoto_admin`, httpOnly, sameSite=strict)
- Stateless (server'da session store yok)
- Env: `ADMIN_PASSWORD`, `SESSION_SECRET`
- TTL: 30 gün

```
POST /api/auth/login   → form submit, redirect /admin
POST /api/auth/logout  → cookie temizle
```

**API guard:** `requireAdmin(cookies)` — yetkisiz `Response(401)` fırlatır
**Sayfa guard:** `getSession(cookies)` → `null` ise `redirect('/admin/login')`

---

## 3. Katalog *(Static Data, Frontend)*

Strapi yerine kod içinde sabit. Değişmesi gerekiyorsa `lib/` dosyaları + yeniden deploy.

| Dosya | İçerik |
|---|---|
| `lib/catalog.ts` | 20 marka + ~20 model + 10 paspas/15 kenarlık/8 topukluk + amblem + 3 set tipi |
| `lib/catalog-seat.ts` | Koltuk kılıfı malzeme/renk/araç tipi |
| `lib/catalog-steering.ts` | Direksiyon kılıfı boyut/desen/malzeme |
| `lib/catalog-trims.ts` | Araç donanım/trim kombinasyonları |
| `lib/presets.ts` | Hazır renk kombinasyonları |

---

## 4. Konfigüratör

3 ayrı ürün kategorisi → 3 ayrı sayfa, ortak design language.

| Yol | Component | Kategori |
|---|---|---|
| `/konfigurator` | `Configurator.tsx` | Paspas (7 adım + car-body preview) |
| `/konfigurator/koltuk` | `SeatCoverConfigurator.tsx` | Koltuk kılıfı |
| `/konfigurator/direksiyon` | `SteeringCoverConfigurator.tsx` | Direksiyon kılıfı |

**Ortak preview komponentleri:**
- `components/configurator/preview/SeatPreview.tsx`
- `components/configurator/preview/SteeringPreview.tsx`
- `components/configurator/VirtualShowroom.tsx` — 3D-ish görselleştirme

**CTA:** WhatsApp deeplink (`https://wa.me/...?text=konfigürasyon-özeti`) — sepet yok, KOBİ talebi panelden ekler.

---

## 5. Ön Talep (Quote)

Müşteri konfigüratör veya iletişim formundan ön talep oluşturur, KOBİ onaylayınca `kind: 'quote' → 'order'` olur.

```
POST /api/quote                         → public, kind='quote' Order oluşturur
GET  /api/orders/quotes-summary         → admin sayım
```

**UI:** `pages/admin/talepler.astro` — onayla/reddet

---

## 6. Stok Yönetimi

**Sözleşme:** `src/server/stock.ts`, `stock-recipes.ts`

- SKU bazlı stok takibi
- Recipe: paspas tipi + renk kombinasyonu → hangi hammaddeler ne kadar düşer
- Sipariş `delivered`'a geçince otomatik düşme (admin onayıyla)

```
GET  /api/stock                 → liste
POST /api/stock/adjust          → manuel düzeltme (+/−)
GET  /api/stock/movements       → hareket geçmişi
```

**UI:** `pages/admin/stok/index.astro` (liste), `[sku].astro` (detay/hareket)

---

## 7. Dış Platform Entegrasyonları

**Sözleşme:** `src/server/integrations/`

| Modül | Dosya |
|---|---|
| Tip tanımları | `integrations/types.ts` |
| Registry (platform listesi + aktiflik) | `integrations/registry.ts` |
| Trendyol | `integrations/trendyol.ts`, `trendyol-api.ts`, `trendyol-mapping.ts` |
| Hepsiburada | `integrations/hepsiburada.ts` |
| Olay log | `integrations/events-log.ts` |

```
POST /api/integrations/trendyol/webhook       → Trendyol push
POST /api/integrations/trendyol/webhooks      → Toplu webhook
POST /api/integrations/trendyol/sync          → Manuel sync
GET  /api/integrations/trendyol/test          → Bağlantı testi
POST /api/integrations/hepsiburada/webhook    → Hepsiburada push
```

**Idempotency:** `Order.externalRef = { platform, id }` ile aynı dış sipariş ikinci kez işlenmez (`getByExternalRef`).

**UI:** `pages/admin/entegrasyonlar/index.astro` — bağla/test et/log gör.

---

## 8. WhatsApp

| Katman | Dosya | İşlev |
|---|---|---|
| Mesaj template'leri | `lib/whatsapp.ts` | `buildProductionStartedWaUrl`, `buildReadyWaUrl`, vb. — `wa.me?text=...` URL üretir |
| Cloud API client | `server/whatsapp-client.ts` | Sunucu-taraflı API çağrısı (token + phone-id env'den) |

Admin'de OrderEditor'da "Üretim başladı → WhatsApp gönder" gibi tek tıkla mesajlar.

---

## 9. Bildirim & Mail

| Modül | Dosya |
|---|---|
| Web Push (VAPID) | `server/push.ts` |
| SMTP mail | `server/mail.ts` |

```
GET  /api/push/vapid             → public key
POST /api/push/subscribe         → endpoint kaydet
POST /api/push/unsubscribe       → endpoint sil
```

**Müşteri tarafı:** sipariş takip sayfası açıldığında "Durum değişince bildirim al" CTA → subscribe.
**Admin:** durum güncellenince ilgili müşteriye push + e-posta gönderilir.

---

## 10. PWA

- Plugin: `@vite-pwa/astro` (`mode: injectManifest`)
- SW kaynak: `src/sw.ts`
- Manifest: `astro.config.mjs` içinde
- 138 entries / ~11 MB precache
- Müşteri sipariş takip sayfasında push notification CTA + service worker subscribe

---

## 11. Frontend Vitrin

**Statik sayfalar** (`prerender = true`):
- `/` — Hero (parallax) + USP + BrandGrid + ColorShowcase + HowItWorks + GalleryPreview + Testimonials + FaqPreview + CtaBanner
- `/hakkimizda`, `/iletisim`, `/galeri`, `/markalar`, `/sss`, `/tanitim`, `/offline`

**Header/Footer:** `Header.astro` (logo + nav + WhatsApp CTA), `BrandStrip.astro` (marka marquee), `Footer.astro`, `MobileBottomNav.astro`.

**UI bileşenleri:** `components/ui/BrandLogo.astro` (simple-icons SVG), `ClientBrandLogo.tsx` (client island).

---

## 12. Tasarım Sistemi

- **Tailwind 4** + CSS custom properties (`src/styles/globals.css`)
- Renkler: `--color-bg` `#0B0B0F` koyu zemin, `--color-primary` `#D4923A` amber, `--color-text` `#F4EDE0` krem
- Font: Inter (Google Fonts), display için `font-display` (`Söhne` fallback Inter)
- Grain texture: `body.grain` + `::after` SVG noise
- Scroll-reveal: `[data-reveal]` + IntersectionObserver (`Base.astro` script)

---

## 13. Asset Üretimi (Scripts)

| Script | İşlev |
|---|---|
| `scripts/generate-icons.mjs` | Logo'dan PWA + favicon + apple-touch + OG |
| `scripts/generate-textures.mjs` | 33 procedural webp doku (honeycomb mat + grain border + carbon/dot heel) |
| `scripts/extract-swatches.mjs` | Mevcut WhatsApp jpeglerinden swatch crop (eski, kullanılmıyor — procedural'lar değiştirdi) |

---

## 14. Deploy

| Katman | Detay |
|---|---|
| Container | `apps/web/Dockerfile` — multi-stage (node:20-alpine builder + runtime), tini + wget, non-root, port 4321 |
| Healthcheck | `/health` endpoint → "ok" |
| Persistent volume | `/data` (Coolify volume mount) — `orders.json` + `pushSubscriptions` |
| Env vars | `ADMIN_PASSWORD`, `SESSION_SECRET`, `PUBLIC_SITE_URL`, `DATA_DIR=/data`, ileride: `SMTP_*`, `VAPID_*`, `WHATSAPP_*`, `TRENDYOL_*` |
| Coolify | Project `vgr9kd6dmv0zkr83f7zshma6` · App `kw1f0tskisx5pl6i5jw2tzgw` · Server `hiyxmas7zd09o6pfwkws4iwf` |

---

## Kod Yazma Kuralları

1. **Önce wiki'ye ekle** — yeni modül/dosya çıktığında bu dosyaya satır ekle (PR/commit'in parçası).
2. **İlgili modüle odaklan** — sipariş işine girerken sadece `db.ts` + `OrderEditor.tsx` + `OrderTracker.tsx` + `api/orders/*` aç. Diğer dosyaları bu wiki üzerinden bul.
3. **Tip değişimleri `db.ts`'te** — `Order`, `OrderItem`, `PaymentInstallment` vb. tek kaynak.
4. **Backward compat** — eski granular `OrderStatus` ve `heelPadPassenger` kayıtları çalışmaya devam etmeli (`customerStageOf` + fallback'ler).
5. **Public API'lerde `internalNote` filtrelenir** — `/api/track/[token]` destructure ile çıkarır.
6. **DB writes atomik** — `insertOrder/updateOrder/deleteOrder` kullan, `writeFileSync`'i direkt çağırma.
7. **Yeni env var → `.env.example`** ve bu wikinin §14 tablosuna ekle.
8. **API permissions açık** — her endpoint dosyasında `prerender = false` + `requireAdmin` ya da public-by-token kontrolü.

---

## Önemli Endpoint Özeti

| Method | Path | Erişim |
|---|---|---|
| GET | `/health` | açık (healthcheck) |
| GET | `/` | açık (prerender) |
| GET | `/konfigurator{,/koltuk,/direksiyon}` | açık |
| GET | `/siparis-takip{,/detay}` | açık |
| POST | `/api/track` | public (rate-limit önerilir) |
| GET | `/api/track/[token]` | public (token = "yetki") |
| POST | `/api/quote` | public |
| POST | `/api/auth/login` | açık (şifre kontrolü) |
| GET | `/admin/**` | session admin |
| /api/orders/** | session admin |
| /api/stock/** | session admin |
| /api/push/(send) | session admin |
| /api/push/(subscribe,unsubscribe,vapid) | public |
| /api/integrations/**/webhook | bearer (platform secret) |

---

**Son güncelleme:** Sipariş 4-aşama timeline + ön talep + stok + Trendyol/Hepsiburada + WhatsApp + Web Push + 3 konfigüratör + virtual showroom modüllerinin tamamlanması.
