import type { APIRoute } from 'astro'
import { requireAdmin } from '../../../../server/auth'
import { listOrders } from '../../../../server/integrations/trendyol-api'
import { trendyolAdapter } from '../../../../server/integrations/trendyol'
import {
  insertOrder,
  generateOrderNo,
  generateToken,
  getByExternalRef,
  type Order,
} from '../../../../server/db'
import { logEvent } from '../../../../server/integrations/events-log'

export const prerender = false

/**
 * POST /api/integrations/trendyol/sync
 * Body: { sinceHours?: number }   (default 24)
 *
 * Webhook fallback — son N saatteki Trendyol siparişlerini REST API'den çeker,
 * DB'de olmayanları içeri aktarır. Webhook çalışmadığında veya bir kısmı kaçtığında
 * manuel "yetiştir" butonu olarak kullanılır.
 *
 * Idempotent: externalRef.id zaten varsa o sipariş atlanır.
 */
export const POST: APIRoute = async ({ cookies, request }) => {
  try { requireAdmin(cookies) } catch (r) { return r as Response }

  const body = await request.json().catch(() => ({}))
  const hours = Math.min(Math.max(Number(body?.sinceHours ?? 24), 1), 168)  // 1h–7g
  const startDate = Date.now() - hours * 60 * 60 * 1000

  let imported = 0
  let skipped = 0
  let failed = 0
  const errors: string[] = []

  try {
    let page = 0
    const size = 50
    // Maks 5 sayfa (250 sipariş) — daha fazlası gerekirse tekrar tetikle
    while (page < 5) {
      const { orders, totalCount } = await listOrders({ startDate, page, size })
      if (!orders.length) break

      for (const ty of orders) {
        try {
          // Idempotency
          const existing = getByExternalRef('trendyol', String(ty.orderNumber))
          if (existing) { skipped++; continue }

          // Webhook adapter'ı ile aynı parse mantığını kullan
          const normalized = await trendyolAdapter.parse({
            ...ty,
            customer: {
              firstName: ty.customerFirstName,
              lastName: ty.customerLastName,
              email: ty.customerEmail,
              gsm: ty.shippingAddress?.gsm,
            },
            shipmentAddress: ty.shippingAddress,
            eventType: 'OrderSync',
          })

          const now = Date.now()
          const order: Order = {
            orderNo: generateOrderNo(),
            accessToken: generateToken(),
            kind: 'order',
            channel: 'trendyol',
            externalRef: { platform: 'trendyol', id: normalized.externalId, rawPayload: ty },
            customer: normalized.customer,
            shippingAddress: normalized.shippingAddress,
            items: normalized.items,
            subtotal: normalized.subtotal,
            shipping: normalized.shipping,
            discount: normalized.discount ?? 0,
            total: normalized.total,
            paidAmount: normalized.paidAmount,
            paymentMethod: normalized.paymentMethod,
            paymentStatus: normalized.paymentStatus,
            productionStatus: 'received',
            deliveryMethod: 'cargo',
            customerNote: normalized.customerNote,
            internalNote: normalized.internalNote,
            createdAt: now,
            events: [{
              status: 'received', at: now,
              note: `Trendyol sync · external=${normalized.externalId}`,
              by: 'trendyol-sync',
            }],
          }
          await insertOrder(order)
          await logEvent({
            platform: 'trendyol',
            status: 'success',
            externalId: normalized.externalId,
            orderNo: order.orderNo,
            message: `Sync ile alındı: ${order.orderNo}`,
          })
          imported++
        } catch (e) {
          failed++
          errors.push(`${ty.orderNumber}: ${(e as Error).message}`)
        }
      }

      if (orders.length < size) break  // son sayfa
      page++
      if (orders.length === 0 || imported + skipped + failed >= totalCount) break
    }
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({
    ok: true, imported, skipped, failed,
    errors: errors.slice(0, 10),
    sinceHours: hours,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
