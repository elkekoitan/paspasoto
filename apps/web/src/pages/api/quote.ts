import type { APIRoute } from 'astro'
import { insertOrder, generateOrderNo, generateToken, type Order } from '../../server/db'
import { sendPush } from '../../server/push'
import { sendQuoteReceivedMail, sendAdminNewQuoteMail } from '../../server/mail'

export const prerender = false

/**
 * POST /api/quote — Public endpoint, müşteri konfigüratörden teklif aldığında
 * çağrılır. Sipariş "draft" olarak DB'ye düşer (productionStatus: 'received',
 * paymentStatus: 'bekliyor', internalNote: '[KONFIGÜRATÖR ÖN TALEP]').
 *
 * Admin paneline aynı anda görünür → atölye WhatsApp'tan müşteriyle konuşurken
 * referans alabilir.
 *
 * Rate limit: yok (basit MVP). Gerekirse IP bazlı eklenebilir.
 */
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null)
  if (!body || !body.customer?.fullName || !body.customer?.phone || !body.items?.length) {
    return new Response('Bad Request', { status: 400 })
  }

  const now = Date.now()
  const fullName = String(body.customer.fullName).slice(0, 100)
  const phone = String(body.customer.phone).slice(0, 30)
  const sa = body.shippingAddress || {}
  const order: Order = {
    orderNo: generateOrderNo(),
    accessToken: generateToken(),
    kind: 'quote',
    customer: {
      fullName,
      phone,
      email: body.customer.email ? String(body.customer.email).slice(0, 100) : undefined,
    },
    shippingAddress: {
      fullName: String(sa.fullName ?? fullName).slice(0, 100),
      phone: String(sa.phone ?? phone).slice(0, 30),
      city: String(sa.city ?? 'Belirtilmedi').slice(0, 50),
      district: String(sa.district ?? 'Belirtilmedi').slice(0, 50),
      addressLine: String(sa.addressLine ?? 'WhatsApp üzerinden netleştirilecek').slice(0, 500),
    },
    items: body.items,
    subtotal: Number(body.subtotal) || 0,
    shipping: 0,
    discount: 0,
    total: Number(body.total) || 0,
    paidAmount: 0,
    paymentMethod: 'sonra',
    paymentStatus: 'bekliyor',
    productionStatus: 'received',
    deliveryMethod: 'cargo',
    customerNote: body.customerNote ? String(body.customerNote).slice(0, 500) : undefined,
    internalNote: '[KONFIGÜRATÖR ÖN TALEP] Müşteri siteden konfigüratör üzerinden teklif istedi. WhatsApp ile detayı netleştirin.',
    createdAt: now,
    events: [
      { status: 'received', at: now, note: 'Konfigüratör üzerinden ön talep oluşturuldu', by: 'customer' },
    ],
  }

  await insertOrder(order)

  // Admin'e push bildirim
  const firstItem = order.items[0]
  void sendPush('admin', {
    title: '🔔 Yeni Teklif Talebi',
    body: `${order.customer.fullName} — ${firstItem?.brandName ?? ''} ${firstItem?.modelName ?? ''}`,
    url: '/admin/talepler',
    tag: `quote-${order.orderNo}`,
    requireInteraction: true,
  }).catch(() => {})

  // E-posta — push'tan bağımsız, SMTP_HOST tanımlı değilse "skipped" olur, akışı bozmaz
  const productSummary = `${firstItem?.brandName ?? ''} ${firstItem?.modelName ?? ''} · ${firstItem?.productName ?? ''}`.trim()
  // 1) Müşteriye onay maili (e-posta verdiyse)
  if (order.customer.email) {
    void sendQuoteReceivedMail({
      to: order.customer.email,
      customerName: order.customer.fullName,
      orderNo: order.orderNo,
      total: order.total,
      trackingUrl: `${process.env.PUBLIC_SITE_URL ?? 'https://carmat.com.tr'}/siparis-takip/detay?o=${order.orderNo}&t=${order.accessToken}`,
    }).catch(() => {})
  }
  // 2) Admin'e bildirim maili
  void sendAdminNewQuoteMail({
    orderNo: order.orderNo,
    customerName: order.customer.fullName,
    customerPhone: order.customer.phone,
    productSummary: productSummary || 'Konfigürasyon detayı',
    total: order.total,
  }).catch(() => {})

  return new Response(
    JSON.stringify({ orderNo: order.orderNo, accessToken: order.accessToken }),
    { status: 201, headers: { 'Content-Type': 'application/json' } },
  )
}
