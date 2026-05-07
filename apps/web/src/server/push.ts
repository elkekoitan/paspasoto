/**
 * Web Push altyapısı — VAPID + JSON-file subscription store.
 *
 * Aboneler /data/push-subscriptions.json içinde tutulur:
 *  - audience: 'admin' (atölye yönetim) | 'order:<orderNo>' (belirli sipariş için müşteri)
 *
 * server tarafından sendPush(audience, payload) ile bildirim gönderilir.
 *
 * VAPID anahtarları env üzerinden okunur:
 *  - VAPID_PUBLIC_KEY
 *  - VAPID_PRIVATE_KEY
 *  - VAPID_SUBJECT (mailto:atolye@carmat.com gibi)
 *
 * Anahtarlar yoksa sistem sessizce no-op çalışır (loglar veriyor, hata atmıyor).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'
import webpush from 'web-push'

export type PushAudience = 'admin' | `order:${string}`

export type StoredSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
  audience: PushAudience
  createdAt: number
  ua?: string
}

export type PushPayload = {
  title: string
  body: string
  url?: string
  tag?: string
  icon?: string
  badge?: string
  requireInteraction?: boolean
}

const DATA_DIR = process.env.DATA_DIR ?? resolve(process.cwd(), '.data')
const FILE = resolve(DATA_DIR, 'push-subscriptions.json')

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY ?? ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? 'mailto:atolye@carmat.com.tr'

let _vapidConfigured = false
function ensureVapid() {
  if (_vapidConfigured) return true
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.warn('[push] VAPID anahtarları yok — push devre dışı')
    return false
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
  _vapidConfigured = true
  return true
}

function ensureFile() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(FILE)) writeFileSync(FILE, '[]', 'utf8')
}

function loadAll(): StoredSubscription[] {
  ensureFile()
  try {
    return JSON.parse(readFileSync(FILE, 'utf8')) as StoredSubscription[]
  } catch {
    return []
  }
}

let _writeQueue: Promise<unknown> = Promise.resolve()
function saveAll(subs: StoredSubscription[]): Promise<void> {
  _writeQueue = _writeQueue.then(() => {
    const tmp = FILE + '.tmp'
    writeFileSync(tmp, JSON.stringify(subs, null, 2), 'utf8')
    renameSync(tmp, FILE)
  })
  return _writeQueue as Promise<void>
}

export async function addSubscription(sub: Omit<StoredSubscription, 'createdAt'>): Promise<void> {
  const all = loadAll()
  // Endpoint+audience tekilleştir
  const filtered = all.filter((s) => !(s.endpoint === sub.endpoint && s.audience === sub.audience))
  filtered.push({ ...sub, createdAt: Date.now() })
  await saveAll(filtered)
}

export async function removeSubscription(endpoint: string, audience?: PushAudience): Promise<void> {
  const all = loadAll()
  const filtered = audience
    ? all.filter((s) => !(s.endpoint === endpoint && s.audience === audience))
    : all.filter((s) => s.endpoint !== endpoint)
  await saveAll(filtered)
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC
}

/**
 * Belirli audience'a push gönder.
 * Endpoint geçersizse (404/410) subscription'ı sessizce sil.
 */
export async function sendPush(audience: PushAudience, payload: PushPayload): Promise<{ sent: number; removed: number }> {
  if (!ensureVapid()) return { sent: 0, removed: 0 }
  const all = loadAll()
  const targets = all.filter((s) => s.audience === audience)
  if (targets.length === 0) return { sent: 0, removed: 0 }

  let sent = 0
  let removed = 0
  const survivors: StoredSubscription[] = []

  for (const sub of all) {
    if (sub.audience !== audience) {
      survivors.push(sub)
      continue
    }
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify(payload),
        { TTL: 60 * 60 * 24, urgency: 'high' },
      )
      sent += 1
      survivors.push(sub)
    } catch (err: any) {
      const code = err?.statusCode
      if (code === 404 || code === 410) {
        // Subscription expired/invalid — sustur
        removed += 1
      } else {
        // Geçici hata — koru
        console.warn('[push] gönderim hatası:', code, err?.body?.slice?.(0, 200))
        survivors.push(sub)
      }
    }
  }
  await saveAll(survivors)
  return { sent, removed }
}
