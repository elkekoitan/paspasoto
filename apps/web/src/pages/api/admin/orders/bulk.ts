/**
 * POST /api/admin/orders/bulk
 *
 * Body: { orderNos: string[], action: 'mark-production' | 'mark-ready' | 'mark-delivered' | 'cancel' | 'shipping' }
 *
 * Toplu sipariş işlemi. Staff kendi siparişlerinde tüm action'ları uygulayabilir;
 * delete/cancel sadece patron'a açık.
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../server/auth'
import { getByOrderNo, updateOrder, type OrderStatus } from '../../../../server/db'
import { getShippingAdapter } from '../../../../server/shipping'

export const prerender = false

type Action = 'mark-production' | 'mark-ready' | 'mark-delivered' | 'cancel' | 'shipping'

const ACTION_STATUS: Partial<Record<Action, OrderStatus>> = {
  'mark-production': 'in_production',
  'mark-ready': 'ready',
  'mark-delivered': 'delivered',
  'cancel': 'cancelled',
}

const ACTION_NOTE: Record<Action, string> = {
  'mark-production': 'Toplu üretime al',
  'mark-ready': 'Toplu hazır işaretle',
  'mark-delivered': 'Toplu teslim edildi',
  'cancel': 'Toplu iptal',
  'shipping': 'Toplu kargo barkodu oluştur',
}

export const POST: APIRoute = async ({ cookies, request }) => {
  let auth
  try {
    auth = requireAuth(cookies)
  } catch (r) {
    return r as Response
  }

  const body = await request.json().catch(() => null)
  if (!body || !Array.isArray(body.orderNos) || body.orderNos.length === 0 || !body.action) {
    return new Response(JSON.stringify({ error: 'bad_request' }), { status: 400 })
  }

  const action = body.action as Action
  if (action === 'cancel' && auth.user.role !== 'patron') {
    return new Response(JSON.stringify({ error: 'patron_only' }), { status: 403 })
  }

  const orderNos = (body.orderNos as string[]).slice(0, 100) // güvenlik tavanı
  const results: Array<{ orderNo: string; ok: boolean; message?: string; data?: any }> = []

  for (const orderNo of orderNos) {
    const order = getByOrderNo(orderNo)
    if (!order) {
      results.push({ orderNo, ok: false, message: 'order_not_found' })
      continue
    }
    // Staff sadece kendi siparişine işlem yapabilir
    if (auth.user.role === 'staff' && order.createdBy !== auth.user.id) {
      results.push({ orderNo, ok: false, message: 'forbidden' })
      continue
    }

    try {
      if (action === 'shipping') {
        const adapter = getShippingAdapter()
        if (!adapter.isConfigured()) {
          results.push({ orderNo, ok: false, message: 'shipping_not_configured' })
          continue
        }
        if (order.cargoTrackingNo) {
          results.push({ orderNo, ok: false, message: 'already_shipped' })
          continue
        }
        const weight = order.items[0]?.productSlug === 'bagaj-only' ? 0.8 : 2.5
        const result = await adapter.createShipment({
          order,
          packageInfo: {
            weight,
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
            { status: 'ready', at: Date.now(), note: `${adapter.provider} kargo (toplu): ${result.trackingNumber}`, by: auth.user.username },
          )
          results.push({ orderNo, ok: true, data: { trackingNumber: result.trackingNumber, provider: adapter.provider } })
        } else {
          results.push({ orderNo, ok: false, message: result.status })
        }
        continue
      }

      const status = ACTION_STATUS[action]
      if (!status) {
        results.push({ orderNo, ok: false, message: 'unknown_action' })
        continue
      }
      await updateOrder(
        order.orderNo,
        { productionStatus: status },
        { status, at: Date.now(), note: ACTION_NOTE[action], by: auth.user.username },
      )
      results.push({ orderNo, ok: true })
    } catch (e: any) {
      results.push({ orderNo, ok: false, message: e?.message ?? 'error' })
    }
  }

  const summary = {
    total: results.length,
    success: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
  }

  return new Response(
    JSON.stringify({ ok: true, summary, results }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}
