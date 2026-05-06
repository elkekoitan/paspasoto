import type { APIRoute } from 'astro'
import { getByOrderNo, updateOrder, deleteOrder, type OrderStatus, type PaymentStatus } from '../../../server/db'
import { requireAdmin } from '../../../server/auth'

export const prerender = false

/** GET /api/orders/[orderNo] — admin only, tek sipariş. */
export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    requireAdmin(cookies)
  } catch (r) {
    return r as Response
  }
  const orderNo = params.orderNo!
  const o = getByOrderNo(orderNo)
  if (!o) return new Response('Not Found', { status: 404 })
  return new Response(JSON.stringify(o), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** PATCH /api/orders/[orderNo] — admin only, durum güncelleme + event ekleme. */
export const PATCH: APIRoute = async ({ params, cookies, request }) => {
  try {
    requireAdmin(cookies)
  } catch (r) {
    return r as Response
  }
  const orderNo = params.orderNo!
  const patch = await request.json().catch(() => ({}))
  const now = Date.now()

  // Status değişiyorsa otomatik event üret
  let event = patch.event
  if (patch.productionStatus && !event) {
    event = {
      status: patch.productionStatus as OrderStatus,
      at: now,
      by: 'admin',
    }
    if (patch.productionStatus === 'shipped') patch.shippedAt = now
    if (patch.productionStatus === 'delivered') patch.deliveredAt = now
  }
  if (patch.paymentStatus === 'tamamlandi' && !patch.paidAt) {
    patch.paidAt = now
  }

  const updated = await updateOrder(orderNo, patch, event)
  if (!updated) return new Response('Not Found', { status: 404 })
  return new Response(JSON.stringify(updated), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** DELETE /api/orders/[orderNo] — admin only. */
export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    requireAdmin(cookies)
  } catch (r) {
    return r as Response
  }
  const ok = await deleteOrder(params.orderNo!)
  if (!ok) return new Response('Not Found', { status: 404 })
  return new Response(null, { status: 204 })
}
