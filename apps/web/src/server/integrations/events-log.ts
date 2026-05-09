/**
 * Integration webhook events log.
 *
 * Her gelen webhook (geçerli/geçersiz/duplicate) ring buffer'a yazılır.
 * Admin UI'dan son 50 event görüntülenebilir → debug için kritik.
 *
 * Storage: /data/integration-events.json (rolling 500 entry).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomUUID, createHash } from 'node:crypto'
import type { IntegrationEvent } from './types'

const DATA_DIR = process.env.DATA_DIR ?? resolve(process.cwd(), '.data')
const FILE = resolve(DATA_DIR, 'integration-events.json')
const MAX = 500

function ensure() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(FILE)) writeFileSync(FILE, '[]', 'utf8')
}

let _writeQueue: Promise<unknown> = Promise.resolve()
function atomic(content: string): Promise<void> {
  _writeQueue = _writeQueue.then(() => {
    const tmp = FILE + '.tmp'
    writeFileSync(tmp, content, 'utf8')
    renameSync(tmp, FILE)
  })
  return _writeQueue as Promise<void>
}

export function listEvents(limit = 50): IntegrationEvent[] {
  ensure()
  try {
    const all = JSON.parse(readFileSync(FILE, 'utf8')) as IntegrationEvent[]
    return all.slice(-limit).reverse()
  } catch {
    return []
  }
}

export async function logEvent(input: Omit<IntegrationEvent, 'id' | 'receivedAt'>): Promise<IntegrationEvent> {
  const ev: IntegrationEvent = {
    ...input,
    id: randomUUID(),
    receivedAt: Date.now(),
  }
  ensure()
  let all: IntegrationEvent[] = []
  try {
    all = JSON.parse(readFileSync(FILE, 'utf8')) as IntegrationEvent[]
  } catch {}
  all.push(ev)
  if (all.length > MAX) all = all.slice(-MAX)
  await atomic(JSON.stringify(all, null, 2))
  return ev
}

export function payloadDigest(body: string): string {
  return createHash('sha1').update(body).digest('hex').slice(0, 12)
}
