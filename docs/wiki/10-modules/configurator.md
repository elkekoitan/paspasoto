---
title: Konfigüratör Modülü
module: configurator
status: stable
last_reviewed: 2026-05-07
related: [[orders]], [[stock]]
---

# Konfigüratör

## Sorumluluk
Müşterinin aracına özel paspas konfigüre etmesini sağlayan 7-adımlı interaktif Preact island. Tasarım localStorage'a kaydedilir, sayfa kapanıp açıldığında devam eder. Talep gönderilince DB'ye `kind: 'quote'` olarak düşer.

## Kritik dosyalar
- `apps/web/src/components/configurator/Configurator.tsx` — ana akış (~1500 satır)
- `apps/web/src/components/configurator/VirtualShowroom.tsx` — 3D-ish glassmorphic background
- `apps/web/src/components/ui/ClientBrandLogo.tsx` — gerçek brand color logoları
- `apps/web/src/lib/catalog.ts` — Brand, VehicleModel, MatColor, BorderColor, HeelPad, LOGO_ACCESSORIES, PRODUCTS
- `apps/web/src/pages/konfigurator/index.astro` — sayfa wrapper

## 7 adım
1. **Marka** — 40 marka grid (gerçek brand color logoları)
2. **Model** — seçilen markanın 2-11 alt modeli
3. **Set** — 2'li / 4'lü / 4'lü+bagaj
4. **Mat zemin rengi** — 10 renk swatch
5. **Kenarlık** — 15 renk swatch
6. **Topukluk** — 8 tür + konum (driver-only / passenger-only / both / none)
7. **Logo per-mat** — her paspasa ayrı amblem + konum (top/middle/bottom)
8. **Özet** → "Teklif İste" → ad+telefon+il+ilçe+adres → POST /api/quote

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
