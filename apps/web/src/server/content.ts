/**
 * Content overrides datastore — Admin'in ürün açıklamalarını + görsellerini
 * + konfigüratör swatch görsellerini override etmesi için JSON DB.
 *
 * Static catalog-extra.ts kod-sabit; bu dosya RUNTIME'da merge edilen
 * override katmanını sağlar. Admin /admin/icerik üzerinden günceller.
 *
 * Production: /data/content.json (Coolify persistent volume)
 * Dev: ./.data/content.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ProductOverride, SwatchOverride, SwatchType, ContentDB, CustomProduct } from '../lib/content-types'

export type { ProductOverride, SwatchOverride, SwatchType, ContentDB, CustomProduct } from '../lib/content-types'

const DATA_DIR = process.env.DATA_DIR ?? resolve(process.cwd(), '.data')
const FILE = resolve(DATA_DIR, 'content.json')

function emptyDB(): ContentDB {
  return {
    products: {},
    customProducts: [],
    swatches: { mat: {}, border: {}, heel: {}, logo: {}, emblem: {} },
    meta: { version: 1, updatedAt: Date.now() },
  }
}

function ensure() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(FILE)) {
    writeFileSync(FILE, JSON.stringify(emptyDB(), null, 2), 'utf8')
  }
}

let _q: Promise<unknown> = Promise.resolve()

function read(): ContentDB {
  ensure()
  try {
    const raw = JSON.parse(readFileSync(FILE, 'utf8')) as ContentDB
    // legacy uyumluluk — eksik swatch tipleri için boş objeleri ekle
    raw.swatches = { mat: {}, border: {}, heel: {}, logo: {}, emblem: {}, ...raw.swatches }
    raw.products = raw.products ?? {}
    raw.customProducts = raw.customProducts ?? []
    return raw
  } catch {
    return emptyDB()
  }
}

function write(db: ContentDB): Promise<void> {
  db.meta.updatedAt = Date.now()
  _q = _q.then(() => {
    const tmp = FILE + '.tmp'
    writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8')
    renameSync(tmp, FILE)
  })
  return _q as Promise<void>
}

/* -------------------- Public API -------------------- */

/** Tüm override veritabanını döner (admin UI için). */
export function listContent(): ContentDB {
  return read()
}

/** Tek ürün için merged override döner; yoksa undefined. */
export function getProductOverride(productId: string): ProductOverride | undefined {
  return read().products[productId]
}

/** Tüm ürün override haritası. */
export function getAllProductOverrides(): Record<string, ProductOverride> {
  return read().products
}

/** Bir swatch için override (örn: mat color id 'graphite' → imageUrl). */
export function getSwatchOverride(type: SwatchType, id: string): SwatchOverride | undefined {
  return read().swatches[type]?.[id]
}

/** Bir swatch tipinin tüm override'larını döner. */
export function getSwatchOverrides(type: SwatchType): Record<string, SwatchOverride> {
  return read().swatches[type] ?? {}
}

/** Ürün override güncelle (admin). */
export async function setProductOverride(productId: string, patch: ProductOverride): Promise<ProductOverride> {
  const db = read()
  db.products[productId] = { ...db.products[productId], ...patch }
  await write(db)
  return db.products[productId]
}

/** Swatch override güncelle (admin). */
export async function setSwatchOverride(
  type: SwatchType,
  id: string,
  patch: SwatchOverride,
): Promise<SwatchOverride> {
  const db = read()
  db.swatches[type] = db.swatches[type] ?? {}
  db.swatches[type][id] = { ...db.swatches[type][id], ...patch }
  await write(db)
  return db.swatches[type][id]
}

/** Ürün override'ını sıfırla. */
export async function deleteProductOverride(productId: string): Promise<void> {
  const db = read()
  delete db.products[productId]
  await write(db)
}

/** Swatch override sıfırla. */
export async function deleteSwatchOverride(type: SwatchType, id: string): Promise<void> {
  const db = read()
  if (db.swatches[type]) delete db.swatches[type][id]
  await write(db)
}

/* -------------------- Custom Products (admin'in eklediği yeni ürünler) -------------------- */

export function listCustomProducts(): CustomProduct[] {
  return read().customProducts
}

export async function createCustomProduct(
  input: Omit<CustomProduct, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<CustomProduct> {
  const db = read()
  const now = Date.now()
  const product: CustomProduct = {
    ...input,
    id: 'cp-' + now.toString(36) + Math.random().toString(36).slice(2, 5),
    createdAt: now,
    updatedAt: now,
  }
  db.customProducts.push(product)
  await write(db)
  return product
}

export async function updateCustomProduct(id: string, patch: Partial<CustomProduct>): Promise<CustomProduct | null> {
  const db = read()
  const idx = db.customProducts.findIndex((p) => p.id === id)
  if (idx === -1) return null
  db.customProducts[idx] = { ...db.customProducts[idx], ...patch, id, updatedAt: Date.now() }
  await write(db)
  return db.customProducts[idx]
}

export async function deleteCustomProduct(id: string): Promise<boolean> {
  const db = read()
  const before = db.customProducts.length
  db.customProducts = db.customProducts.filter((p) => p.id !== id)
  if (db.customProducts.length === before) return false
  await write(db)
  return true
}
