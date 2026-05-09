import type { APIRoute } from 'astro'
import {
  insertOrder,
  generateOrderNo,
  generateToken,
  getByExternalRef,
  type Order,
} from '../../../../server/db'
import { hepsiburadaAdapter } from '../../../../server/integrations/hepsiburada'
import { logEvent, payloadDigest } from '../../../../server/integrations/events-log'
import { sendPush } from '../../../../server/push'
import { sendMail } from '../../../../server/mail'

export const prerender = false

/**
 * POST /api/integrations/hepsiburada/webhook
 *
 * Hepsiburada Satıcı Paneli → Webhook Yönetimi'nden eklenen endpoint.
 * Trendyol webhook ile aynı mantık — sadece adapter farklı.
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
  const secret = process.env.HEPSIBURADA_WEBHOOK_SECRET ?? ''

  // 1) İmza doğrulama
  const valid = await hepsiburadaAdapter.verify(request, body, secret)
  if (!valid) {
    await logEvent({
      platform: 'hepsiburada',
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
      platform: 'hepsiburada',
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
    normalized = await hepsiburadaAdapter.parse(payload)
  } catch (e) {
    await logEvent({
      platform: 'hepsiburada',
      status: 'parse_error',
      payloadDigest: digest,
      externalId: payload?.orderNumber,
      message: 'Adapter parse hatası: ' + (e as Error).message,
      raw: body.slice(0, 1000),
    })
    return new Response('Bad payload', { status: 400 })
  }

  // 4) Idempotency
  const existing = getByExternalRef('hepsiburada', normalized.externalId)
  if (existing) {
    await logEvent({
      platform: 'hepsiburada',
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
    channel: 'hepsiburada',
    externalRef: {
      platform: 'hepsiburada',
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
        note: `Hepsiburada webhook · external=${normalized.externalId}`,
        by: 'hepsiburada-webhook',
      },
    ],
  }

  const unmapped = order.items.some((i) => i.brandSlug === 'unmapped')

  try {
    await insertOrder(order)
  } catch (e) {
    await logEvent({
      platform: 'hepsiburada',
      status: 'error',
      externalId: normalized.externalId,
      payloadDigest: digest,
      message: 'DB insert hatası: ' + (e as Error).message,
    })
    return new Response('Server error', { status: 500 })
  }

  await logEvent({
    platform: 'hepsiburada',
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
    title: unmapped ? '⚠ Hepsiburada — Eşleşmemiş Ürün' : '🛒 Yeni Hepsiburada Siparişi',
    body: `${order.customer.fullName} · ${order.items[0]?.productName ?? ''} · ${order.total.toLocaleString('tr-TR')}₺`,
    url: unmapped ? `/admin/entegrasyonlar` : `/admin/orders/${order.orderNo}`,
    tag: `hepsiburada-${order.orderNo}`,
    requireInteraction: unmapped,
  }).catch(() => {})

  // Müşteriye onay maili — Hepsiburada email yansıtıldıysa
  if (order.customer.email) {
    const siteUrl = process.env.PUBLIC_SITE_URL ?? 'https://carmat.com.tr'
    const trackingUrl = `${siteUrl}/siparis-takip/detay?o=${order.orderNo}&t=${order.accessToken}`
    void sendMail({
      to: order.customer.email,
      subject: `Hepsiburada siparişiniz Carmat atölyesine ulaştı — ${order.orderNo}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:32px auto;background:#15151b;color:#f4ede0;border:1px solid #2a2a33;border-radius:16px;overflow:hidden;">
          <div style="background:#0b0b0f;padding:24px 32px;text-align:center;border-bottom:2px solid #d4923a;">
            <div style="color:#d4923a;font-weight:700;font-size:24px;">CARMAT</div>
            <div style="color:#8e8e94;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-top:4px;">Hepsiburada · Aracına Özel · Konya Atölyesi</div>
          </div>
          <div style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;">Merhaba ${order.customer.fullName},</h1>
            <p style="line-height:1.6;color:#b4b4ba;">
              Hepsiburada üzerinden verdiğiniz siparişiniz <strong style="color:#f4ede0;">${order.orderNo}</strong>
              numarasıyla Carmat atölyemize ulaştı. 🎉
            </p>
            <a href="${trackingUrl}" style="display:inline-block;margin-top:8px;padding:12px 24px;background:#d4923a;color:#0b0b0f;font-weight:700;text-decoration:none;border-radius:8px;">Siparişimi Takip Et</a>
          </div>
        </div>`,
    }).catch(() => {})
  }

  return new Response(JSON.stringify({ ok: true, orderNo: order.orderNo, unmapped }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
