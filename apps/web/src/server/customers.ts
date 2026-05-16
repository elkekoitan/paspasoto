/**
 * customers.ts — Müşteri yönetim (siparişlerden runtime aggregate).
 *
 * /data/customers.json YOK; orders.json'dan agregasyon yapılır.
 * /data/customer-notes.json sadece patron notları için.
 *
 * Telefon normalize key: '+90 544 710 81 15' → '905447108115'
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'
import { listOrders, type Order } from './db'

export interface CustomerNote {
  id: string
  by: string
  body: string
  at: number
}

interface NotesFile {
  notes: Record<string, CustomerNote[]> // key: normalized phone
}

const DATA_DIR = process.env.DATA_DIR ?? resolve(process.cwd(), '.data')
const FILE = resolve(DATA_DIR, 'customer-notes.json')

function ensure() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(FILE)) {
    writeFileSync(FILE, JSON.stringify({ notes: {} }, null, 2), 'utf8')
  }
}

let _q: Promise<unknown> = Promise.resolve()

function readNotes(): NotesFile {
  ensure()
  try {
    return JSON.parse(readFileSync(FILE, 'utf8')) as NotesFile
  } catch {
    return { notes: {} }
  }
}

function writeNotes(data: NotesFile): Promise<void> {
  _q = _q.then(() => {
    const tmp = FILE + '.tmp'
    writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
    renameSync(tmp, FILE)
  })
  return _q as Promise<void>
}

/** Telefon normalize: tüm boşluk/parantez/tire kaldır, 0 baş ise 90 yap. */
export function normalizePhone(phone: string): string {
  let p = phone.replace(/\D/g, '')
  if (p.startsWith('0') && p.length === 11) p = '9' + p
  if (p.length === 10 && p.startsWith('5')) p = '90' + p
  return p
}

export type CustomerSegment = 'vip' | 'returning' | 'new' | 'inactive' | 'one-time'

export interface CustomerSummary {
  phoneKey: string
  fullName: string
  phone: string
  email?: string
  orderCount: number
  totalRevenue: number
  paidRevenue: number
  firstOrderAt: number
  lastOrderAt: number
  avgOrderValue: number
  primaryCity?: string
  primaryChannel?: string
  segment: CustomerSegment
  hasNotes: boolean
}

const DAY = 24 * 60 * 60 * 1000

function segmentOf(s: { orderCount: number; totalRevenue: number; firstOrderAt: number; lastOrderAt: number }): CustomerSegment {
  const now = Date.now()
  const since = now - s.lastOrderAt
  if (s.orderCount >= 3 || s.totalRevenue >= 10000) return 'vip'
  if (s.orderCount === 1 && (now - s.firstOrderAt) < 30 * DAY) return 'new'
  if (s.orderCount === 1) return 'one-time'
  if (since > 90 * DAY) return 'inactive'
  return 'returning'
}

/** Tüm müşterileri agregasyon ile listele. */
export function listCustomers(): CustomerSummary[] {
  const notes = readNotes()
  const map = new Map<string, CustomerSummary>()

  for (const o of listOrders()) {
    if ((o.kind ?? 'order') !== 'order') continue
    const key = normalizePhone(o.customer.phone) || `name:${o.customer.fullName.toLowerCase()}`
    const prev = map.get(key)
    if (!prev) {
      map.set(key, {
        phoneKey: key,
        fullName: o.customer.fullName,
        phone: o.customer.phone,
        email: o.customer.email,
        orderCount: 1,
        totalRevenue: o.total,
        paidRevenue: o.paidAmount,
        firstOrderAt: o.createdAt,
        lastOrderAt: o.createdAt,
        avgOrderValue: o.total,
        primaryCity: o.shippingAddress.city,
        primaryChannel: o.channel,
        segment: 'new',
        hasNotes: (notes.notes[key]?.length ?? 0) > 0,
      })
    } else {
      prev.orderCount++
      prev.totalRevenue += o.total
      prev.paidRevenue += o.paidAmount
      prev.firstOrderAt = Math.min(prev.firstOrderAt, o.createdAt)
      prev.lastOrderAt = Math.max(prev.lastOrderAt, o.createdAt)
      // Email/şehir/channel — en yenisi/varsa
      if (!prev.email && o.customer.email) prev.email = o.customer.email
      if (o.createdAt === prev.lastOrderAt) {
        prev.primaryCity = o.shippingAddress.city
        prev.primaryChannel = o.channel
      }
    }
  }

  // Avg + segment hesapla
  for (const c of map.values()) {
    c.avgOrderValue = c.orderCount > 0 ? c.totalRevenue / c.orderCount : 0
    c.segment = segmentOf(c)
  }

  return Array.from(map.values()).sort((a, b) => b.lastOrderAt - a.lastOrderAt)
}

/** Tek müşteri detay: özet + tüm siparişler + notlar. */
export function getCustomerByPhoneKey(phoneKey: string): {
  summary: CustomerSummary | null
  orders: Order[]
  notes: CustomerNote[]
} {
  const summary = listCustomers().find((c) => c.phoneKey === phoneKey) ?? null
  const orders = listOrders().filter((o) => {
    if ((o.kind ?? 'order') !== 'order') return false
    const key = normalizePhone(o.customer.phone) || `name:${o.customer.fullName.toLowerCase()}`
    return key === phoneKey
  }).sort((a, b) => b.createdAt - a.createdAt)
  const notes = readNotes().notes[phoneKey] ?? []
  return { summary, orders, notes }
}

export async function addCustomerNote(phoneKey: string, by: string, body: string): Promise<CustomerNote> {
  const data = readNotes()
  const note: CustomerNote = {
    id: 'cn_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    by,
    body: body.trim(),
    at: Date.now(),
  }
  data.notes[phoneKey] = [...(data.notes[phoneKey] ?? []), note]
  await writeNotes(data)
  return note
}

export async function deleteCustomerNote(phoneKey: string, noteId: string): Promise<boolean> {
  const data = readNotes()
  const arr = data.notes[phoneKey] ?? []
  const next = arr.filter((n) => n.id !== noteId)
  if (next.length === arr.length) return false
  data.notes[phoneKey] = next
  await writeNotes(data)
  return true
}
