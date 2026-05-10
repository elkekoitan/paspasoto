/**
 * Konfigüratör Preset Paketleri.
 *
 * Choice overload'u kıran "Hızlı Tasarla" özelliği — UX research raporundan.
 * Müşteri tek tıkla mat+border+heel+logo paketini uygular, gerekirse sonra
 * incelikli özelleştirir.
 *
 * 3 paket: Klasik (sade), Spor (canlı), Lüks (premium).
 */

import type { LogoOrientation, LogoPlacement } from '../server/db'

export type ConfigPreset = {
  slug: string
  name: string
  tagline: string
  emoji: string
  /** Hero/CTA için brand color hex (gradient bg) */
  accentHex: string
  matSlug: string
  borderSlug: string
  heelSlug: string
  /** 'auto' = seçilen markanın ambleminden, null = logo yok */
  logoMode: 'auto' | 'none'
  logoPlacement?: LogoPlacement
  logoOrientation?: LogoOrientation
}

export const PRESETS: ConfigPreset[] = [
  {
    slug: 'klasik',
    name: 'Klasik',
    tagline: 'Sade, kaliteli, her aracına uyar',
    emoji: '🏛️',
    accentHex: '#1a1a22',
    matSlug: 'siyah',
    borderSlug: 'siyah',
    heelSlug: 'standart',
    logoMode: 'none',
  },
  {
    slug: 'spor',
    name: 'Spor',
    tagline: 'Karbon doku + kırmızı detay + amblem',
    emoji: '🏎️',
    accentHex: '#b91c1c',
    matSlug: 'siyah',
    borderSlug: 'kirmizi',
    heelSlug: 'antrasit-karbon',
    logoMode: 'auto',
    logoPlacement: 'top-center',
    logoOrientation: 'horizontal',
  },
  {
    slug: 'luks',
    name: 'Lüks',
    tagline: 'Bej zemin + kahve kenarlık + krem topukluk',
    emoji: '👑',
    accentHex: '#a78a4d',
    matSlug: 'bej',
    borderSlug: 'kahve',
    heelSlug: 'krem-noktali',
    logoMode: 'auto',
    logoPlacement: 'top-center',
    logoOrientation: 'horizontal',
  },
]

export function getPresetBySlug(slug: string): ConfigPreset | undefined {
  return PRESETS.find((p) => p.slug === slug)
}

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
