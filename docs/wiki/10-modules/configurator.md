---
title: Konfigüratör Modülü
module: configurator
status: stable
last_reviewed: 2026-05-10
related: [[orders]], [[stock]], [[integrations]]
---

# Konfigüratör

## Sorumluluk
Müşterinin aracına özel paspas konfigüre etmesini sağlayan 8-adımlı (sahibinden tarzı) interaktif Preact island. Tasarım localStorage'a kaydedilir. Talep gönderilince DB'ye `kind: 'quote'` olarak düşer.

3 ürün kategorisi: **Paspas** (ana), **Koltuk Kılıfı**, **Direksiyon Kılıfı** — üst nav pill'leri ile geçiş.

## Kritik dosyalar
- `apps/web/src/components/configurator/Configurator.tsx` — paspas akışı (~1900 satır)
- `apps/web/src/components/configurator/SeatCoverConfigurator.tsx` — koltuk kılıfı
- `apps/web/src/components/configurator/SteeringCoverConfigurator.tsx` — direksiyon kılıfı
- `apps/web/src/components/configurator/VirtualShowroom.tsx` — Three.js cinematic backdrop + IMG fallback (commit 380938c)
- `apps/web/src/components/ui/ClientBrandLogo.tsx` — lokal SVG marka logoları
- `apps/web/src/lib/catalog.ts` — Brand, VehicleModel, **VehicleTrim**, BodyType, FuelType, Transmission, DriveType, MAT_COLORS, BORDER_COLORS, HEEL_PADS, LOGO_ACCESSORIES, PRODUCTS
- `apps/web/src/lib/catalog-trims.ts` — **58 trim seed** (popüler 18 model için motor/yakıt/şanzıman/donanım paketi) (commit ecc1bed)
- `apps/web/src/lib/catalog-seat.ts`, `catalog-steering.ts` — kategori-spesifik katalog
- `apps/web/src/pages/konfigurator/index.astro` (paspas), `koltuk.astro`, `direksiyon.astro`

## Cascade seçim akışı (sahibinden.com hiyerarşisi)

```
1. Marka (40)
       ↓ filter chip'leri: Sedan/SUV/Hatchback/Crossover/MPV
2. Model adı (eşsiz, jenerasyon grupları)
       ↓ tek jenerasyon → atla; çoklu → yıl picker
3. Yıl (4×6 grid, doğru chassis kodu otomatik)
       ↓ trim varsa picker; yoksa atla
4. Versiyon/Trim (motor + HP + yakıt + şanzıman + paket chip'leri)
       ↓ "Atla" veya "Devam"
5. Set — 2'li / 4'lü / 4'lü+bagaj
6. Mat zemin (10 renk)
7. Kenarlık (15 renk)
8. Topukluk (8 tür + konum: driver-only / passenger-only / both / none)
9. Logo per-mat (5 pozisyon × **9-yön placement** × **yatay/dikey orientation**)
10. Özet → "Teklif İste" → POST /api/quote
```

## Logo placement: 9-yön + orientation (commit 64f16c9, 3791d05)

Eski: 3 yön (top/middle/bottom — hep ortada)
**Yeni: 9 pozisyon** = 3 dikey × 3 yatay = paspas yüzeyi 3×3 grid
- top-left / top-center / top-right
- middle-left / middle-center / middle-right
- bottom-left / bottom-center / bottom-right
- Legacy 'top'/'middle'/'bottom' kayıtları → '*-center' alias

**Logo orientation**: `horizontal` (default, yatay) | `vertical` (90° rotated)
- BMW yuvarlak logosu hem yatay hem dikey iyi
- VW dikey yazı logosu yatay'da daha iyi
- VW resmi logosunda da bazı versiyonlar dikey
- UI: 3×3 grid picker altında "Yatay/Dikey" toggle butonu

`PLACEMENT_COORDS` export: her 9 pozisyon için CSS `top: %`, `left: %` değerleri.
Preview component bu coords'u kullanarak logo pozisyonunu renderlıyor.

## Live Preview (commit f77268a, b845dd8)

Configurator JSX'inde **iki yerde** Preview render edilir:
- **Desktop**: Sağ panele (max-w-[360px]) glassmorphic kart, slide-in-from-right animasyonlu
- **Mobile**: Sticky chip top-bar (matColor + borderColor + brand swatch chip).
  Tıklanınca **fullscreen overlay** açılır, tam Preview component görünür
- VirtualShowroom backdrop kalır + IMG fallback (`/images/showroom_*.png`)
  Three.js cylinder yüklenmese bile önizleme görünür (commit 380938c)

## Premium BrandStep tasarımı (commit 3117f69)

- 3-4 sütun aspect-square büyük kartlar
- Her marka kendi brand color radial gradient bg
- ⭐ Popüler markalar (28) üstte ayrı section
- Diğer markalar altta
- Active state: orange border + glow + checkmark rozet köşe
- Search aktif: flat grid, empty state mesajı

## State management
- `useState` per field
- `useEffect` ile her değişimde `localStorage[STATE_KEY]`'a kaydedilir
- İlk render `loadDraft()` ile geri yüklenir
- "Tasarımı sıfırla" butonu → `localStorage.removeItem` + reload

## STATE_KEY versionlama
`carmat-config-draft-v3` — şema değişirse v4'e bump et (eski draft'lar parse edilemezse fallback'e düşer).

## Per-mat logo mantığı
```ts
type MatLogoConfig = {
  position: MatPosition       // 'driver' | 'passenger' | 'leftRear' | 'rightRear' | 'trunk'
  brandSlug: string | null    // null = bu paspasta logo yok
  placement: LogoPlacement    // 'top' | 'middle' | 'bottom'
}
```
- Marka değişince ilk default: sürücü+yolcu otomatik dolu, arka+bagaj boş
- Hızlı butonlar: "Tüm Paspaslara X" + "Hiçbirine Logo Yok"
- Aktif pozisyonlar `positionsFor(parts, includesTrunk)` ile filtrelenir (4'lü'de bagaj çıkar)

## Topukluk konumu
4 seçenek: `driver-only` / `passenger-only` / `both` (+100₺) / `none`. Set tipi kaç paspas içerdiğine bakılmaz, konum tek tüketim hesabı.

## Submit (POST /api/quote)
- Public endpoint
- `kind: 'quote'`, `productionStatus: 'received'`, default ödeme `'sonra'`
- internalNote: `[KONFIGÜRATÖR ÖN TALEP]`
- Admin'e push: "🔔 Yeni Teklif Talebi"
- localStorage draft temizlenir

## For an AI agent
- Configurator.tsx çok büyük (~1500 satır) — değişiklik yapmadan önce ilgili step component'ini bul (BrandStep/ModelStep/...)
- Yeni step ekleme: `STEPS` array'e + step renderer + `canNext` kontrolü
- Submit body güncellerken hem yeni şema (logos[], heelPosition) hem legacy (logoBrandSlug, heelPadPassenger) gönderilir — tracker eski parser kalır
