/**
 * JSON-file backed datastore.
 * Production: /data/orders.json (Coolify persistent volume)
 * Dev: ./.data/orders.json
 *
 * Order ekleme/güncelleme atomik (write-temp + rename).
 * Sıralı I/O için process içi mutex (queueMicrotask kuyruğu).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export type OrderStatus =
  | 'received'
  | 'awaiting_payment'
  | 'payment_confirmed'
  | 'production_started'
  | 'production_cutting'
  | 'production_sewing'
  | 'quality_check'
  | 'ready_pickup' // dükkandan teslim almaya hazır
  | 'shipped'
  | 'picked_up' // dükkandan teslim alındı
  | 'delivered'
  | 'cancelled'

export type DeliveryMethod = 'cargo' | 'pickup'

/** Müşteri tarafında gösterilen 4 aşamalık özet timeline */
export type CustomerStage = 'received' | 'in_production' | 'ready' | 'delivered'

/** Detaylı admin status'unu müşteri için 4-aşama özet'e map'le */
export function customerStageOf(status: OrderStatus): CustomerStage | null {
  switch (status) {
    case 'received':
    case 'awaiting_payment':
      return 'received'
    case 'payment_confirmed':
    case 'production_started':
    case 'production_cutting':
    case 'production_sewing':
    case 'quality_check':
      return 'in_production'
    case 'ready_pickup':
    case 'shipped':
      return 'ready'
    case 'picked_up':
    case 'delivered':
      return 'delivered'
    case 'cancelled':
      return null
  }
}

export type PaymentMethod =
  | 'elden-nakit'
  | 'elden-kart'
  | 'havale'
  | 'kapida'
  | 'sonra'
  | 'taksit'
export type PaymentStatus = 'bekliyor' | 'kismi' | 'tamamlandi' | 'iade'

/**
 * Tek bir tahsilat kaydı.
 * Sipariş taksitli/parçalı ödeniyorsa her tahsilat ayrı kayıt olur.
 */
export type PaymentInstallment = {
  id: string
  /** Vade/planlanan tarih (epoch ms). Tahsil edildiğinde paidAt da set edilir. */
  dueAt: number
  amount: number
  method: PaymentMethod
  status: 'planlandi' | 'odendi' | 'gecikti' | 'iptal'
  /** Tahsil edildiği tarih (status === 'odendi' ise dolu). */
  paidAt?: number
  note?: string
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  'elden-nakit': 'Elden — Nakit',
  'elden-kart': 'Elden — Kredi Kartı (POS)',
  havale: 'Havale / EFT',
  kapida: 'Kapıda Ödeme',
  sonra: 'Sonra Ödenecek',
  taksit: 'Parçalı / Taksit',
}

export type OrderItem = {
  brandSlug: string
  brandName: string
  modelSlug: string
  modelName: string
  modelChassis: string
  productSlug: string
  productName: string
  productParts: number
  matSlug: string
  matName: string
  matSwatchUrl: string
  borderSlug: string
  borderName: string
  borderSwatchUrl: string
  heelSlug: string
  heelName: string
  heelSwatchUrl: string
  heelPadPassenger: boolean
  logoBrandSlug: string | null
  logoQty: number
  qty: number
  unitPrice: number
}

export type OrderEvent = {
  status: OrderStatus
  at: number
  note?: string
  by?: string
}

export type Order = {
  orderNo: string
  accessToken: string
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
  /** Atölye indirim (admin'in elden verdiği) */
  discount?: number
  total: number
  paidAmount: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  /** Çoklu tahsilat / taksit planı (parçalı ödemelerde dolu). */
  paymentInstallments?: PaymentInstallment[]
  productionStatus: OrderStatus
  /** Teslimat yöntemi — kargo ile gönder veya dükkandan teslim alma */
  deliveryMethod?: DeliveryMethod
  customerNote?: string
  internalNote?: string
  cargoCompany?: 'yurtici' | 'aras' | 'mng' | 'ptt' | 'surat'
  cargoTrackingNo?: string
  createdAt: number
  paidAt?: number
  shippedAt?: number
  deliveredAt?: number
  events: OrderEvent[]
}

type DataFile = {
  orders: Order[]
  meta: { version: number }
}

const DATA_DIR = process.env.DATA_DIR ?? resolve(process.cwd(), '.data')
const DATA_FILE = resolve(DATA_DIR, 'orders.json')

function ensure() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(DATA_FILE)) {
    const initial: DataFile = { orders: [], meta: { version: 1 } }
    writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8')
  }
}

let _writeQueue: Promise<unknown> = Promise.resolve()

