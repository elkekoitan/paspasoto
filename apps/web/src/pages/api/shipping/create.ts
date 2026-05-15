/**
 * POST /api/shipping/create
 *
 * Admin-only — sipariş için kargo barkodu oluşturur, tracking no alır,
 * Order'a yazar (cargoCompany + cargoTrackingNo + event log).
 *
 * Body: { orderNo: string, weight?: number, desi?: number }
 * Response: { trackingNumber, barcodeUrl?, provider, cost? }
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../server/auth'
import { getByOrderNo, updateOrder } from '../../../server/db'
import { getShippingAdapter } from '../../../server/shipping'

export const prerender = false

export const POST: APIRoute = async ({ cookies, request }) => {
  let auth
  try {
    auth = requireAuth(cookies)
  } catch (r) {
    return r as Response
  }

  const body = await request.json().catch(() => null)
  if (!body?.orderNo) {
    return new Response(JSON.stringify({ error: 'bad_request' }), { status: 400 })
  }

  const order = getByOrderNo(body.orderNo)
  if (!order) {
    return new Response(JSON.stringify({ error: 'order_not_found' }), { status: 404 })
  }

  // Staff sadece kendi siparişine kargo oluşturabilir
  if (auth.user.role === 'staff' && order.createdBy !== auth.user.id) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
  }

  const adapter = getShippingAdapter()
  if (!adapter.isConfigured()) {
    return new Response(JSON.stringify({ error: 'not_configured', provider: adapter.provider }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    })
  }

  // Paspas seti ortalama 2.5 kg (5'li set). Bagaj-only ~0.8 kg
  const defaultWeight = order.items[0]?.productSlug === 'bagaj-only' ? 0.8 : 2.5
  const result = await adapter.createShipment({
    order,
    packageInfo: {
      weight: body.weight ?? defaultWeight,
      desi: body.desi,
      description: `${order.items[0]?.brandName ?? ''} ${order.items[0]?.productName ?? 'Carmat sipariş'}`.trim(),
    },
  })

  if (result.status === 'ok') {
    await updateOrder(
      order.orderNo,
      {
        cargoCompany: adapter.provider as any,
        cargoTrackingNo: result.trackingNumber,
        shippedAt: Date.now(),
        productionStatus: 'ready',
      },
      {
        status: 'ready',
        at: Date.now(),
        note: `${adapter.provider} kargo oluşturuldu: ${result.trackingNumber}`,
        by: auth.user.username,
      },
    )
    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify(result), { status: 502, headers: { 'Content-Type': 'application/json' } })
}
