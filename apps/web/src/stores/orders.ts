/**
 * Sipariş store — V1 demo için localStorage persistence.
 * Strapi entegrasyonu sonrasında API endpoint'lerine geçecek.
 */
import type { CartItem } from './cart'

export type OrderStatus =
  | 'received'
  | 'awaiting_payment'
  | 'payment_confirmed'
  | 'production_started'
  | 'production_cutting'
  | 'production_sewing'
  | 'quality_check'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export const PRODUCTION_TIMELINE: { status: OrderStatus; label: string; description: string }[] = [
  { status: 'received', label: 'Sipariş Alındı', description: 'Siparişiniz sistemimize ulaştı.' },
  { status: 'payment_confirmed', label: 'Ödeme Onaylandı', description: 'Ödemeniz teyit edildi, üretim sırasına alındı.' },
  { status: 'production_started', label: 'Kalıp Hazırlanıyor', description: 'Aracınıza özel kalıp atölyemizde hazırlanıyor.' },
  { status: 'production_cutting', label: 'Kesim', description: 'Lazer ölçülü kesim yapılıyor.' },
  { status: 'production_sewing', label: 'Dikim & Montaj', description: 'Kenarlık + topukluk + amblem birleştiriliyor.' },
  { status: 'quality_check', label: 'Kalite Kontrol', description: 'Son kontrol ekibimizden geçiyor.' },
  { status: 'shipped', label: 'Kargoya Verildi', description: 'Aracınızın yolda — takip linki aktif.' },
  { status: 'delivered', label: 'Teslim Edildi', description: 'Aracınızda sürmeye başlayın!' },
]

export type PaymentMethod = 'havale' | 'kapida'
export type PaymentStatus = 'bekliyor' | 'kismi' | 'tamamlandi' | 'iade'

export type Order = {
  orderNo: string
  accessToken: string
  customer: { fullName: string; phone: string; email: string }
  shippingAddress: {
    fullName: string
    phone: string
    city: string
    district: string
    addressLine: string
  }
  items: CartItem[]
  subtotal: number
  shipping: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  productionStatus: OrderStatus
  customerNote?: string
  createdAt: number
  paidAt?: number
  shippedAt?: number
  deliveredAt?: number
  cargoCompany?: string
  cargoTrackingNo?: string
  events: { status: OrderStatus; at: number; note?: string }[]
}

const KEY = 'paspasoto:orders:v1'

export function generateOrderNo(): string {
  const d = new Date()
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `PO-${yy}${mm}${dd}-${rand}`
}

export function generateToken(): string {
  return crypto.randomUUID()
}

export function loadOrders(): Order[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Order[]) : []
  } catch {
    return []
  }
}

export function saveOrder(o: Order) {
  if (typeof window === 'undefined') return
  const all = loadOrders()
  const next = [o, ...all.filter((x) => x.orderNo !== o.orderNo)]
  localStorage.setItem(KEY, JSON.stringify(next))
}

export function findByToken(token: string): Order | null {
  return loadOrders().find((o) => o.accessToken === token) ?? null
}

export function findByOrderNoAndPhone(orderNo: string, phoneLast4: string): Order | null {
  const ord = loadOrders().find((o) => o.orderNo === orderNo)
  if (!ord) return null
  const last4 = ord.customer.phone.replace(/\D/g, '').slice(-4)
  return last4 === phoneLast4 ? ord : null
}
