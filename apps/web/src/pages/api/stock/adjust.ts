import type { APIRoute } from 'astro'
import { applyMovement, getStockBySku, upsertStock, type StockMovementReason } from '../../../server/stock'
import { requireAdmin } from '../../../server/auth'

export const prerender = false

/**
 * POST /api/stock/adjust
 * Body: { sku, delta?, setQty?, reason, note? }
 *
 * - delta verilirse: mevcut qty'ye +/- ekler (mal alımı, fire vs.)
 * - setQty verilirse: yeni qty'ye eşitler (sayım modu) — delta otomatik hesaplanır
 */
export const POST: APIRoute = async ({ cookies, request }) => {
  try { requireAdmin(cookies) } catch (r) { return r as Response }
  const body = await request.json().catch(() => null)
  if (!body?.sku || !body?.reason) return new Response('Bad request', { status: 400 })
  const item = getStockBySku(body.sku)
  if (!item) return new Response('SKU not found', { status: 404 })

  let delta: number
  if (typeof body.setQty === 'number') {
    delta = body.setQty - item.qty
  } else if (typeof body.delta === 'number') {
    delta = body.delta
  } else {
    return new Response('delta veya setQty gerekli', { status: 400 })
  }
  if (delta === 0) {
    return new Response(JSON.stringify({ noop: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  const movement = await applyMovement({
    sku: body.sku,
    delta,
    reason: body.reason as StockMovementReason,
    actor: 'admin',
    note: body.note ? String(body.note).slice(0, 200) : undefined,
  })
  const updated = getStockBySku(body.sku)
  return new Response(JSON.stringify({ movement, item: updated }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
