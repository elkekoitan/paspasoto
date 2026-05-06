import type { APIRoute } from 'astro'
import { listOrders, insertOrder, generateOrderNo, generateToken, type Order } from '../../../server/db'
import { requireAdmin } from '../../../server/auth'

export const prerender = false

/** GET /api/orders — admin only, tüm siparişler (en yeni önce). */
export const GET: APIRoute = async ({ cookies }) => {
  try {
    requireAdmin(cookies)
  } catch (r) {
    return r as Response
  }
  return new Response(JSON.stringify(listOrders()), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** POST /api/orders — admin only, yeni sipariş oluştur (KOBİ panelden). */
export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    requireAdmin(cookies)
  } catch (r) {
    return r as Response
  }
  const body = await request.json().catch(() => null)
  if (!body) return new Response('Bad Request', { status: 400 })

  const now = Date.now()
  const order: Order = {
    orderNo: body.orderNo ?? generateOrderNo(),
    accessToken: generateToken(),
    customer: body.customer,
    shippingAddress: body.shippingAddress,
    items: body.items ?? [],
    subtotal: body.subtotal ?? 0,
    shipping: body.shipping ?? 0,
    discount: body.discount ?? 0,
    total: body.total ?? 0,
    paidAmount: body.paidAmount ?? 0,
    paymentMethod: body.paymentMethod ?? 'elden-nakit',
    paymentStatus: body.paymentStatus ?? 'bekliyor',
    paymentInstallments: body.paymentInstallments,
    productionStatus: body.productionStatus ?? 'received',
    customerNote: body.customerNote,
    internalNote: body.internalNote,
    cargoCompany: body.cargoCompany,
    cargoTrackingNo: body.cargoTrackingNo,
    createdAt: now,
    events: [
      {
        status: body.productionStatus ?? 'received',
        at: now,
        note: 'Sipariş atölyemizde oluşturuldu.',
        by: 'admin',
      },
    ],
  }
  await insertOrder(order)
  return new Response(JSON.stringify(order), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
}
