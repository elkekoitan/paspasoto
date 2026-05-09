/**
 * Hepsiburada Webhook Adapter.
 *
 * Hepsiburada Satıcı Paneli'nde tanımlanan webhook URL'i bu endpoint'e POST gönderir.
 * Olay tipleri: OrderCreated, OrderItemUpdated, ShipmentCreated.
 *
 * Auth: Hepsiburada API V1 — Basic auth username:password (Listing Username:Listing Password)
 *       Webhook için ayrıca HMAC-SHA256 secret kullanır (X-Hepsiburada-Signature header).
 *
 * Trendyol adapter şablonundan türetilmiş. Pazaryeri payload yapısı benzer.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { PlatformAdapter, NormalizedOrder } from './types'
import type { OrderItem } from '../db'

export const hepsiburadaAdapter: PlatformAdapter = {
  platform: 'hepsiburada',

  async verify(req, body, secret) {
    if (!secret) return false
    const sig = req.headers.get('x-hepsiburada-signature') || req.headers.get('x-signature')
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
    /**
     * Beklenen payload yapısı (Hepsiburada → OrderCreated):
     * {
     *   eventType: 'OrderCreated',
     *   orderNumber: 'HB-...',
     *   customer: { firstName, lastName, phoneNumber, email },
     *   shippingAddress: { name, phone, city, town, address, zipCode },
     *   items: [{ merchantSku, name, quantity, price }],
     *   totalPrice, shippingCost, paymentType, paymentStatus, status
     * }
     */
    const p = payload as any
    if (!p?.orderNumber) throw new Error('Hepsiburada: orderNumber yok')

    const fullName =
      [p.customer?.firstName, p.customer?.lastName].filter(Boolean).join(' ').trim() ||
      'Hepsiburada Müşteri'
    const phone = String(p.customer?.phoneNumber ?? p.shippingAddress?.phone ?? '0000000000')

    const sa = p.shippingAddress ?? {}
    const shippingFullName = String(sa.name ?? fullName).trim()

    // Hepsiburada'da items[].merchantSku field'ı satıcının kendi SKU'sudur.
    // Trendyol mapping ile aynı mantık ama hepsiburada-mapping.ts üzerinden çözülür.
    // V1: tüm Hepsiburada siparişleri "unmapped" düşer, admin manuel eşleştirir.
    const items: OrderItem[] = (p.items ?? []).map((l: any) => {
      const code = String(l.merchantSku ?? l.sku ?? '')
      // V1 placeholder — admin /admin/entegrasyonlar'da SKU mapping eklenecek
      return {
        category: 'mat' as const,
        brandSlug: 'unmapped',
        brandName: l.name ?? code,
        modelSlug: 'unmapped',
        modelName: '?',
        modelChassis: '',
        productSlug: 'unmapped',
        productName: String(l.name ?? code).slice(0, 80),
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
    })

    const total = Number(p.totalPrice ?? 0)
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0) || total
    const paymentStatus =
      p.paymentStatus === 'PAID' || p.paymentStatus === 'tamamlandi' ? 'tamamlandi' : 'bekliyor'

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
        district: String(sa.town ?? sa.district ?? 'Belirtilmedi'),
        addressLine: String(sa.address ?? 'Hepsiburada adres').slice(0, 500),
      },
      items,
      subtotal,
      shipping: Number(p.shippingCost ?? 0),
      discount: Number(p.discount ?? 0),
      total: total || subtotal,
      paidAmount: paymentStatus === 'tamamlandi' ? total || subtotal : 0,
      paymentMethod: 'havale',
      paymentStatus,
      customerNote: p.note ? String(p.note).slice(0, 500) : undefined,
      internalNote: `[HEPSIBURADA ${p.eventType ?? 'OrderEvent'}] orderNumber=${p.orderNumber}`,
    }
  },
}
