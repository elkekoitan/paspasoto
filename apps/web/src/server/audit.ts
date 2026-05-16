/**
 * audit.ts — Aktivite log (audit trail).
 *
 * Her kritik admin işleminde audit() çağrılır — kim, ne zaman, ne yaptı.
 * /data/audit.json — son 5000 olay saklanır, daha eski olay rotasyonla
 * silinir.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'

export interface AuditEvent {
  id: string
  at: number
  userId?: string
  username?: string
  action: string          // 'order.edit', 'user.password-reset', 'permission.denied', ...
  target?: string         // 'S-1234' (sipariş no), user id, vb.
  details?: Record<string, any>
  ip?: string
}

interface AuditFile {
  events: AuditEvent[]
  meta: { version: number }
}

const DATA_DIR = process.env.DATA_DIR ?? resolve(process.cwd(), '.data')
const FILE = resolve(DATA_DIR, 'audit.json')
const MAX_EVENTS = 5000

function ensure() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(FILE)) {
    writeFileSync(FILE, JSON.stringify({ events: [], meta: { version: 1 } }, null, 2), 'utf8')
  }
}

let _q: Promise<unknown> = Promise.resolve()

function read(): AuditFile {
  ensure()
  try {
    return JSON.parse(readFileSync(FILE, 'utf8')) as AuditFile
  } catch {
    return { events: [], meta: { version: 1 } }
  }
}

function write(db: AuditFile): Promise<void> {
  _q = _q.then(() => {
    const tmp = FILE + '.tmp'
    writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8')
    renameSync(tmp, FILE)
  })
  return _q as Promise<void>
}

function genId() {
  return 'a_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

/** Audit olay ekle. Fail-safe — hata olursa log'a yazar, sessizce devam eder. */
export function audit(input: Omit<AuditEvent, 'id' | 'at'>): void {
  try {
    const db = read()
    const event: AuditEvent = {
      ...input,
      id: genId(),
      at: Date.now(),
    }
    db.events.push(event)
    // Rotasyon — en eski olayları temizle
    if (db.events.length > MAX_EVENTS) {
      db.events = db.events.slice(-MAX_EVENTS)
    }
    // Fire and forget (non-blocking)
    void write(db).catch((e) => console.warn('audit write failed:', e))
  } catch (e) {
    console.warn('audit error:', e)
  }
}

export interface AuditFilter {
  userId?: string
  action?: string
  actionPrefix?: string
  target?: string
  fromTs?: number
  toTs?: number
  limit?: number
}

export function listAudit(filter: AuditFilter = {}): AuditEvent[] {
  let events = read().events.slice().reverse() // en yeni üstte
  if (filter.userId) events = events.filter((e) => e.userId === filter.userId)
  if (filter.action) events = events.filter((e) => e.action === filter.action)
  if (filter.actionPrefix) events = events.filter((e) => e.action.startsWith(filter.actionPrefix!))
  if (filter.target) events = events.filter((e) => e.target === filter.target)
  if (filter.fromTs) events = events.filter((e) => e.at >= filter.fromTs!)
  if (filter.toTs) events = events.filter((e) => e.at <= filter.toTs!)
  if (filter.limit) events = events.slice(0, filter.limit)
  return events
}

/** Kullanılan unique action listesi (filter dropdown için). */
export function listAuditActions(): string[] {
  const set = new Set<string>()
  for (const e of read().events) set.add(e.action)
  return Array.from(set).sort()
}
