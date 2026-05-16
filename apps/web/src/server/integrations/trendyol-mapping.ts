/**
 * Trendyol (ve diğer marketplace) product code ↔ Carmat configuration mapping.
 *
 * Storage: /data/integration-mappings.json (admin UI ile yönetilir)
 * Eşleşme bulunmazsa adapter generic placeholder kullanır,
 * admin /admin/entegrasyonlar/eslestirme sayfasından elle eşler.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'
import type { OrderItem, Channel } from '../db'

export type ProductMappingPlatform = 'trendyol' | 'hepsiburada' | 'n11' | 'shopify' | 'woocommerce'

export interface StoredMapping {
  id: string
  platform: ProductMappingPlatform
  externalCode: string
  /** Carmat configuration */
  brandSlug: string
  brandName: string
  modelSlug?: string
  modelName?: string
  modelChassis?: string
  productSlug: '4lu-set' | '5li-set' | 'bagaj-only'
  productName: string
  productParts: number
  matSlug: string
  matName: string
  borderSlug: string
  borderName: string
  heelSlug: string
  heelName: string
  hasLogo: boolean
  logoBrandSlug?: string
  defaultPrice?: number
  createdAt: number
  updatedAt: number
}

interface MappingsFile {
  mappings: StoredMapping[]
}

const DATA_DIR = process.env.DATA_DIR ?? resolve(process.cwd(), '.data')
const FILE = resolve(DATA_DIR, 'integration-mappings.json')

function ensure() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(FILE)) {
    writeFileSync(FILE, JSON.stringify({ mappings: [] }, null, 2), 'utf8')
  }
}

let _q: Promise<unknown> = Promise.resolve()

function read(): MappingsFile {
  ensure()
  try {
    return JSON.parse(readFileSync(FILE, 'utf8')) as MappingsFile
  } catch {
    return { mappings: [] }
  }
}

function write(db: MappingsFile): Promise<void> {
  _q = _q.then(() => {
    const tmp = FILE + '.tmp'
    writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8')
    renameSync(tmp, FILE)
  })
  return _q as Promise<void>
}

function genId() {
  return 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

/** Webhook'tan gelen line item için mapping ara */
export function getMappingByExternalCode(platform: ProductMappingPlatform, code: string): StoredMapping | undefined {
  return read().mappings.find((m) => m.platform === platform && m.externalCode === code)
}

export function listMappings(platform?: ProductMappingPlatform): StoredMapping[] {
  const all = read().mappings
  return platform ? all.filter((m) => m.platform === platform) : all
}

export async function createMapping(input: Omit<StoredMapping, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoredMapping> {
  const db = read()
  const now = Date.now()
  const mapping: StoredMapping = {
    ...input,
    id: genId(),
    createdAt: now,
    updatedAt: now,
  }
  db.mappings.push(mapping)
  await write(db)
  return mapping
}

export async function updateMapping(id: string, patch: Partial<StoredMapping>): Promise<StoredMapping | null> {
  const db = read()
  const idx = db.mappings.findIndex((m) => m.id === id)
  if (idx < 0) return null
  db.mappings[idx] = { ...db.mappings[idx], ...patch, id, updatedAt: Date.now() }
  await write(db)
  return db.mappings[idx]
}

export async function deleteMapping(id: string): Promise<boolean> {
  const db = read()
  const before = db.mappings.length
  db.mappings = db.mappings.filter((m) => m.id !== id)
  if (db.mappings.length === before) return false
  await write(db)
  return true
}

/**
 * Mapping'i Trendyol/HB webhook line item OrderItem'a dönüştür.
 * line: { productCode, barcode, quantity, price, ... }
 */
export function mappingToOrderItem(mapping: StoredMapping, line: any): OrderItem {
  return {
    category: 'mat',
    brandSlug: mapping.brandSlug,
    brandName: mapping.brandName,
    modelSlug: mapping.modelSlug ?? 'generic',
    modelName: mapping.modelName ?? '—',
    modelChassis: mapping.modelChassis ?? '-',
    productSlug: mapping.productSlug,
    productName: mapping.productName,
    productParts: mapping.productParts,
    matSlug: mapping.matSlug,
    matName: mapping.matName,
    matSwatchUrl: `/assets/swatches/mat-${mapping.matSlug}.webp`,
    borderSlug: mapping.borderSlug,
    borderName: mapping.borderName,
    borderSwatchUrl: `/assets/swatches/border-${mapping.borderSlug}.webp`,
    heelSlug: mapping.heelSlug,
    heelName: mapping.heelName,
    heelSwatchUrl: `/assets/heel-pads/heel-${mapping.heelSlug}.webp`,
    heelPadPassenger: false,
    logoBrandSlug: mapping.hasLogo ? (mapping.logoBrandSlug ?? mapping.brandSlug) : null,
    logoQty: mapping.hasLogo ? mapping.productParts : 0,
    qty: Number(line?.quantity ?? 1),
    unitPrice: Number(line?.price ?? mapping.defaultPrice ?? 1990),
  } as unknown as OrderItem
}
