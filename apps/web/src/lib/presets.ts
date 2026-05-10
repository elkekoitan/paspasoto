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
