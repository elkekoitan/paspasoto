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
import { sendMail } from '../../../../server/mail'

export const prerender = false

/**
 * GET /api/integrations/trendyol/webhook
 * Trendyol webhook URL doğrulaması için — endpoint canlı mı kontrol eder.
 */
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: true, endpoint: 'trendyol-webhook', methods: ['POST'] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

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

  // Müşteriye onay maili — Trendyol email yansıtıldıysa
  if (order.customer.email) {
    const siteUrl = process.env.PUBLIC_SITE_URL ?? 'https://carmat.com.tr'
    const trackingUrl = `${siteUrl}/siparis-takip/detay?o=${order.orderNo}&t=${order.accessToken}`
    void sendMail({
      to: order.customer.email,
      subject: `Trendyol siparişiniz Carmat atölyesine ulaştı — ${order.orderNo}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:32px auto;background:#15151b;color:#f4ede0;border:1px solid #2a2a33;border-radius:16px;overflow:hidden;">
          <div style="background:#0b0b0f;padding:24px 32px;text-align:center;border-bottom:2px solid #d4923a;">
            <div style="color:#d4923a;font-weight:700;font-size:24px;">CARMAT</div>
            <div style="color:#8e8e94;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-top:4px;">Trendyol · Aracına Özel · Konya Atölyesi</div>
          </div>
          <div style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;">Merhaba ${order.customer.fullName},</h1>
            <p style="line-height:1.6;color:#b4b4ba;">
              Trendyol'dan verdiğiniz siparişiniz <strong style="color:#f4ede0;">${order.orderNo}</strong>
              numarasıyla Carmat atölyemize ulaştı. 🎉
            </p>
            <div style="margin:20px 0;padding:14px 16px;background:#1f1f26;border-radius:8px;border-left:3px solid #d4923a;">
              <div style="font-size:11px;color:#8e8e94;text-transform:uppercase;letter-spacing:1px;">Trendyol Sipariş No</div>
              <div style="font-family:monospace;font-size:14px;color:#f4ede0;margin-top:2px;">${normalized.externalId}</div>
              <div style="font-size:11px;color:#8e8e94;text-transform:uppercase;letter-spacing:1px;margin-top:10px;">Carmat Sipariş No</div>
              <div style="font-family:monospace;font-size:14px;color:#d4923a;font-weight:700;margin-top:2px;">${order.orderNo}</div>
            </div>
            <p style="line-height:1.6;color:#b4b4ba;">
              Atölyemiz aracınıza özel paspasınızı üretmeye başlamak üzere. Üretim süreci başladığında
              size hem buradan hem WhatsApp'tan haber vereceğiz.
            </p>
            <a href="${trackingUrl}" style="display:inline-block;margin-top:8px;padding:12px 24px;background:#d4923a;color:#0b0b0f;font-weight:700;text-decoration:none;border-radius:8px;">Siparişimi Takip Et</a>
            <p style="line-height:1.6;color:#8e8e94;font-size:12px;margin-top:24px;">
              Sorularınız için: WhatsApp +90 544 710 81 15
            </p>
          </div>
          <div style="background:#0b0b0f;padding:20px 32px;text-align:center;border-top:1px solid #2a2a33;color:#8e8e94;font-size:11px;">
            Carmat · Konya, Türkiye<br/>
            <a href="https://carmat.com.tr" style="color:#d4923a;text-decoration:none;">carmat.com.tr</a>
          </div>
        </div>`,
    }).catch(() => {})
  }

  return new Response(JSON.stringify({ ok: true, orderNo: order.orderNo, unmapped }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
