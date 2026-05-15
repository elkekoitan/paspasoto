/**
 * POST /api/admin/materials/:id/movement — stok hareketi ekle
 * Body: { type: 'in'|'out'|'adjustment', qty, reason, orderNo? }
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../../server/auth'
import { addMovement } from '../../../../../server/materials'

export const prerender = false

export const POST: APIRoute = async ({ cookies, params, request }) => {
  let auth
  try {
    auth = requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const id = params.id
  if (!id) return new Response('Bad Request', { status: 400 })
  const body = await request.json().catch(() => null)
  if (!body?.type || body.qty == null || !body.reason) {
    return new Response('Bad Request', { status: 400 })
  }
  const updated = await addMovement(id, {
    type: body.type,
    qty: Number(body.qty),
    reason: String(body.reason).slice(0, 200),
    orderNo: body.orderNo ? String(body.orderNo) : undefined,
    by: auth.user.username,
  })
  if (!updated) return new Response('Not Found', { status: 404 })
  return new Response(JSON.stringify(updated), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
