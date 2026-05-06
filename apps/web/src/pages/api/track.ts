import type { APIRoute } from 'astro'
import { getByOrderNoAndPhoneLast4 } from '../../server/db'

export const prerender = false

/**
 * POST /api/track  body: { orderNo, phoneLast4 }
 * Sipariş + telefon son 4 ile public token döner.
 */
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.orderNo !== 'string' || typeof body.phoneLast4 !== 'string') {
    return new Response(JSON.stringify({ error: 'Geçersiz istek' }), { status: 400 })
  }
  const order = getByOrderNoAndPhoneLast4(body.orderNo.trim().toUpperCase(), body.phoneLast4.trim())
  if (!order) {
    return new Response(JSON.stringify({ error: 'Sipariş bulunamadı' }), { status: 404 })
  }
  return new Response(
    JSON.stringify({ token: order.accessToken, orderNo: order.orderNo }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}
