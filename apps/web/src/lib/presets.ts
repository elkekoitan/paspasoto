/**
 * Konfigüratör Preset Paketleri (sadece koltuk + direksiyon).
 *
 * Paspas konfigüratöründeki "Hızlı Tasarla" özelliği müşteri geri bildirimi
 * üzerine kaldırıldı — kullanıcı adım adım kendisi tasarlasın.
 */

/* -------------------- Koltuk Kılıfı Preset'leri (P2-A) -------------------- */

export type SeatPreset = {
  slug: string
  category: 'seat-cover'
  name: string
  tagline: string
  emoji: string
  accentHex: string
  setSlug: string
  materialSlug: string
  colorSlug: string
}

export const SEAT_PRESETS: SeatPreset[] = [
  {
    slug: 'klasik-bej-deri',
    category: 'seat-cover',
    name: 'Klasik',
    tagline: 'Bej hakiki deri · zarif',
    emoji: '🏛️',
    accentHex: '#a78a4d',
    setSlug: 'tam-set',
    materialSlug: 'leather-real',
    colorSlug: 'bej',
  },
  {
    slug: 'sport-alcantara',
    category: 'seat-cover',
    name: 'Sport',
    tagline: 'Alcantara antrasit · M Sport hissi',
    emoji: '🏎️',
    accentHex: '#b91c1c',
    setSlug: 'tam-set',
    materialSlug: 'alcantara',
    colorSlug: 'gri',
  },
  {
    slug: 'luks-krem-naturel',
    category: 'seat-cover',
    name: 'Lüks',
    tagline: 'Krem premium deri · özel ölçü',
    emoji: '👑',
    accentHex: '#c9a86a',
    setSlug: 'tam-set-bagaj',
    materialSlug: 'leather-real',
    colorSlug: 'krem',
  },
]

export function getSeatPresetBySlug(slug: string): SeatPreset | undefined {
  return SEAT_PRESETS.find((p) => p.slug === slug)
}

/* -------------------- Direksiyon Kılıfı Preset'leri -------------------- */

export type SteeringPreset = {
  slug: string
  category: 'steering-cover'
  name: string
  tagline: string
  emoji: string
  accentHex: string
  sizeSlug: 'S' | 'M' | 'L'
  patternSlug: string
  materialSlug: string
}

export const STEERING_PRESETS: SteeringPreset[] = [
  {
    slug: 'klasik-leather',
    category: 'steering-cover',
    name: 'Klasik',
    tagline: 'Düz hakiki deri · zamansız',
    emoji: '🏛️',
    accentHex: '#1a1a22',
    sizeSlug: 'M',
    patternSlug: 'classic',
    materialSlug: 'leather-real',
  },
  {
    slug: 'sport-karbon',
    category: 'steering-cover',
    name: 'Sport',
    tagline: 'Karbon doku · D-shape kavrama',
    emoji: '🏎️',
    accentHex: '#b91c1c',
    sizeSlug: 'M',
    patternSlug: 'carbon',
    materialSlug: 'leather-real',
  },
  {
    slug: 'luks-elmas-dikis',
    category: 'steering-cover',
    name: 'Lüks',
    tagline: 'Elmas dikiş · alcantara konfor',
    emoji: '👑',
    accentHex: '#c9a86a',
    sizeSlug: 'M',
    patternSlug: 'diamond-stitch',
    materialSlug: 'alcantara',
  },
]

export function getSteeringPresetBySlug(slug: string): SteeringPreset | undefined {
  return STEERING_PRESETS.find((p) => p.slug === slug)
}
