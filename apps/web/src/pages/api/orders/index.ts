import type { APIRoute } from 'astro'
import { listOrders, insertOrder, generateOrderNo, generateToken, type Order } from '../../../server/db'
import { requireAuth, requireRole } from '../../../server/auth'

export const prerender = false

/** GET /api/orders — Patron tümünü, personel sadece kendi siparişlerini görür. */
export const GET: APIRoute = async ({ cookies }) => {
  let auth
  try {
    auth = requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  let result = listOrders()
  // Personel sadece kendi siparişlerini görür
  if (auth.user.role === 'staff') {
    result = result.filter((o) => o.createdBy === auth.user.id)
  }
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** POST /api/orders — Patron VEYA personel kasası, yeni sipariş oluştur. */
export const POST: APIRoute = async ({ cookies, request }) => {
  let auth
  try {
    auth = requireRole(cookies, ['patron', 'staff'])
  } catch (r) {
    return r as Response
  }
  const body = await request.json().catch(() => null)
  if (!body) return new Response('Bad Request', { status: 400 })

  const now = Date.now()
  const order: Order = {
    orderNo: body.orderNo ?? generateOrderNo(),
    accessToken: generateToken(),
    channel: 'physical_store',
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
    deliveryMethod: body.deliveryMethod ?? 'cargo',
    customerNote: body.customerNote,
    internalNote: body.internalNote,
    cargoCompany: body.cargoCompany,
    cargoTrackingNo: body.cargoTrackingNo,
    // Kasada siparişi kesen kullanıcı bilgisi
    createdBy: auth.user.id,
    cashierStaffId: auth.user.id,
    createdAt: now,
    events: [
      {
        status: body.productionStatus ?? 'received',
        at: now,
        note: `Sipariş ${auth.user.displayName} tarafından kasada açıldı.`,
        by: auth.user.username,
      },
    ],
  }
  await insertOrder(order)
  return new Response(JSON.stringify(order), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
}
