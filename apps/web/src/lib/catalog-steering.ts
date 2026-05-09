/**
 * Direksiyon Kılıfı kataloğu (Carmat steering cover SKU set'i).
 *
 * 3 boyut × 5 desen × 4 malzeme = ~60 olası kombinasyon.
 * Her seçim Order'da `category: 'steering-cover'` ile kaydedilir.
 */

export type SteeringSize = {
  id: number
  slug: 'S' | 'M' | 'L'
  name: string
  diameterCm: string
  description: string
  basePrice: number
}

export type SteeringPattern = {
  id: number
  slug: string
  name: string
  description: string
  pricePremium: number
  swatchUrl: string
}

export type SteeringMaterial = {
  id: number
  slug: string
  name: string
  description: string
  pricePremium: number
  textureHex: string
  swatchUrl: string
}

export const STEERING_SIZES: SteeringSize[] = [
  {
    id: 1,
    slug: 'S',
    name: 'Küçük (S)',
    diameterCm: '36-37 cm',
    description: 'Mini, Smart, küçük direksiyonlu araçlar',
    basePrice: 590,
  },
  {
    id: 2,
    slug: 'M',
    name: 'Orta (M)',
    diameterCm: '37-39 cm',
    description: 'Sedan ve hatchback’ların büyük çoğunluğu',
    basePrice: 690,
  },
  {
    id: 3,
    slug: 'L',
    name: 'Büyük (L)',
    diameterCm: '39-42 cm',
    description: 'SUV, ticari araçlar, kamyonet',
    basePrice: 790,
  },
]

const SWATCH = '/assets/swatches/steering'

export const STEERING_PATTERNS: SteeringPattern[] = [
  {
    id: 1,
    slug: 'sport',
    name: 'Sport',
    description: 'Yarış stili · D-shape kavrama',
    pricePremium: 0,
    swatchUrl: `${SWATCH}/pattern-sport.webp`,
  },
  {
    id: 2,
    slug: 'classic',
    name: 'Klasik',
    description: 'Düz çevrimli, geleneksel görünüm',
    pricePremium: 0,
    swatchUrl: `${SWATCH}/pattern-classic.webp`,
  },
  {
    id: 3,
    slug: 'perforated',
    name: 'Delikli',
    description: 'Hava alır, terlemez yaz tasarımı',
    pricePremium: 100,
    swatchUrl: `${SWATCH}/pattern-perforated.webp`,
  },
  {
    id: 4,
    slug: 'carbon',
    name: 'Karbon Doku',
    description: 'Karbon görünümlü premium',
    pricePremium: 200,
    swatchUrl: `${SWATCH}/pattern-carbon.webp`,
  },
  {
    id: 5,
    slug: 'diamond-stitch',
    name: 'Elmas Dikiş',
    description: 'Elmas desenli premium dikiş',
    pricePremium: 250,
    swatchUrl: `${SWATCH}/pattern-diamond.webp`,
  },
]

export const STEERING_MATERIALS: SteeringMaterial[] = [
  {
    id: 1,
    slug: 'leather-syn',
    name: 'Suni Deri',
    description: 'Standart, ekonomik',
    pricePremium: 0,
    textureHex: '#1a1a1f',
    swatchUrl: `${SWATCH}/material-leather-syn.webp`,
  },
  {
    id: 2,
    slug: 'leather-real',
    name: 'Hakiki Deri',
    description: 'Uzun ömürlü, premium dokunuş',
    pricePremium: 400,
    textureHex: '#2a1a14',
    swatchUrl: `${SWATCH}/material-leather-real.webp`,
  },
  {
    id: 3,
    slug: 'alcantara',
    name: 'Alcantara',
    description: 'Spor araçlar için yüksek tutuş',
    pricePremium: 600,
    textureHex: '#1f1f25',
    swatchUrl: `${SWATCH}/material-alcantara.webp`,
  },
  {
    id: 4,
    slug: 'silicone',
    name: 'Silikon',
    description: 'Yıkanabilir, kolay tak/çıkar',
    pricePremium: -100,
    textureHex: '#2a2a30',
    swatchUrl: `${SWATCH}/material-silicone.webp`,
  },
]

export function computeSteeringPrice(
  sizeSlug: string,
  patternSlug: string,
  materialSlug: string,
): number {
  const size = STEERING_SIZES.find((s) => s.slug === sizeSlug)
  const pattern = STEERING_PATTERNS.find((p) => p.slug === patternSlug)
  const material = STEERING_MATERIALS.find((m) => m.slug === materialSlug)
  if (!size || !pattern || !material) return 0
  return size.basePrice + pattern.pricePremium + material.pricePremium
}
