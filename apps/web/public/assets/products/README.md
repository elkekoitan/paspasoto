# Ürün Görselleri (Multimedya Ekran Koruyucu / Parfüm / Kimya / Çanta)

Her ürün için bir görsel slot var:

```
/assets/products/{category}/{slug}.{svg|webp|jpg|png}
```

- **category** = `screen-protector` | `perfume` | `chemical` | `bag`
- **slug** = `catalog-extra.ts` içindeki ürün slug'ı (örn. `midnight-oud`)

## Mevcut Durum

24 ürün için **placeholder SVG** üretildi (`scripts/generate-product-placeholders.mjs`).
Gradient + emoji + ürün adı. Site hiç boş görünmez.

## Gerçek Fotoğraf Drop Etmek İçin

1. Foto'yu kaynak format olarak `apps/web/public/assets/_raw/products/` altına koy
2. Sharp ile webp + jpg üret (önerilen):
   ```bash
   sharp -i _raw/products/midnight-oud.jpg --webp -q 88 \
     --resize 800 \
     -o products/perfume/midnight-oud.webp
   ```
3. `catalog-extra.ts` içindeki `image` field'ını `.webp` olarak güncelle
4. Eski `.svg` placeholder'ı sil (opsiyonel)

## Gemini Pro / Midjourney Prompt'ları

### Ekran Koruyucu
```
Product photography of a tempered glass screen protector for a car
multimedia touchscreen, top-down on a white seamless background,
soft studio lighting, slight reflection, no branding, 4K, photorealistic.
```

### Parfüm (klips)
```
Premium car air freshener clip-on with amber liquid in clear glass,
attached to a car AC vent, top-down product photography on dark
luxury surface, soft studio lighting, depth of field, photorealistic.
```

### Kimya / Temizleyici (sprey şişe)
```
Spray bottle, automotive interior cleaner, 500ml, label visible but
without text/branding, standing on clean white surface, soft studio
shadow, 4K product photography, photorealistic.
```

### Çanta / Organizer
```
Black oxford fabric car trunk organizer with multiple compartments,
top-down view on clean studio surface, partial 3D angle, soft
lighting, photorealistic, 4K, no branding.
```

## Toplu Üretim İçin

Her ürün için ayrı prompt çalıştırmak yerine `scripts/extract-user-assets.mjs`
benzeri bir batch script ile `_raw/products/` klasöründeki tüm görselleri tek
seferde optimize edip drop edebilirsin (Faz 8 için planda).
