/**
 * Koltuk Kılıfı kataloğu (Carmat seat cover SKU set'i).
 *
 * 4 set tipi × 4 malzeme × 8 renk = ~128 olası kombinasyon.
 * Her seçim Order'da `category: 'seat-cover'` ile kaydedilir.
 */

export type SeatSet = {
  id: number
  slug: string
  name: string
  description: string
  parts: number             // koltuk parça sayısı
  basePrice: number         // baz fiyat (kumaş varyantına göre çarpan eklenir)
  fitments: 'universal' | 'tailored'  // genel kalıp / araç-özel kesim
  includesAirbag: boolean   // airbag'a uyumlu yarık var mı
}

export type SeatMaterial = {
  id: number
  slug: string
  name: string
  description: string
  pricePremium: number      // baz fiyata ek (₺)
  swatchUrl: string
  textureHex: string
}

export type SeatColor = {
  id: number
  slug: string
  name: string
  hex: string
  swatchUrl: string
}

export const SEAT_SETS: SeatSet[] = [
  {
    id: 1,
    slug: 'on-cift',
    name: 'Ön Çift',
    description: 'Sürücü + ön yolcu — 2 koltuk',
    parts: 2,
    basePrice: 2490,
    fitments: 'universal',
    includesAirbag: true,
  },
  {
    id: 2,
    slug: 'arka-tek',
    name: 'Arka Tek Sıra',
    description: 'Arka 3’lü koltuk — 1 sıra',
    parts: 1,
    basePrice: 1890,
    fitments: 'universal',
    includesAirbag: false,
  },
  {
    id: 3,
    slug: 'tam-set',
    name: 'Tam Set',
    description: 'Ön + arka tüm koltuklar — 4 parça',
    parts: 4,
    basePrice: 3990,
    fitments: 'universal',
    includesAirbag: true,
  },
  {
    id: 4,
    slug: 'tam-set-tailored',
    name: 'Araç Özel Tam Set',
    description: 'Aracınızın kalıbına göre ölçü — premium',
    parts: 4,
    basePrice: 5490,
    fitments: 'tailored',
    includesAirbag: true,
  },
]

const SWATCH = '/assets/swatches/seat'

export const SEAT_MATERIALS: SeatMaterial[] = [
  {
    id: 1,
    slug: 'fabric',
    name: 'Premium Kumaş',
    description: 'Nefes alır, terlemez · standart',
    pricePremium: 0,
    swatchUrl: `${SWATCH}/material-fabric.webp`,
    textureHex: '#3a3a40',
  },
  {
    id: 2,
    slug: 'leather',
    name: 'Suni Deri',
    description: 'Kolay temizlenir · şık',
    pricePremium: 800,
    swatchUrl: `${SWATCH}/material-leather.webp`,
    textureHex: '#1a1a1a',
  },
  {
    id: 3,
    slug: 'leather-real',
    name: 'Hakiki Deri',
    description: 'Premium, uzun ömür',
    pricePremium: 2400,
    swatchUrl: `${SWATCH}/material-leather-real.webp`,
    textureHex: '#2a1a14',
  },
  {
    id: 4,
    slug: 'mesh',
    name: 'File / Mesh',
    description: 'Hava sirkülasyonu yüksek · spor görünüm',
    pricePremium: 400,
    swatchUrl: `${SWATCH}/material-mesh.webp`,
    textureHex: '#2a2a30',
  },
  {
    id: 5,
    slug: 'alcantara',
    name: 'Alcantara',
    description: 'Yüksek tutuş · spor araçlar için',
    pricePremium: 1800,
    swatchUrl: `${SWATCH}/material-alcantara.webp`,
    textureHex: '#1f1f25',
  },
]

export const SEAT_COLORS: SeatColor[] = [
  { id: 1, slug: 'siyah', name: 'Siyah', hex: '#101015', swatchUrl: `${SWATCH}/color-siyah.webp` },
  { id: 2, slug: 'gri', name: 'Antrasit Gri', hex: '#3d3d44', swatchUrl: `${SWATCH}/color-gri.webp` },
  { id: 3, slug: 'bej', name: 'Bej', hex: '#cfbe9e', swatchUrl: `${SWATCH}/color-bej.webp` },
  { id: 4, slug: 'kahve', name: 'Kahverengi', hex: '#3a2418', swatchUrl: `${SWATCH}/color-kahve.webp` },
  { id: 5, slug: 'krem', name: 'Krem', hex: '#e8d8b8', swatchUrl: `${SWATCH}/color-krem.webp` },
  { id: 6, slug: 'lacivert', name: 'Lacivert', hex: '#1a1f3a', swatchUrl: `${SWATCH}/color-lacivert.webp` },
  { id: 7, slug: 'kirmizi-detay', name: 'Siyah + Kırmızı Dikiş', hex: '#0f0f12', swatchUrl: `${SWATCH}/color-kirmizi-detay.webp` },
  { id: 8, slug: 'beyaz-detay', name: 'Siyah + Beyaz Dikiş', hex: '#0f0f12', swatchUrl: `${SWATCH}/color-beyaz-detay.webp` },
]

/** Bir konfigürasyonun toplam fiyatı: set + malzeme premium */
export function computeSeatPrice(setSlug: string, materialSlug: string): number {
  const set = SEAT_SETS.find((s) => s.slug === setSlug)
  const mat = SEAT_MATERIALS.find((m) => m.slug === materialSlug)
  if (!set || !mat) return 0
  return set.basePrice + mat.pricePremium
}
