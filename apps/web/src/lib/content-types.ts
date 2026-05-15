/**
 * Content override types — Client + server'da paylaşılır.
 */

export interface ProductOverride {
  name?: string
  shortDescription?: string
  description?: string
  image?: string
  gallery?: string[]
  price?: number
  oldPrice?: number
  stock?: number
  active?: boolean
}

export interface SwatchOverride {
  imageUrl?: string
  label?: string
}

export type SwatchType = 'mat' | 'border' | 'heel' | 'logo' | 'emblem'

/** Admin'in kod dokunmadan eklediği yeni basit ürün. */
export interface CustomProduct {
  id: string                // 'cp-' + timestamp
  slug: string
  category: 'screen-protector' | 'perfume' | 'chemical' | 'bag'
  name: string
  price: number
  oldPrice?: number
  image: string
  gallery?: string[]
  shortDescription: string
  description: string
  stock: number
  sku: string
  badges?: Array<'best-seller' | 'new' | 'discount' | 'limited' | 'premium'>
  active: boolean
  createdAt: number
  updatedAt: number
}

/** Site-level görsel ve metin override'ları (hero, banner vb.). */
export interface SiteContent {
  /** Ana sayfa hero görseli URL. */
  heroImage?: string
  /** Hero başlık override (yoksa default kullanılır). */
  heroTitle?: string
  /** Hero alt başlık override. */
  heroSubtitle?: string
}

export interface ContentDB {
  products: Record<string, ProductOverride>
  customProducts: CustomProduct[]
  swatches: Record<SwatchType, Record<string, SwatchOverride>>
  site?: SiteContent
  meta: { version: number; updatedAt: number }
}
