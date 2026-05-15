/**
 * catalog-merged.ts — Static catalog (catalog-extra.ts) + Runtime override
 * (content.ts) birleşimi.
 *
 * Bu modül SADECE server tarafında kullanılır (Astro frontmatter, API route,
 * SSR sayfa). Client component'lerine zaten merge edilmiş data prop olarak
 * geçer, böylece browser bundle'a content.ts (node:fs) sızmaz.
 */
import {
  ALL_SIMPLE_PRODUCTS as STATIC_PRODUCTS,
  type SimpleProduct,
  type SimpleCategory,
} from '../lib/catalog-extra'
import { getAllProductOverrides, type ProductOverride } from './content'

function merge(p: SimpleProduct, o?: ProductOverride): SimpleProduct {
  if (!o) return p
  return {
    ...p,
    ...(o.name !== undefined ? { name: o.name } : {}),
    ...(o.shortDescription !== undefined ? { shortDescription: o.shortDescription } : {}),
    ...(o.description !== undefined ? { description: o.description } : {}),
    ...(o.image !== undefined ? { image: o.image } : {}),
    ...(o.gallery !== undefined ? { gallery: o.gallery } : {}),
    ...(o.price !== undefined ? { price: o.price } : {}),
    ...(o.oldPrice !== undefined ? { oldPrice: o.oldPrice } : {}),
    ...(o.stock !== undefined ? { stock: o.stock } : {}),
    ...(o.active !== undefined ? { active: o.active } : {}),
  }
}

/** Tüm aktif ürünler (override merged). */
export function getMergedProducts(): SimpleProduct[] {
  const overrides = getAllProductOverrides()
  return STATIC_PRODUCTS.map((p) => merge(p, overrides[p.id]))
}

export function getMergedProductsByCategory(category: SimpleCategory): SimpleProduct[] {
  return getMergedProducts().filter((p) => p.category === category && p.active)
}

export function getMergedProductBySlug(slug: string): SimpleProduct | null {
  return getMergedProducts().find((p) => p.slug === slug && p.active) ?? null
}

export function getMergedProductById(id: string): SimpleProduct | null {
  return getMergedProducts().find((p) => p.id === id) ?? null
}
