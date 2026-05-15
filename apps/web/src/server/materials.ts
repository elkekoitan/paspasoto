/**
 * Hammadde (materials) datastore — Admin'in atölyedeki EVA rulolarını,
 * iplik makaralarını, vb. takip etmesi için JSON DB.
 *
 * Production: /data/materials.json (Coolify persistent volume)
 * Dev: ./.data/materials.json
 *
 * Konsept:
 *  - Her hammadde tek bir kayıt (örn: "EVA Foam 1cm — Graphite — 50 m²")
 *  - Stok düştükçe admin manuel günceller (gelecekte sipariş üretim sırasında otomatik düşülebilir)
 *  - Hareket geçmişi (movements) ile in/out track edilir
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'
import type { MaterialCategory, MaterialUnit, MaterialItem, MaterialMovement } from '../lib/materials-types'

export type { MaterialCategory, MaterialUnit, MaterialItem, MaterialMovement } from '../lib/materials-types'
export { MATERIAL_CATEGORY_LABELS, MATERIAL_UNIT_LABELS } from '../lib/materials-types'

interface MaterialsDB {
  items: MaterialItem[]
  meta: { version: number; updatedAt: number }
}

const DATA_DIR = process.env.DATA_DIR ?? resolve(process.cwd(), '.data')
const FILE = resolve(DATA_DIR, 'materials.json')

function ensure() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(FILE)) {
    writeFileSync(FILE, JSON.stringify({ items: [], meta: { version: 1, updatedAt: Date.now() } }, null, 2), 'utf8')
  }
}

let _q: Promise<unknown> = Promise.resolve()

function read(): MaterialsDB {
  ensure()
  try {
    return JSON.parse(readFileSync(FILE, 'utf8')) as MaterialsDB
  } catch {
    return { items: [], meta: { version: 1, updatedAt: Date.now() } }
  }
}

function write(db: MaterialsDB): Promise<void> {
  db.meta.updatedAt = Date.now()
  _q = _q.then(() => {
    const tmp = FILE + '.tmp'
    writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8')
    renameSync(tmp, FILE)
  })
  return _q as Promise<void>
}

function genId(): string {
  return 'mat_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

/* -------------------- Public API -------------------- */

export function listMaterials(): MaterialItem[] {
  return read().items.sort((a, b) => b.updatedAt - a.updatedAt)
}

export function listMaterialsByCategory(category: MaterialCategory): MaterialItem[] {
  return listMaterials().filter((m) => m.category === category)
}

export function getMaterial(id: string): MaterialItem | undefined {
  return read().items.find((m) => m.id === id)
}

export async function createMaterial(
  input: Omit<MaterialItem, 'id' | 'createdAt' | 'updatedAt' | 'movements'>,
): Promise<MaterialItem> {
  const db = read()
  const now = Date.now()
  const item: MaterialItem = {
    ...input,
    id: genId(),
    createdAt: now,
    updatedAt: now,
    movements: [
      {
        id: 'mov_' + Date.now().toString(36),
        type: 'in',
        qty: input.quantity,
        reason: 'İlk stok girişi',
        at: now,
        remainingQty: input.quantity,
      },
    ],
  }
  db.items.push(item)
  await write(db)
  return item
}

export async function updateMaterial(id: string, patch: Partial<MaterialItem>): Promise<MaterialItem | null> {
  const db = read()
  const idx = db.items.findIndex((m) => m.id === id)
  if (idx === -1) return null
  db.items[idx] = { ...db.items[idx], ...patch, id, updatedAt: Date.now() }
  await write(db)
  return db.items[idx]
}

export async function deleteMaterial(id: string): Promise<boolean> {
  const db = read()
  const before = db.items.length
  db.items = db.items.filter((m) => m.id !== id)
  if (db.items.length === before) return false
  await write(db)
  return true
}

/** Stok hareketi (in/out/adjustment) ekle. */
export async function addMovement(
  materialId: string,
  movement: Omit<MaterialMovement, 'id' | 'at' | 'remainingQty'>,
): Promise<MaterialItem | null> {
  const db = read()
  const idx = db.items.findIndex((m) => m.id === materialId)
  if (idx === -1) return null
  const item = db.items[idx]
  const delta = movement.type === 'in' ? movement.qty : movement.type === 'out' ? -movement.qty : (movement.qty - item.quantity)
  const newQty = movement.type === 'adjustment' ? movement.qty : item.quantity + delta
  const mov: MaterialMovement = {
    ...movement,
    id: 'mov_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
    at: Date.now(),
    remainingQty: newQty,
  }
  item.quantity = Math.max(0, newQty)
  item.movements = [...(item.movements ?? []), mov]
  item.updatedAt = Date.now()
  await write(db)
  return item
}

/** Düşük stoktaki hammaddeler. */
export function getLowStockMaterials(): MaterialItem[] {
  return listMaterials().filter((m) => m.minThreshold != null && m.quantity <= m.minThreshold)
}
