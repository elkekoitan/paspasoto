/**
 * E-ticaret platform adapter interface.
 *
 * Her platform (Trendyol, Hepsiburada, WooCommerce vs.) bu interface'i implement eder.
 * Webhook endpoint adapter'ı `registry.get(platform)` ile alır → verify + parse → DB'ye yazar.
 */
import type { Channel, OrderItem } from '../db'

/** Webhook'tan gelen veri normalize edildikten sonra Carmat Order shape'ine yakın */
export type NormalizedOrder = {
  externalId: string                  // platform'daki sipariş kimliği (idempotency anahtarı)
  customer: { fullName: string; phone: string; email?: string }
  shippingAddress: {
    fullName: string
    phone: string
    city: string
    district: string
    addressLine: string
  }
  items: OrderItem[]
  subtotal: number
  shipping: number
  discount?: number
  total: number
  paidAmount: number
  paymentMethod: 'havale' | 'elden-kart' | 'kapida' | 'sonra' | 'taksit' | 'elden-nakit'
  paymentStatus: 'bekliyor' | 'kismi' | 'tamamlandi' | 'iade'
  customerNote?: string
  internalNote?: string
}

export type IntegrationEvent = {
  id: string
  platform: Channel
  receivedAt: number
  status: 'success' | 'invalid_signature' | 'parse_error' | 'duplicate' | 'unmapped' | 'error'
  externalId?: string
  orderNo?: string
  payloadDigest?: string  // SHA-1 of payload for debugging
  message?: string
  raw?: string  // first 1000 chars
}

export interface PlatformAdapter {
  platform: Channel
  /** Webhook isteğinin imzasını doğrula (HMAC, header check, vs.) */
  verify(req: Request, body: string, secret: string): Promise<boolean>
  /** Platform-spesifik payload'u Carmat NormalizedOrder shape'ine çevir */
  parse(payload: unknown): Promise<NormalizedOrder>
}