function load(): DataFile {
  ensure()
  return JSON.parse(readFileSync(DATA_FILE, 'utf8')) as DataFile
}

function save(data: DataFile): Promise<void> {
  _writeQueue = _writeQueue.then(() => {
    const tmp = DATA_FILE + '.tmp'
    writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
    renameSync(tmp, DATA_FILE)
  })
  return _writeQueue as Promise<void>
}

/* ---------------- Public API ---------------- */

export function listOrders(): Order[] {
  return load().orders.sort((a, b) => b.createdAt - a.createdAt)
}

export function getByOrderNo(orderNo: string): Order | undefined {
  return load().orders.find((o) => o.orderNo === orderNo)
}

export function getByToken(token: string): Order | undefined {
  return load().orders.find((o) => o.accessToken === token)
}

export function getByOrderNoAndPhoneLast4(
  orderNo: string,
  last4: string,
): Order | undefined {
  const o = getByOrderNo(orderNo)
  if (!o) return undefined
  const tail = o.customer.phone.replace(/\D/g, '').slice(-4)
  return tail === last4 ? o : undefined
}

export async function insertOrder(o: Order): Promise<Order> {
  const data = load()
  if (data.orders.some((x) => x.orderNo === o.orderNo)) {
    throw new Error('Order with same orderNo already exists')
  }
  data.orders.unshift(o)
  await save(data)
  return o
}

export async function updateOrder(
  orderNo: string,
  patch: Partial<Order>,
  newEvent?: OrderEvent,
): Promise<Order | null> {
  const data = load()
  const idx = data.orders.findIndex((o) => o.orderNo === orderNo)
  if (idx === -1) return null
  const merged = { ...data.orders[idx], ...patch } as Order
  if (newEvent) merged.events = [...(merged.events ?? []), newEvent]
  data.orders[idx] = merged
  await save(data)
  return merged
}

export async function deleteOrder(orderNo: string): Promise<boolean> {
  const data = load()
  const before = data.orders.length
  data.orders = data.orders.filter((o) => o.orderNo !== orderNo)
  if (data.orders.length === before) return false
  await save(data)
  return true
}

export function generateOrderNo(): string {
  const d = new Date()
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `PO-${yy}${mm}${dd}-${rand}`
}

export function generateToken(): string {
  // Crypto.randomUUID Node 19+
  return (globalThis.crypto?.randomUUID?.() ?? require('node:crypto').randomUUID()) as string
}

export const PRODUCTION_TIMELINE: { status: OrderStatus; label: string; description: string }[] = [
  { status: 'received', label: 'Sipariş Alındı', description: 'Siparişiniz sistemimize ulaştı.' },
  { status: 'payment_confirmed', label: 'Ödeme Onaylandı', description: 'Ödemeniz teyit edildi, üretim sırasına alındı.' },
  { status: 'production_started', label: 'Kalıp Hazırlanıyor', description: 'Aracınıza özel kalıp atölyemizde hazırlanıyor.' },
  { status: 'production_cutting', label: 'Kesim', description: 'Lazer ölçülü kesim yapılıyor.' },
  { status: 'production_sewing', label: 'Dikim & Montaj', description: 'Kenarlık + topukluk + amblem birleştiriliyor.' },
  { status: 'quality_check', label: 'Kalite Kontrol', description: 'Son kontrol ekibimizden geçiyor.' },
  { status: 'ready_pickup', label: 'Dükkanda Hazır', description: 'Atölyemizde paketlendi — gelip teslim alabilirsiniz.' },
  { status: 'shipped', label: 'Kargoya Verildi', description: 'Aracınızın yolda — takip linki aktif.' },
  { status: 'picked_up', label: 'Dükkandan Teslim', description: 'Müşteri dükkandan teslim aldı.' },
  { status: 'delivered', label: 'Teslim Edildi', description: 'Aracınızda sürmeye başlayın!' },
]

/** Müşteri tarafında gösterilen sade 4 aşama */
export const CUSTOMER_TIMELINE: { stage: CustomerStage; label: string; description: string }[] = [
  { stage: 'received', label: 'Sipariş Alındı', description: 'Siparişiniz atölyemize ulaştı, kontrol ediliyor.' },
  { stage: 'in_production', label: 'Üretimde', description: 'Aracınıza özel paspas üretiliyor — kalıp, kesim, dikim ve kalite kontrol.' },
  { stage: 'ready', label: 'Hazır', description: 'Paspasınız hazır — kargo yolda veya dükkandan teslim almaya hazır.' },
  { stage: 'delivered', label: 'Teslim Edildi', description: 'Aracınızda kullanım başlasın!' },
]
