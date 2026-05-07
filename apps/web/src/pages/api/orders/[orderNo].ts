import type { APIRoute } from 'astro'
import { getByOrderNo, updateOrder, deleteOrder, type OrderStatus, type PaymentStatus } from '../../../server/db'
import { requireAdmin } from '../../../server/auth'
import { sendPush, type PushPayload } from '../../../server/push'

const STATUS_LABEL: Record<string, string> = {
  received: 'Sipariş Alındı',
  in_production: 'Üretimde',
  ready: 'Hazır',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal Edildi',
}

export const prerender = false

/** GET /api/orders/[orderNo] — admin only, tek sipariş. */
export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    requireAdmin(cookies)
  } catch (r) {
    return r as Response
  }
  const orderNo = params.orderNo!
  const o = getByOrderNo(orderNo)
  if (!o) return new Response('Not Found', { status: 404 })
  return new Response(JSON.stringify(o), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** PATCH /api/orders/[orderNo] — admin only, durum güncelleme + event ekleme. */
export const PATCH: APIRoute = async ({ params, cookies, request }) => {
  try {
    requireAdmin(cookies)
  } catch (r) {
    return r as Response
  }
  const orderNo = params.orderNo!
  const patch = await request.json().catch(() => ({}))
  const now = Date.now()

  // Status değişiyorsa otomatik event üret
  let event = patch.event
  if (patch.productionStatus && !event) {
    event = {
      status: patch.productionStatus as OrderStatus,
      at: now,
      by: 'admin',
    }
    if (patch.productionStatus === 'ready') patch.shippedAt = patch.shippedAt ?? now
    if (patch.productionStatus === 'delivered') patch.deliveredAt = now
  }
  if (patch.paymentStatus === 'tamamlandi' && !patch.paidAt) {
    patch.paidAt = now
  }

  const before = getByOrderNo(orderNo)
  const updated = await updateOrder(orderNo, patch, event)
  if (!updated) return new Response('Not Found', { status: 404 })

  // Push tetikleyicileri (müşteriye)
  const audience = `order:${orderNo}` as const
  const trackUrl = `/siparis-takip?t=${updated.accessToken}`

  // 1) quote → order dönüşümü (admin teklifi onayladı)
  if (before?.kind === 'quote' && updated.kind === 'order') {
    void sendPush(audience, {
      title: '✓ Teklifiniz Onaylandı',
      body: `${updated.orderNo} numaralı siparişiniz üretime alındı.`,
      url: trackUrl,
      tag: `order-${orderNo}-converted`,
      requireInteraction: true,
    } satisfies PushPayload).catch(() => {})
  }

  // 2) Üretim durumu değişti
  if (patch.productionStatus && before?.productionStatus !== patch.productionStatus) {
    const statusLabel = STATUS_LABEL[patch.productionStatus as string] ?? patch.productionStatus
    let title = '🔔 Sipariş Durumu Güncellendi'
    let body = `${updated.orderNo}: ${statusLabel}`
    if (patch.productionStatus === 'in_production') {
      title = '🔧 Siparişiniz Üretimde'
      body = `${updated.orderNo} — atölyemiz aracınıza özel paspas üretiyor.`
    } else if (patch.productionStatus === 'ready') {
      title = '✓ Siparişiniz Hazır'
      body = updated.deliveryMethod === 'pickup'
        ? `${updated.orderNo} — dükkanımızdan teslim alabilirsiniz.`
        : `${updated.orderNo} — kargoya verildi.`
    } else if (patch.productionStatus === 'delivered') {
      title = '🎉 Sipariş Teslim Edildi'
      body = `${updated.orderNo} — aracınızda kullanmaya başlayın!`
    } else if (patch.productionStatus === 'cancelled') {
      title = '✗ Sipariş İptal Edildi'
      body = `${updated.orderNo} iptal edildi. Detay için bize ulaşın.`
    }
    void sendPush(audience, {
      title, body, url: trackUrl,
      tag: `order-${orderNo}-status`,
      requireInteraction: patch.productionStatus === 'ready' || patch.productionStatus === 'delivered',
    } satisfies PushPayload).catch(() => {})
  }

  // 3) Ödeme tamamlandı
  if (patch.paymentStatus === 'tamamlandi' && before?.paymentStatus !== 'tamamlandi') {
    void sendPush(audience, {
      title: '💰 Ödeme Onaylandı',
      body: `${updated.orderNo} ödemeniz teyit edildi, teşekkürler!`,
      url: trackUrl,
      tag: `order-${orderNo}-paid`,
    } satisfies PushPayload).catch(() => {})
  }

  // 4) Kargo numarası eklendi
  if (patch.cargoTrackingNo && before?.cargoTrackingNo !== patch.cargoTrackingNo) {
    void sendPush(audience, {
      title: '📦 Kargo Yola Çıktı',
      body: `${updated.cargoCompany?.toUpperCase() ?? 'Kargo'}: ${patch.cargoTrackingNo}`,
      url: trackUrl,
      tag: `order-${orderNo}-cargo`,
    } satisfies PushPayload).catch(() => {})
  }

  return new Response(JSON.stringify(updated), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** DELETE /api/orders/[orderNo] — admin only. */
export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    requireAdmin(cookies)
  } catch (r) {
    return r as Response
  }
  const ok = await deleteOrder(params.orderNo!)
  if (!ok) return new Response('Not Found', { status: 404 })
  return new Response(null, { status: 204 })
}
