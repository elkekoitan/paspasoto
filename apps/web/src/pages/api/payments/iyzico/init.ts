import type { APIRoute } from 'astro'
import { getByOrderNo, updateOrder } from '../../../../server/db'
import { createCheckoutSession, isIyzicoConfigured } from '../../../../server/payments/iyzico'

export const prerender = false

/**
 * POST /api/payments/iyzico/init
 * Body: { orderNo: string }
 * Response:
 *   200 → { paymentPageUrl, token }
 *   400 → Bad Request
 *   404 → Order Not Found
 *   503 → iyzico not configured (env eksik)
 */
export const POST: APIRoute = async ({ request }) => {
  if (!isIyzicoConfigured()) {
    return new Response(JSON.stringify({ error: 'not_configured', message: 'iyzico API anahtarı yapılandırılmamış' }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.orderNo !== 'string') {
    return new Response(JSON.stringify({ error: 'bad_request' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const order = getByOrderNo(body.orderNo)
  if (!order) {
    return new Response(JSON.stringify({ error: 'order_not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  }

  const result = await createCheckoutSession(order)

  if (result.status === 'ok') {
    // Order'ı işaretle: iyzico session başlatıldı
    try {
      await updateOrder(order.orderNo, { paymentMethod: 'iyzico' })
    } catch {}
    return new Response(JSON.stringify({ paymentPageUrl: result.paymentPageUrl, token: result.token }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }
  if (result.status === 'not_configured') {
    return new Response(JSON.stringify({ error: 'not_configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } })
  }
  return new Response(JSON.stringify({ error: 'iyzico_error', message: result.message }), {
    status: 502, headers: { 'Content-Type': 'application/json' },
  })
}
