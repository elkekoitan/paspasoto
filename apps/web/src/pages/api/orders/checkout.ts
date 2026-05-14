import type { APIRoute } from 'astro'
import {
  insertOrder,
  generateOrderNo,
  generateToken,
  type Order,
  type OrderItem,
  type PaymentMethod,
} from '../../../server/db'
import { sendPush } from '../../../server/push'
import { sendQuoteReceivedMail, sendAdminNewQuoteMail } from '../../../server/mail'
import { getProductById } from '../../../lib/catalog-extra'

export const prerender = false

/**
 * POST /api/orders/checkout
 *
 * Müşteri sepetinden direkt sipariş oluşturur. Quote akışı kullanılmaz.
 *
 * Body:
 *   customer: { fullName, phone, email? }
 *   shippingAddress: { fullName, phone, city, district, addressLine }
 *   lines: CartLine[]  (cart.ts'den)
 *   paymentMethod: PaymentMethod  (iyzico → 501)
 *   customerNote?: string
 *
 * Response: { orderNo, accessToken }
 */
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null)
  if (!body || !body.customer?.fullName || !body.customer?.phone || !Array.isArray(body.lines) || body.lines.length === 0) {
    return new Response('Bad Request', { status: 400 })
  }

  const paymentMethod = body.paymentMethod as PaymentMethod
  // iyzico henüz aktif değil
  if (paymentMethod === 'iyzico') {
    return new Response(
      JSON.stringify({ error: 'Online ödeme henüz aktif değil. Lütfen başka bir ödeme yöntemi seçin.' }),
      { status: 501, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // CartLine[] → OrderItem[] dönüşümü + server-side fiyat re-validation
  const items: OrderItem[] = []
  for (const line of body.lines) {
    if (line.kind === 'simple' && line.productId) {
      const p = getProductById(line.productId)
      if (!p) {
        return new Response(
          JSON.stringify({ error: `Ürün bulunamadı: ${line.productId}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (p.stock < line.quantity) {
        return new Response(
          JSON.stringify({ error: `${p.name} için yeterli stok yok (mevcut: ${p.stock}).` }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        )
      }
      items.push(simpleProductToOrderItem(p, line.quantity))
    } else if (line.kind === 'mat-config' && line.config) {
      // Paspas konfigüratör çıktısı — config'i olduğu gibi OrderItem'a expand et
      items.push({
        ...(line.config as Partial<OrderItem>),
        qty: line.quantity,
        unitPrice: line.unitPrice,
        category: 'mat',
      } as OrderItem)
    } else if (line.kind === 'seat-config' && line.config) {
      items.push({
        ...(line.config as Partial<OrderItem>),
        qty: line.quantity,
        unitPrice: line.unitPrice,
        category: 'seat-cover',
      } as OrderItem)
    } else if (line.kind === 'steering-config' && line.config) {
      items.push({
        ...(line.config as Partial<OrderItem>),
        qty: line.quantity,
        unitPrice: line.unitPrice,
        category: 'steering-cover',
      } as OrderItem)
    } else {
      return new Response('Geçersiz sepet öğesi', { status: 400 })
    }
  }

  const subtotal = items.reduce((sum, it) => sum + it.unitPrice * it.qty, 0)
  const total = subtotal // kargo + indirim sonra eklenecek

  const now = Date.now()
  const fullName = String(body.customer.fullName).slice(0, 100)
  const phone = String(body.customer.phone).slice(0, 30)
  const sa = body.shippingAddress || {}

  const order: Order = {
    orderNo: generateOrderNo(),
    accessToken: generateToken(),
    kind: 'order',
    channel: 'configurator',
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
      addressLine: String(sa.addressLine ?? '').slice(0, 500),
    },
    items,
    subtotal,
    shipping: 0,
    discount: 0,
    total,
    paidAmount: 0,
    paymentMethod,
    paymentStatus: paymentMethod === 'kapida' || paymentMethod === 'havale' ? 'bekliyor' : 'bekliyor',
    productionStatus: 'received',
    deliveryMethod: 'cargo',
    customerNote: body.customerNote ? String(body.customerNote).slice(0, 500) : undefined,
    internalNote: '[ONLINE SİPARİŞ] Müşteri /odeme üzerinden direkt sipariş verdi.',
    createdAt: now,
    events: [
      { status: 'received', at: now, note: 'Online sipariş oluşturuldu', by: 'customer' },
    ],
  }

  await insertOrder(order)

  // Admin'e push bildirim
  const firstItem = order.items[0]
  void sendPush('admin', {
    title: '🛒 Yeni Online Sipariş',
    body: `${order.customer.fullName} — ${firstItem?.productName ?? 'ürün'} (${order.items.length} kalem)`,
    url: '/admin/talepler',
    tag: `order-${order.orderNo}`,
    requireInteraction: true,
  }).catch(() => {})

  // E-posta (opsiyonel)
  if (order.customer.email) {
    void sendQuoteReceivedMail({
      to: order.customer.email,
      customerName: order.customer.fullName,
      orderNo: order.orderNo,
      total: order.total,
      trackingUrl: `${process.env.PUBLIC_SITE_URL ?? 'https://carmat.com.tr'}/siparis-takip/detay?o=${order.orderNo}&t=${order.accessToken}`,
    }).catch(() => {})
  }
  void sendAdminNewQuoteMail({
    orderNo: order.orderNo,
    customerName: order.customer.fullName,
    customerPhone: order.customer.phone,
    productSummary: order.items.map((i) => i.productName).join(' · '),
    total: order.total,
  }).catch(() => {})

  return new Response(
    JSON.stringify({ orderNo: order.orderNo, accessToken: order.accessToken }),
    { status: 201, headers: { 'Content-Type': 'application/json' } },
  )
}

/**
 * SimpleProduct → OrderItem. OrderItem alanları paspas için tasarlandığı
 * için "boş" değerler doldurulur, kategori + ürün bilgisi taşınır.
 */
function simpleProductToOrderItem(
  p: ReturnType<typeof getProductById> & {},
  quantity: number,
): OrderItem {
  return {
    category: p.category,
    productId: p.id,
    brandSlug: 'aksesuar',
    brandName: 'Aksesuar',
    modelSlug: '-',
    modelName: '-',
    modelChassis: '-',
    productSlug: p.slug,
    productName: p.name,
    productParts: 1,
    matSlug: '-',
    matName: '-',
    matSwatchUrl: p.image,
    borderSlug: '-',
    borderName: '-',
    borderSwatchUrl: p.image,
    heelSlug: '-',
    heelName: '-',
    heelSwatchUrl: p.image,
    heelPadPassenger: false,
    logoBrandSlug: null,
    logoQty: 0,
    qty: quantity,
    unitPrice: p.price,
  } as unknown as OrderItem
}
