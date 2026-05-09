import type { APIRoute } from 'astro'
import {
  insertOrder,
  generateOrderNo,
  generateToken,
  getByExternalRef,
  type Order,
} from '../../../../server/db'
import { trendyolAdapter } from '../../../../server/integrations/trendyol'
import { logEvent, payloadDigest } from '../../../../server/integrations/events-log'
import { sendPush } from '../../../../server/push'

export const prerender = false

/**
 * POST /api/integrations/trendyol/webhook
 *
 * Trendyol Partner Portal → Webhook Yönetimi'nden eklenen endpoint.
 * Olay tipleri: OrderCreated, OrderStatusChanged, OrderPackageCreated.
 *
 * İmza: HMAC-SHA256 (env: TRENDYOL_WEBHOOK_SECRET).
 * Idempotency: orderNumber zaten DB'de varsa duplicate olarak işaretlenir, yeni order açılmaz.
 *
 * Status code'lar:
 *  - 200: Başarılı (yeni order oluşturuldu VEYA duplicate görmezden gelindi)
 *  - 401: İmza geçersiz
 *  - 400: Payload parse edilemiyor
 *  - 500: Beklenmedik hata
 */
export const POST: APIRoute = async ({ request }) => {
  const body = await request.text()
  const digest = payloadDigest(body)
  const secret = process.env.TRENDYOL_WEBHOOK_SECRET ?? ''

  // 1) İmza doğrulama
  const valid = await trendyolAdapter.verify(request, body, secret)
  if (!valid) {
    await logEvent({
      platform: 'trendyol',
      status: 'invalid_signature',
      payloadDigest: digest,
      message: 'HMAC imza doğrulanamadı',
      raw: body.slice(0, 1000),
    })
    return new Response('Unauthorized', { status: 401 })
  }

  // 2) JSON parse
  let payload: any
  try {
    payload = JSON.parse(body)
  } catch (e) {
    await logEvent({
      platform: 'trendyol',
      status: 'parse_error',
      payloadDigest: digest,
      message: 'JSON parse hatası: ' + (e as Error).message,
      raw: body.slice(0, 1000),
    })
    return new Response('Bad JSON', { status: 400 })
  }

  // 3) Normalize
  let normalized
  try {
    normalized = await trendyolAdapter.parse(payload)
  } catch (e) {
    await logEvent({
      platform: 'trendyol',
      status: 'parse_error',
      payloadDigest: digest,
      externalId: payload?.orderNumber,
      message: 'Adapter parse hatası: ' + (e as Error).message,
      raw: body.slice(0, 1000),
    })
    return new Response('Bad payload', { status: 400 })
  }

  // 4) Idempotency — aynı orderNumber zaten varsa skip
  const existing = getByExternalRef('trendyol', normalized.externalId)
  if (existing) {
    await logEvent({
      platform: 'trendyol',
      status: 'duplicate',
      externalId: normalized.externalId,
      orderNo: existing.orderNo,
      payloadDigest: digest,
      message: `Sipariş zaten var: ${existing.orderNo}`,
    })
    return new Response('OK (duplicate)', { status: 200 })
  }

  // 5) Order'a çevir + insert
  const now = Date.now()
  const order: Order = {
    orderNo: generateOrderNo(),
    accessToken: generateToken(),
    kind: 'order',
    channel: 'trendyol',
    externalRef: {
      platform: 'trendyol',
      id: normalized.externalId,
      rawPayload: payload,
    },
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
    events: [
      {
        status: 'received',
        at: now,
        note: `Trendyol webhook · external=${normalized.externalId}`,
        by: 'trendyol-webhook',
      },
    ],
  }

  // Mapping eksik mi kontrol et — admin'e uyar
  const unmapped = order.items.some((i) => i.brandSlug === 'unmapped')

  try {
    await insertOrder(order)
  } catch (e) {
    await logEvent({
      platform: 'trendyol',
      status: 'error',
      externalId: normalized.externalId,
      payloadDigest: digest,
      message: 'DB insert hatası: ' + (e as Error).message,
    })
    return new Response('Server error', { status: 500 })
  }

  await logEvent({
    platform: 'trendyol',
    status: unmapped ? 'unmapped' : 'success',
    externalId: normalized.externalId,
    orderNo: order.orderNo,
    payloadDigest: digest,
    message: unmapped
      ? `Sipariş alındı ama ürün eşleşmesi eksik: ${order.orderNo}`
      : `Sipariş aktarıldı: ${order.orderNo}`,
  })

  // Admin'e push bildirim
  void sendPush('admin', {
    title: unmapped ? '⚠ Trendyol — Eşleşmemiş Ürün' : '🛒 Yeni Trendyol Siparişi',
    body: `${order.customer.fullName} · ${order.items[0]?.productName ?? ''} · ${order.total.toLocaleString('tr-TR')}₺`,
    url: unmapped ? `/admin/entegrasyonlar` : `/admin/orders/${order.orderNo}`,
    tag: `trendyol-${order.orderNo}`,
    requireInteraction: unmapped,
  }).catch(() => {})

  return new Response(JSON.stringify({ ok: true, orderNo: order.orderNo, unmapped }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
