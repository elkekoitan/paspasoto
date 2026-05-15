/**
 * Materials types — Client + server'da paylaşılır. node:fs içermez,
 * browser bundle'a güvenli sızabilir.
 */

export type MaterialCategory =
  | 'eva-foam'
  | 'edge-trim'
  | 'heel-pad'
  | 'logo-leather'
  | 'thread'
  | 'adhesive'
  | 'packaging'
  | 'other'

export type MaterialUnit = 'm2' | 'm' | 'kg' | 'lt' | 'adet' | 'rulo'

export interface MaterialItem {
  id: string
  category: MaterialCategory
  name: string
  color?: string
  unit: MaterialUnit
  quantity: number
  minThreshold?: number
  supplier?: string
  supplierContact?: string
  costPerUnit?: number
  lastPurchaseAt?: number
  note?: string
  createdAt: number
  updatedAt: number
  movements?: MaterialMovement[]
}

export interface MaterialMovement {
  id: string
  type: 'in' | 'out' | 'adjustment'
  qty: number
  reason: string
  orderNo?: string
  by?: string
  at: number
  remainingQty?: number
}

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  'eva-foam': 'EVA Foam (Zemin)',
  'edge-trim': 'Kenarlık Şeridi',
  'heel-pad': 'Topukluk Malzemesi',
  'logo-leather': 'Logo Deri / Plaka',
  thread: 'İplik / Dikiş',
  adhesive: 'Yapıştırıcı',
  packaging: 'Ambalaj',
  other: 'Diğer',
}

export const MATERIAL_UNIT_LABELS: Record<MaterialUnit, string> = {
  m2: 'm²',
  m: 'metre',
  kg: 'kg',
  lt: 'litre',
  adet: 'adet',
  rulo: 'rulo',
}
