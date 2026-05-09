/**
 * Trendyol Webhook Adapter.
 *
 * Trendyol Partner Portal'da tanımlanan webhook URL'i bu endpoint'e POST gönderir.
 * Olay tipleri: OrderCreated, OrderStatusChanged, OrderPackageCreated.
 *
 * Imza: Trendyol HMAC-SHA256 ile X-Trendyol-Signature header'ında imza gönderir.
 * (Eski sürümler API_KEY:API_SECRET base64 kullanır — bizim adapter ikisini de destekler.)
 *
 * NOT: Gerçek Trendyol payload şeması Carmat ürün eşleşmesi için
 *      `trendyol-mapping.ts` üzerinden işler — bir Trendyol product_code,
 *      bir Carmat (productSlug + matSlug + borderSlug + ...) konfigürasyonuna eşlenir.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { PlatformAdapter, NormalizedOrder } from './types'
import { getMappingByExternalCode } from './trendyol-mapping'
import type { OrderItem } from '../db'

export const trendyolAdapter: PlatformAdapter = {
  platform: 'trendyol',

  async verify(req, body, secret) {
    if (!secret) return false
    const sig = req.headers.get('x-trendyol-signature') || req.headers.get('x-signature')
    if (!sig) return false
    // HMAC-SHA256 hex
    const expected = createHmac('sha256', secret).update(body).digest('hex')
    try {
      return (
        sig.length === expected.length &&
        timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expected, 'utf8'))
      )
    } catch {
      return false
    }
  },

  async parse(payload: unknown): Promise<NormalizedOrder> {
    // Beklenen payload yapısı (Trendyol Webhook → OrderCreated):
    // {
    //   eventType: 'OrderCreated',
    //   orderNumber: 'TY-123456789',
    //   customer: { firstName, lastName, gsm, email },
    //   shipmentAddress: { firstName, lastName, gsm, city, district, address1, address2 },
    //   lines: [ { productCode, sku, productName, quantity, price, discount } ],
    //   totalPrice, shippingCost, discount, paymentType, paymentStatus
    // }
    const p = payload as any
    if (!p?.orderNumber) throw new Error('Trendyol: orderNumber yok')

    const fullName = [p.customer?.firstName, p.customer?.lastName].filter(Boolean).join(' ').trim() || 'Trendyol Müşteri'
    const phone = String(p.customer?.gsm ?? p.shipmentAddress?.gsm ?? '0000000000')

    const sa = p.shipmentAddress ?? {}
    const shippingFullName = [sa.firstName, sa.lastName].filter(Boolean).join(' ').trim() || fullName

    const items: OrderItem[] = (p.lines ?? []).map((l: any) => {
      const code = String(l.productCode ?? l.sku ?? '')
      const mapping = getMappingByExternalCode('trendyol', code)
      // Mapping yoksa generic placeholder — admin manual eşleştirecek
      const it: OrderItem = mapping?.toOrderItem
        ? mapping.toOrderItem(l)
        : {
            category: 'mat',
            brandSlug: 'unmapped',
            brandName: l.productName ?? code,
            modelSlug: 'unmapped',
            modelName: '?',
            modelChassis: '',
            productSlug: 'unmapped',
            productName: String(l.productName ?? code).slice(0, 80),
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
            qty: Number(l.quantity ?? 1),
            unitPrice: Number(l.price ?? 0),
          }
      return it
    })

    const total = Number(p.totalPrice ?? 0)
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0) || total
    const paymentStatus =
      (p.paymentStatus === 'PAID' || p.paymentStatus === 'tamamlandi') ? 'tamamlandi' : 'bekliyor'

    return {
      externalId: String(p.orderNumber),
      customer: {
        fullName,
        phone,
        email: p.customer?.email,
      },
      shippingAddress: {
        fullName: shippingFullName,
        phone,
        city: String(sa.city ?? 'Belirtilmedi'),
        district: String(sa.district ?? 'Belirtilmedi'),
        addressLine: [sa.address1, sa.address2].filter(Boolean).join(' ').slice(0, 500) || 'Trendyol adres',
      },
      items,
      subtotal,
      shipping: Number(p.shippingCost ?? 0),
      discount: Number(p.discount ?? 0),
      total: total || subtotal,
      paidAmount: paymentStatus === 'tamamlandi' ? (total || subtotal) : 0,
      paymentMethod: 'havale',
      paymentStatus,
      customerNote: p.note ? String(p.note).slice(0, 500) : undefined,
      internalNote: `[TRENDYOL ${p.eventType ?? 'OrderEvent'}] orderNumber=${p.orderNumber}`,
    }
  },
}
