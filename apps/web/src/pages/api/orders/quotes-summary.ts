import type { APIRoute } from 'astro'
import { listOrders } from '../../../server/db'
import { requireAdmin } from '../../../server/auth'

export const prerender = false

/**
 * GET /api/orders/quotes-summary — admin polling için hafif endpoint.
 * Yeni talep/sipariş gelince admin tarafı bildirim göstermesi için kullanılır.
 */
export const GET: APIRoute = async ({ cookies }) => {
  try {
    requireAdmin(cookies)
  } catch (r) {
    return r as Response
  }
  const all = listOrders()
  const quotes = all.filter((o) => o.kind === 'quote' && o.productionStatus === 'received')
  const newOrders = all.filter((o) => (o.kind ?? 'order') === 'order' && o.productionStatus === 'received')
  const last = quotes[0] // listOrders zaten createdAt desc
  return new Response(
    JSON.stringify({
      quotes: quotes.length,
      orders: newOrders.length,
      lastQuoteOrder: last?.orderNo,
      lastQuoteCustomer: last?.customer.fullName,
      ts: Date.now(),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}
