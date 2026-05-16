/**
 * cash.ts — Kasa yönetim (cash register sessions).
 *
 * Sina Bey dükkan kasasını açar (opening balance), gün boyu satış/gider
 * hareketleri yapar, mesai sonu kapatır (counted balance → fark hesaplanır).
 *
 * /data/cash-sessions.json
 * Bir anda max 1 açık session sistem-genelinde.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'

export type CashMovementType = 'sale' | 'expense' | 'withdrawal' | 'deposit' | 'refund'

export interface CashMovement {
  id: string
  type: CashMovementType
  amount: number
  reason: string
  /** Bağlı sipariş no (sale → order tahsilat) */
  orderNo?: string
  by: string
  at: number
}

export interface CashSession {
  id: string
  openedBy: string
  openedAt: number
  openingBalance: number
  closedBy?: string
  closedAt?: number
  /** Sayım sonucu — kapatma sırasında girilen fiziki tutar */
  countedBalance?: number
  /** Sistemde olan tutar (opening + sale - expense - withdrawal + deposit + refund) */
  expectedBalance?: number
  /** countedBalance - expectedBalance (+ fazla, - eksik) */
  diff?: number
  movements: CashMovement[]
  note?: string
}

interface CashDB {
  sessions: CashSession[]
}

const DATA_DIR = process.env.DATA_DIR ?? resolve(process.cwd(), '.data')
const FILE = resolve(DATA_DIR, 'cash-sessions.json')

function ensure() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(FILE)) {
    writeFileSync(FILE, JSON.stringify({ sessions: [] }, null, 2), 'utf8')
  }
}

let _q: Promise<unknown> = Promise.resolve()

function read(): CashDB {
  ensure()
  try {
    return JSON.parse(readFileSync(FILE, 'utf8')) as CashDB
  } catch {
    return { sessions: [] }
  }
}

function write(db: CashDB): Promise<void> {
  _q = _q.then(() => {
    const tmp = FILE + '.tmp'
    writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8')
    renameSync(tmp, FILE)
  })
  return _q as Promise<void>
}

function genId() {
  return 'cs_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

/** Şu an açık olan session. */
export function getOpenSession(): CashSession | null {
  return read().sessions.find((s) => !s.closedAt) ?? null
}

/** Tüm sessions (en yeni üstte). */
export function listSessions(): CashSession[] {
  return read().sessions.slice().sort((a, b) => b.openedAt - a.openedAt)
}

export function getSession(id: string): CashSession | null {
  return read().sessions.find((s) => s.id === id) ?? null
}

export async function openCashSession(input: { openedBy: string; openingBalance: number; note?: string }): Promise<CashSession> {
  if (getOpenSession()) {
    throw new Error('Zaten açık bir kasa var. Önce mevcut kasayı kapatın.')
  }
  const db = read()
  const session: CashSession = {
    id: genId(),
    openedBy: input.openedBy,
    openedAt: Date.now(),
    openingBalance: input.openingBalance,
    movements: [],
    note: input.note,
  }
  db.sessions.push(session)
  await write(db)
  return session
}

/** Açık kasa için beklenen balans = opening + (sale + deposit + refund) - (expense + withdrawal). */
export function computeExpectedBalance(session: CashSession): number {
  let bal = session.openingBalance
  for (const m of session.movements) {
    if (m.type === 'sale' || m.type === 'deposit' || m.type === 'refund') bal += m.amount
    else if (m.type === 'expense' || m.type === 'withdrawal') bal -= m.amount
  }
  return bal
}

export async function addCashMovement(input: Omit<CashMovement, 'id' | 'at'>): Promise<CashSession | null> {
  const db = read()
  const idx = db.sessions.findIndex((s) => !s.closedAt)
  if (idx < 0) throw new Error('Açık bir kasa yok. Önce kasa açın.')
  const movement: CashMovement = {
    ...input,
    id: 'mv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
    at: Date.now(),
  }
  db.sessions[idx].movements.push(movement)
  await write(db)
  return db.sessions[idx]
}

export async function closeCashSession(input: { closedBy: string; countedBalance: number; note?: string }): Promise<CashSession> {
  const db = read()
  const idx = db.sessions.findIndex((s) => !s.closedAt)
  if (idx < 0) throw new Error('Açık bir kasa yok')
  const s = db.sessions[idx]
  const expected = computeExpectedBalance(s)
  s.closedBy = input.closedBy
  s.closedAt = Date.now()
  s.countedBalance = input.countedBalance
  s.expectedBalance = expected
  s.diff = input.countedBalance - expected
  if (input.note) s.note = (s.note ? s.note + '\n\n' : '') + 'Kapanış notu: ' + input.note
  await write(db)
  return s
}

/**
 * Order'dan otomatik kasa hareketi.
 * Sale (elden-nakit/elden-kart) tahsilat olduğunda çağrılır.
 * Aynı orderNo ile çift kayıt engellenir.
 */
export async function recordOrderSale(input: {
  orderNo: string
  amount: number
  paymentMethod: string
  by: string
}): Promise<CashMovement | null> {
  const open = getOpenSession()
  if (!open) return null // Kasa açık değilse atla
  // Duplicate guard
  const exists = open.movements.find((m) => m.type === 'sale' && m.orderNo === input.orderNo)
  if (exists) return exists
  const mv = await addCashMovement({
    type: 'sale',
    amount: input.amount,
    reason: `Sipariş tahsilat (${input.paymentMethod})`,
    orderNo: input.orderNo,
    by: input.by,
  })
  return mv ? mv.movements[mv.movements.length - 1] : null
}
