import type { APIRoute } from 'astro'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, basename } from 'node:path'
import { requireAdmin } from '../../../../server/auth'

export const prerender = false

const DATA_DIR = process.env.DATA_DIR ?? resolve(process.cwd(), '.data')
const PREVIEWS_DIR = resolve(DATA_DIR, 'previews')

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

/**
 * GET /api/admin/preview/[file] — konfigüratör preview screenshot'unu serve eder.
 * Admin-only. Filename traversal'a karşı `basename` ile temizlenir.
 */
export const GET: APIRoute = async ({ cookies, params }) => {
  try {
    requireAdmin(cookies)
  } catch (r) {
    return r as Response
  }

  const raw = String(params.file ?? '')
  const safe = basename(raw)
  if (!/^[\w.-]+\.(png|jpe?g|webp)$/i.test(safe)) {
    return new Response('Bad Request', { status: 400 })
  }
  const filePath = resolve(PREVIEWS_DIR, safe)
  if (!filePath.startsWith(PREVIEWS_DIR) || !existsSync(filePath)) {
    return new Response('Not Found', { status: 404 })
  }
  const ext = safe.split('.').pop()!.toLowerCase()
  const buf = readFileSync(filePath)
  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
