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

export interface ContentDB {
  products: Record<string, ProductOverride>
  swatches: Record<SwatchType, Record<string, SwatchOverride>>
  meta: { version: number; updatedAt: number }
}
