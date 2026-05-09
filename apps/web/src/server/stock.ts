/**
 * Hammadde / Stok modülü.
 *
 * /data/stock.json            — SKU bazlı current state (veri kaybı olmasın diye atomik write)
 * /data/stock-movements.json  — append-only hareket geçmişi (rolling 5000)
 *
 * Sipariş `in_production` durumuna geçince stock-recipes.ts'deki formüllerle
 * otomatik tüketim yapılır. İdempotency: aynı orderNo + reason='order_consume'
 * kombinasyonu daha önce kaydedildiyse tekrar düşürmez.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

export type StockKind =
  | 'mat_base'        // paspas tabanı (rulo m)
  | 'border_trim'     // kenarlık biyesi (kg)
  | 'heel_pad'        // topukluk pedi (adet)
  | 'logo_plate'      // marka amblemi plakası (adet)
  | 'seat_fabric'     // koltuk kumaşı (m)
  | 'steering_grip'   // direksiyon kılıfı (adet)
  | 'packaging'       // kutu / naylon / köpük (adet)
  | 'thread'          // dikiş ipliği (kg)

export type StockUnit = 'meter' | 'kg' | 'piece'

export type StockItem = {
  sku: string                    // "MAT_BASE_BLACK", "LOGO_BMW", "BORDER_RED"
  kind: StockKind
  label: string                  // "Siyah paspas tabanı"
  unit: StockUnit
  qty: number
  criticalThreshold: number
  reorderQty?: number            // tavsiye edilen sipariş miktarı
  supplierNote?: string
  lastUpdated: number
}

export type StockMovementReason =
  | 'order_consume'   // sipariş üretime girince otomatik
  | 'manual_in'       // mal alımı
  | 'manual_out'      // manuel çıkış (fire/iade vs.)
  | 'fire'            // fire/atık
  | 'count_fix'       // sayım düzeltme

export type StockMovement = {
  id: string
  sku: string
  delta: number                  // negatif=tüketim, pozitif=mal alımı
  reason: StockMovementReason
  orderNo?: string
  actor: string                  // 'admin' | 'system'
  note?: string
  at: number
}

const DATA_DIR = process.env.DATA_DIR ?? resolve(process.cwd(), '.data')
const STOCK_FILE = resolve(DATA_DIR, 'stock.json')
const MOVEMENTS_FILE = resolve(DATA_DIR, 'stock-movements.json')
const MAX_MOVEMENTS = 5000

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
}

function ensureFile(path: string, fallback: string) {
  ensureDir()
  if (!existsSync(path)) writeFileSync(path, fallback, 'utf8')
}

let _writeQueue: Promise<unknown> = Promise.resolve()
function atomicWrite(path: string, content: string): Promise<void> {
  _writeQueue = _writeQueue.then(() => {
    const tmp = path + '.tmp'
    writeFileSync(tmp, content, 'utf8')
    renameSync(tmp, path)
  })
  return _writeQueue as Promise<void>
}

/* ---------------- Stock items ---------------- */

export function listStock(): StockItem[] {
  ensureFile(STOCK_FILE, '[]')
  try {
    return JSON.parse(readFileSync(STOCK_FILE, 'utf8')) as StockItem[]
  } catch {
    return []
  }
}

export function getStockBySku(sku: string): StockItem | undefined {
  return listStock().find((s) => s.sku === sku)
}

export async function upsertStock(item: StockItem): Promise<void> {
  const all = listStock()
  const idx = all.findIndex((s) => s.sku === item.sku)
  if (idx === -1) all.push(item)
  else all[idx] = item
  await atomicWrite(STOCK_FILE, JSON.stringify(all, null, 2))
}

export async function setStockQty(sku: string, qty: number): Promise<void> {
  const all = listStock()
  const idx = all.findIndex((s) => s.sku === sku)
  if (idx === -1) return
  all[idx]!.qty = qty
  all[idx]!.lastUpdated = Date.now()
  await atomicWrite(STOCK_FILE, JSON.stringify(all, null, 2))
}

/* ---------------- Movements ---------------- */

export function listMovements(filter?: { sku?: string; orderNo?: string }): StockMovement[] {
  ensureFile(MOVEMENTS_FILE, '[]')
  try {
    let list = JSON.parse(readFileSync(MOVEMENTS_FILE, 'utf8')) as StockMovement[]
    if (filter?.sku) list = list.filter((m) => m.sku === filter.sku)
    if (filter?.orderNo) list = list.filter((m) => m.orderNo === filter.orderNo)
    return list.sort((a, b) => b.at - a.at)
  } catch {
    return []
  }
}

async function appendMovement(m: StockMovement): Promise<void> {
  const all = listMovements()
  all.push(m)
  // Rolling buffer
  const trimmed = all.length > MAX_MOVEMENTS ? all.slice(-MAX_MOVEMENTS) : all
  await atomicWrite(MOVEMENTS_FILE, JSON.stringify(trimmed, null, 2))
}

/**
 * Bir SKU'ya stok hareketi uygular. Hem `stock.json` qty'sini günceller
 * hem `stock-movements.json`'a append eder.
 */
export async function applyMovement(input: Omit<StockMovement, 'id' | 'at'>): Promise<StockMovement> {
  const movement: StockMovement = {
    ...input,
    id: randomUUID(),
    at: Date.now(),
  }
  const item = getStockBySku(input.sku)
  if (item) {
    await setStockQty(input.sku, item.qty + input.delta)
  }
  await appendMovement(movement)
  return movement
}

/**
 * İdempotency: bir orderNo + reason='order_consume' kombinasyonu
 * daha önce kaydedildi mi?
 */
export function hasOrderConsumed(orderNo: string): boolean {
  return listMovements({ orderNo }).some((m) => m.reason === 'order_consume')
}

/**
 * Kritik altı SKU'lar (push trigger için).
 */
export function getCriticalItems(): StockItem[] {
  return listStock().filter((s) => s.qty <= s.criticalThreshold)
}
