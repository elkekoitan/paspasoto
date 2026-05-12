# _raw — Kullanıcı tarafından yüklenecek ham görseller

> **Bu klasör `.gitignore` içinde — dosyalar repo'ya gitmez.**
> Asset üretim hattı için kaynak görseller buraya yüklenir, sonra `scripts/extract-user-assets.mjs` çalıştırılır.

## Beklenen dosyalar

| Dosya | İçerik | Boyut önerisi |
|---|---|---|
| `logo-metal.jpg` | 12 markalı metal logo şeridi (Audi, Tesla, Peugeot, Mazda, BYD, Togg, VW, Toyota, Renault, Dacia, Ford, Chery) — 2 sütun × 6 satır | 1200×1800+ |
| `logo-premium.jpg` | 27 markalı premium lacivert logo şeridi (Alfa Romeo, BMW, Mercedes, vb.) — 3 sütun × 9 satır | 1500×2400+ |
| `classic-paw-front.jpg` | Top-down 2'li ön paspas seti, siyah EVA petek doku | 2000×1500+ |
| `classic-paw-full.jpg` | Top-down 5'li tam set (4 paspas + bagaj) | 2000×1500+ |
| `eva-white-set.jpg` | Beyaz/krem EVA paspas — renk varyantı kaynağı | 2000×1500+ |
| `mat-color-{slug}.jpg` (opsiyonel) | Renk varyant fotoğrafları: `mat-color-gri.jpg`, `mat-color-kahverengi.jpg`, `mat-color-kirmizi.jpg`, `mat-color-mavi.jpg`, `mat-color-lacivert.jpg`, `mat-color-sari.jpg` | Her biri 2000×1500+ |
| `heel-pad-standart.jpg` | Topukluk standart, transparan zemin (PNG önerilir) | 800×600 |
| `heel-pad-premium-deri.jpg` | Premium deri topukluk | 800×600 |
| `tech-eva-closeup.jpg` | EVA petek doku makro çekim — EvaTech ana sayfa | 1600×1200+ |
| `tech-diamond.jpg` | Diamond doku makro çekim | 1200×1200+ |
| `tech-production-cutting.jpg`, `tech-production-sewing.jpg`, `tech-quality-check.jpg` | Atölye süreci 3 fotoğraf | 1600×1200+ |

## Üretim

Bu klasöre dosyaları yükledikten sonra:

```bash
cd /c/Users/qw/Desktop/paspasoto
node scripts/extract-user-assets.mjs
```

Script:
- Logo şeritlerini tek tek kırpıp `public/assets/logos/{metal,premium}/*.webp` üretir (transparan)
- Mat fotoğraflarını `public/assets/mats/base/*.webp` + `.avif` çıkarır
- Renk varyantlarını `public/assets/mats/colors/*.webp` üretir
- Teknik görselleri `public/assets/tech/*.webp` optimize eder

Tüm çıktılar:
- AVIF 80% kalite (~150KB) — primary
- WebP fallback (~250KB)
- Otomatik AVIF + WebP `<picture>` elementlerinde kullanılır

## Yok / Eksik Asset'ler

Eğer atölyeden henüz fotoğraf gelmediyse:
- Logo şeritleri eksikse → konfigüratör logo adımında "Yakında" plakası gösterilir
- Mat base photo eksikse → eski `mats/hero-stack.webp` fallback kullanılır
- Teknik görseller eksikse → EvaTech sayfasında ikon + placeholder gösterilir

Asset gelene kadar plan tamamen çalışır, sadece görsel boşluk kalır.
