/**
 * POST   /api/orders/:orderNo/notes   — yeni not ekle (admin)
 * DELETE /api/orders/:orderNo/notes?id={noteId} — not sil (admin)
 *
 * Body (POST): { kind: 'internal' | 'customer-visible', body: string }
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../server/auth'
import { getByOrderNo, updateOrder } from '../../../../server/db'

export const prerender = false

function genId() {
  return 'note_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export const POST: APIRoute = async ({ cookies, params, request }) => {
  let auth
  try {
    auth = requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const orderNo = params.orderNo!
  const order = getByOrderNo(orderNo)
  if (!order) return new Response('Not Found', { status: 404 })
  if (auth.user.role === 'staff' && order.createdBy !== auth.user.id) {
    return new Response('Forbidden', { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const kind = body?.kind === 'customer-visible' ? 'customer-visible' : 'internal'
  const bodyText = String(body?.body ?? '').trim().slice(0, 1000)
  if (!bodyText) return new Response(JSON.stringify({ error: 'empty' }), { status: 400 })

  const note = {
    id: genId(),
    kind: kind as 'internal' | 'customer-visible',
    body: bodyText,
    by: auth.user.username,
    at: Date.now(),
  }
  const next = [...(order.notes ?? []), note]
  await updateOrder(orderNo, { notes: next })
  return new Response(JSON.stringify(note), { status: 201, headers: { 'Content-Type': 'application/json' } })
}

export const DELETE: APIRoute = async ({ cookies, params, url }) => {
  let auth
  try {
    auth = requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const orderNo = params.orderNo!
  const noteId = url.searchParams.get('id')
  if (!noteId) return new Response('Bad Request', { status: 400 })

  const order = getByOrderNo(orderNo)
  if (!order) return new Response('Not Found', { status: 404 })
  if (auth.user.role === 'staff' && order.createdBy !== auth.user.id) {
    return new Response('Forbidden', { status: 403 })
  }
  const next = (order.notes ?? []).filter((n) => n.id !== noteId)
  await updateOrder(orderNo, { notes: next })
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
