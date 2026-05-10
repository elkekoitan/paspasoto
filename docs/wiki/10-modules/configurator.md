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

## Premium UX Overhaul — 8 commit (2026-05-10 gece)

Kullanıcının "her marka model + premium hissi + koltuk/direksiyon önizleme" hedefine kapsamlı çözüm:

### Hero rebalance (`2f8a7de`)
- Sol-tarafı boş bug → görsel md:w-[60%]→52%, mask 35%→20%, sol konsantrik daire SVG accent
- Text wrapper max-w-2xl→3xl, paragraph max-w-xl→2xl

### Catalog tamamlama (`dc4f0c5` + `8e4848f`)
- 40 → **46 marka** (+Polestar/Genesis/Alfa Romeo/Smart/Infiniti/SsangYong)
- 113 → **150 model** (+37 popüler model: Audi Q7/Q8/A8/e-tron, Mercedes E/S/GLE/GLS/EQS/B,
  VW Touareg/ID.4/Caddy/T-Cross, Hyundai Bayon/Ioniq 5/6/Elantra, Toyota Yaris/Highlander,
  Renault Megane E-Tech/Kadjar/Symbol, Fiat 500/Linea/Fiorino, Kia Picanto/Cerato/EV6/Niro,
  Nissan Juke/Micra, Honda Civic FE/CR-V/HR-V, Tesla Model S/X, BMW 7 G70/i7)
- Mahindra/Chery logoUrl eksiği gider, 6 yeni SVG (text+icon)

### SeatCover live preview (`b110303` + `8d0bf20`)
- Eski statik div → SVG yan/ön profil koltuk illustration
- 3 bölge (gövde + sırt + başlık + bolster), materyal-spesifik dokular
  (alcantara perforated dot pattern, leather grain pattern)
- Kenar dikiş dasharray, marka rozetinin headrest'te nakışı
- isDarkColor algısı + edgeStroke kontrast (koyu renk visibility fix)

### Steering live preview (`0a2eec8`)
- Eski radial-gradient çember → 3-spoke direksiyon SVG
- Standart ↔ Sport (D-shape flat-bottom) toggle
- Pattern overlay'leri: karbon weave, perforated dot, diamond quilt
- Materyal gradient + stitching dasharray + center hub + brand emblem

### Multi-category Hızlı Tasarla (`8c60807`)
- SeatPreset[] (Klasik/Sport/Lüks) + SteeringPreset[] (Klasik/Sport/Lüks)
- Her configurator'da 3 emoji kart (🏛️/🏎️/👑), accentHex radial gradient
- applyPreset helper: tek tıkla tüm seçimleri doldurur

### BrandGrid model count badge (`8be9cd0`)
- Her marka kartı sol üstünde "X MODEL" rozeti
- Başlık dinamik: "150+ model, 46 marka"

## Summary trust badges + timeline (commit 2bed6d3, dad3bd2)

Summary step ekstra güven sinyalleri:

**4 trust badge** (UX research: %18 konversiyon etkisi):
- 🛡️ 2 Yıl Garanti — Üretici güvencesi
- 🚚 Kargo Dahil — Tüm Türkiye
- ⏱️ 5–7 İş Günü — Aynı gün üretim
- ↩️ 14 Gün İade — Beğenmezsen iade

**5 nokta timeline** — sipariş yolculuğu visualize:
- 1 Onay (bugün, primary dot)
- 2 Üretim (aynı gün)
- 3 Kalite (3. gün)
- 4 Kargo (5. gün)
- 5 Teslim (7. gün)

Beklenti yönetimi + güven artırma. Toplam 31 satır eklendi SummaryStep'e.

## StepperBar pill kontrast + ✓ checkmark (commit 65a1b12)

Inactive pill'ler `bg-[var(--color-surface)]` üzerinde `text-text-muted` çok dimdi. Düzeltildi:
- Inactive: `bg-white/5 text-white/55 border-white/10`
- Passed: `bg-white/8 text-white/95` + ✓ checkmark (number yerine)
- Active: primary bg + shadow-sm + border-primary

Net visual progress + kontrast.

## StepperBar 8 step pill wrap (commit 02b4465)

8 step `overflow-x-auto` yerine `flex-wrap` — 420px wizard panelinde 2 sıraya yazılır.
- Active step label her zaman görünür
- Inactive label `md:` breakpoint üstünde (768px+) görünür
- Pill height kısaltıldı (1.5 → 1) ve number-circle 5x5 → 4x4

Bu sayede tüm 8 step bir bakışta görünür, kullanıcı yatay scroll'a gerek duymaz.

## Hızlı Tasarla — Preset paketler (commit 2f98d3c, polish 91ef8e9)

Choice overload kıran tek-tık akış (UX research #2). BrandStep'in üstünde 3 büyük gradient kart:

| Preset | Mat | Border | Heel | Logo |
|---|---|---|---|---|
| 🏛️ **Klasik** | siyah | siyah | standart | yok |
| 🏎️ **Spor** | siyah | kırmızı | antrasit-karbon | auto top-center horizontal |
| 👑 **Lüks** | bej | kahve | krem-noktali | auto top-center horizontal |

**Kritik dosya**: `apps/web/src/lib/presets.ts` — `ConfigPreset` tipi + `PRESETS[]` array
**Helper**: `Configurator.tsx → applyPreset(preset)` — matColor/borderColor/heelPad/logos set + `setStep('summary')`
**UX**: marka seçilmeden de uygulanabilir
- Brand step'te preset cards görünür (commit 02b4465 öncesi sadece marka seçildikten sonra görünüyordu)
- `applyPreset` smart navigation: `brand && model` varsa summary'e atlar, yoksa mevcut step'te kalır (önizlemede mat/border live görür)
- logoMode='auto' için brand seçili değilse logos boş kalır, brand seçilince useEffect otomatik doldurur

## "Emin Değilim" CTA (commit 2f98d3c)

Wizard footer'a sticky yeşil link (UX research #7). Tıklanınca `buildHelpRequestUrl(state)` ile mevcut konfig özetini WhatsApp'a iletir:
```
🚗 Araç: BMW 3 Serisi G20
📦 Set: 4'lü Tam Set
🎨 Zemin: Siyah
🪡 Kenarlık: Kırmızı
👟 Topukluk: Antrasit Karbon
💰 Tahmini: 2.450₺
```
Atölye config'i okur, müşteriye uygun öneri yapar — choice overload kırma 2. aşaması.

**Kritik helper**: `apps/web/src/lib/whatsapp.ts → buildHelpRequestUrl(state)`

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
