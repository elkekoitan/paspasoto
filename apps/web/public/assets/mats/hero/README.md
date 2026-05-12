# Hero Mat Fotoğrafları

Konfigüratör tam-ekran arkaplanında kullanılan **EVA paspas hero fotoğrafları**.

## Dosya Yapısı

| Dosya | Kullanım |
|---|---|
| `default.webp` + `default.avif` | Varsayılan base — siyah/nötr EVA paspas, mix-blend overlay renk değişimi için |
| `{colorSlug}.webp` (opsiyonel) | Per-color gerçek foto varyantı. Varsa mix-blend kapanır, doğrudan kullanılır |

**colorSlug** değerleri: `siyah`, `gri`, `fume`, `mavi`, `taba`, `kirmizi`, `kahve`, `bordo`, `bej`, `turuncu-taba`

## AI Üretim (Midjourney / Flux / DALL-E / Stable Diffusion)

### Önerilen Prompt (Diamond doku)

```
product photography, single black EVA car floor mat, top-down view, zero perspective,
diamond honeycomb texture pattern, raised edges with subtle binding, matte finish,
clean dark neutral background, soft studio lighting from above, sharp focus,
3000px wide, ultra detailed, no shadows on background, no branding, no logos
```

**Stil parametreleri (Midjourney):** `--ar 16:9 --style raw --q 2 --v 6`

### Renk Varyantları için Prompt'a Ekle

| Renk | Prompt eki |
|---|---|
| Gri | `medium gray rubber color, light gray EVA foam` |
| Füme | `dark charcoal gray, smoke-tinted` |
| Mavi | `royal blue EVA foam, automotive blue` |
| Taba | `tan beige rubber, leather-tone` |
| Kırmızı | `deep red, automotive crimson EVA` |
| Kahve | `dark chocolate brown, espresso EVA` |
| Bordo | `burgundy maroon dark red EVA` |
| Bej | `cream beige, ivory EVA foam` |
| Turuncu Taba | `burnt orange terracotta EVA` |

## Yükleme Sonrası

1. AI'dan dosyaları indir → `.webp` formatına çevir (sharp veya cwebp ile)
2. Bu klasöre `{colorSlug}.webp` adıyla kaydet (örn. `kirmizi.webp`)
3. `BigMatBackdrop.tsx` içindeki `VARIANT_AVAILABLE` map'inde ilgili slug'ı `true` yap
4. `pnpm build && git push` → Coolify otomatik deploy

Variant foto yoksa otomatik olarak `default.webp` + mix-blend overlay kullanılır.

## Çözünürlük & Boyut

- **Min:** 2000×1125 (16:9)
- **Hedef:** 2560×1440 veya 3840×2160
- **Format:** WebP @ 88% quality (~250-400KB), opsiyonel AVIF @ 70%
- Optimizasyon: `sharp -i input.jpg --webp -q 88 --resize 2560` veya manuel
