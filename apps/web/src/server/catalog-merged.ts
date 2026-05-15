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
import { getAllProductOverrides, listCustomProducts, type ProductOverride } from './content'
import type { CustomProduct } from '../lib/content-types'

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

function customToSimple(cp: CustomProduct): SimpleProduct {
  return {
    id: cp.id,
    slug: cp.slug,
    category: cp.category,
    name: cp.name,
    price: cp.price,
    oldPrice: cp.oldPrice,
    image: cp.image,
    gallery: cp.gallery,
    shortDescription: cp.shortDescription,
    description: cp.description,
    stock: cp.stock,
    sku: cp.sku,
    badges: cp.badges,
    active: cp.active,
  }
}

/** Tüm aktif ürünler (override merged + admin tarafından eklenen custom ürünler). */
export function getMergedProducts(): SimpleProduct[] {
  const overrides = getAllProductOverrides()
  const customs = listCustomProducts().map(customToSimple)
  return [...STATIC_PRODUCTS.map((p) => merge(p, overrides[p.id])), ...customs]
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
