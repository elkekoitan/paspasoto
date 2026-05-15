/**
 * POST /api/integrations/trendyol/simulate
 *
 * Admin-only — Trendyol webhook simülatörü. Gerçek Trendyol bağlantısı
 * gelmeden önce admin'in akışı (kanal = trendyol, externalRef, push notify,
 * dashboard kanal dağılımı) test edebilmesi için sahte bir sipariş üretir.
 *
 * Body (opsiyonel):
 *   { phone?: string, fullName?: string, total?: number }
 *
 * Üretilen sipariş Order.channel='trendyol', externalRef='trendyol/SIM-{ts}'
 * olur ve normal Order.json içine yazılır. Admin /admin/orders'da gözükür.
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../server/auth'
import { insertOrder, generateOrderNo, generateToken, type Order, type OrderItem } from '../../../../server/db'

export const prerender = false

export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }

  const body = await request.json().catch(() => ({}))
  const now = Date.now()
  const externalId = `SIM-${now}`
  const fullName = body.fullName || 'Trendyol Test Müşteri'
  const phone = body.phone || '0555 000 11 22'
  const baseTotal = Number(body.total) || 2490

  // Tipik bir 4'lü paspas siparişi simülasyonu
  const item: OrderItem = {
    category: 'mat',
    productId: 2,
    brandSlug: 'unmapped',
    brandName: 'Trendyol Marka (eşlenmemiş)',
    modelSlug: 'unmapped-model',
    modelName: 'Eşlenmemiş Model',
    modelChassis: '-',
    productSlug: '4lu-set',
    productName: '4\'lü Paspas Seti',
    productParts: 4,
    matSlug: 'siyah',
    matName: 'Siyah',
    matSwatchUrl: '/assets/swatches/mat-siyah.webp',
    borderSlug: 'siyah',
    borderName: 'Siyah',
    borderSwatchUrl: '/assets/swatches/border-siyah.webp',
    heelSlug: 'standart',
    heelName: 'Standart Antrasit',
    heelSwatchUrl: '/assets/heel-pads/heel-standart.webp',
    heelPadPassenger: false,
    logoBrandSlug: null,
    logoQty: 0,
    qty: 1,
    unitPrice: baseTotal,
  } as unknown as OrderItem

  const order: Order = {
    orderNo: generateOrderNo(),
    accessToken: generateToken(),
    kind: 'order',
    channel: 'trendyol',
    externalRef: {
      platform: 'trendyol',
      id: externalId,
      rawPayload: { simulated: true, simulatedAt: now, note: 'Test sipariş — /api/integrations/trendyol/simulate' },
    },
    customer: { fullName, phone, email: 'test@example.com' },
    shippingAddress: {
      fullName,
      phone,
      city: 'İstanbul',
      district: 'Kadıköy',
      addressLine: 'Test Mah. Test Sk. No: 1 (Trendyol simülasyon adresi)',
    },
    items: [item],
    subtotal: baseTotal,
    shipping: 0,
    discount: 0,
    total: baseTotal,
    paidAmount: baseTotal, // Trendyol ödemeyi alıp gönderiyor — Carmat'a paid olarak gelir
    paymentMethod: 'havale',
    paymentStatus: 'tamamlandi',
    productionStatus: 'received',
    deliveryMethod: 'cargo',
    customerNote: 'Trendyol sipariş notu (varsa)',
    internalNote: '[TEST SİMÜLASYON] Bu sipariş /api/integrations/trendyol/simulate ile üretildi. Gerçek Trendyol akışı test için. ⚠ Marka eşlenmedi — admin manuel düzeltmeli.',
    createdAt: now,
    paidAt: now,
    events: [
      { status: 'received', at: now, note: 'Trendyol siparişi alındı (SİMÜLASYON)', by: 'trendyol-simulator' },
    ],
  }

  await insertOrder(order)

  return new Response(
    JSON.stringify({
      ok: true,
      orderNo: order.orderNo,
      externalId,
      message: `Sahte Trendyol siparişi oluşturuldu (${order.orderNo}). Admin → Siparişler → Trendyol kanal filtresi ile görebilirsiniz.`,
    }),
    { status: 201, headers: { 'Content-Type': 'application/json' } },
  )
}
