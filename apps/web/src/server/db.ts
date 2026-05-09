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

/**
 * Sadeleştirilmiş 4-aşama + iptal.
 * Eski granular status'ler artık kullanılmıyor — eski kayıtlar legacy olarak
 * customerStageOf() ile aynı 4 grupta görüntülenir.
 */
export type OrderStatus =
  | 'received'      // Sipariş Alındı
  | 'in_production' // Üretimde (kalıp + kesim + dikim + kalite kontrol hepsi tek)
  | 'ready'         // Hazır (kargoya verildi VEYA dükkanda teslim almaya hazır)
  | 'delivered'     // Teslim Edildi (kargo veya elden)
  | 'cancelled'

export type DeliveryMethod = 'cargo' | 'pickup'

/** Müşteri tarafında gösterilen 4 aşamalık özet timeline (admin = aynı) */
export type CustomerStage = 'received' | 'in_production' | 'ready' | 'delivered'

/** Status → stage map (legacy data desteği için: eski granular kayıtlar 4 gruba düşer) */
export function customerStageOf(status: OrderStatus | string): CustomerStage | null {
  switch (status) {
    case 'received':
    case 'awaiting_payment':
      return 'received'
    case 'in_production':
    case 'payment_confirmed':
    case 'production_started':
    case 'production_cutting':
    case 'production_sewing':
    case 'quality_check':
      return 'in_production'
    case 'ready':
    case 'ready_pickup':
    case 'shipped':
      return 'ready'
    case 'delivered':
    case 'picked_up':
      return 'delivered'
    case 'cancelled':
      return null
    default:
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

/** Ürün kategorisi — paspas / koltuk kılıfı / direksiyon kılıfı */
export type ProductCategory = 'mat' | 'seat-cover' | 'steering-cover'

/** Paspas pozisyonu (araç içinde hangi paspas) */
export type MatPosition = 'driver' | 'passenger' | 'leftRear' | 'rightRear' | 'trunk'
/** Logo'nun paspas üzerindeki yerleşimi */
/**
 * Logo placement: 3×3 grid (paspas yüzeyinde 9 pozisyon).
 * Kısa kod: T=Top, M=Middle, B=Bottom × L=Left, C=Center, R=Right
 *
 * Backward compat: eski 'top'/'middle'/'bottom' kayıtları
 * 'top-center'/'middle-center'/'bottom-center' olarak yorumlanır.
 */
export type LogoPlacement =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  // Legacy (eski 3-yön kayıtları için)
  | 'top' | 'middle' | 'bottom'
/** Topukluk konum tercihi */
export type HeelPosition = 'driver-only' | 'passenger-only' | 'both' | 'none'

export type MatLogoConfig = {
  position: MatPosition
  brandSlug: string | null
  placement: LogoPlacement
}

export type OrderItem = {
  /** Default 'mat' (geriye dönük uyumluluk) */
  category?: ProductCategory
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
  /** Eski şema (backward compat). Yeni kayıtlar heelPosition kullanır. */
  heelPadPassenger: boolean
  /** Yeni şema: topukluk konum tercihi */
  heelPosition?: HeelPosition
  /** Eski şema (backward compat). İlk dolu logos[] entry'sinin brandSlug'ı yansır. */
  logoBrandSlug: string | null
  /** Eski şema: aktif logo sayısı */
  logoQty: number
  /** Yeni şema: her paspas pozisyonu için ayrı logo + konum */
  logos?: MatLogoConfig[]
  qty: number
  unitPrice: number
  /** Koltuk kılıfı için (category='seat-cover'): malzeme/renk/araç tipi */
  seatMaterialSlug?: string
  seatColorSlug?: string
  seatFitmentBrand?: string
  /** Direksiyon kılıfı için (category='steering-cover'): boyut/desen/malzeme */
  steeringSize?: 'S' | 'M' | 'L'
  steeringPatternSlug?: string
  steeringMaterialSlug?: string
  /** Sahibinden seviyesi trim/donanım (opsiyonel) — admin'e tam araç kombinasyonu görünür */
  trimId?: number
  trimName?: string
  trimEngine?: string
  trimFuel?: string
  trimTransmission?: string
  trimPackage?: string
}

export type OrderEvent = {
  status: OrderStatus
  at: number
  note?: string
  by?: string
}

/**
 * Order kayıtları iki tipte:
 *  - 'order': Atölye (admin) tarafından açılmış kesin sipariş
 *  - 'quote': Müşteri konfigüratör/site üzerinden ön talep (atölye onayı bekliyor)
 *
 * Quote → Order dönüşümü admin onayıyla yapılır (kind alanını 'order' yapar).
 */
export type OrderKind = 'order' | 'quote'

/** Sipariş kanalı — nereden geldi */
export type Channel =
  | 'manual'         // admin panelden manuel
  | 'configurator'   // müşteri konfigüratörden
  | 'physical_store' // dükkanda elden
  | 'trendyol'
  | 'hepsiburada'
  | 'woocommerce'
  | 'shopify'
  | 'n11'

export type Order = {
  orderNo: string
  accessToken: string
  /** Default 'order' (geriye dönük uyumluluk için undefined da 'order' kabul edilir) */
  kind?: OrderKind
  /** Sipariş kaynağı kanalı (default 'manual') */
  channel?: Channel
  /** Dış platform referansı (Trendyol vs.) */
  externalRef?: {
    platform: Channel
    id: string
    rawPayload?: unknown
  }
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

/** Dış platform referansıyla sipariş ara — webhook idempotency için */
export function getByExternalRef(platform: Channel, id: string): Order | undefined {
  return load().orders.find(
    (o) => o.externalRef?.platform === platform && o.externalRef?.id === id,
  )
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

/** Tek üretim timeline (admin + müşteri ortak) */
export const PRODUCTION_TIMELINE: { status: OrderStatus; label: string; description: string }[] = [
  { status: 'received', label: 'Sipariş Alındı', description: 'Siparişiniz atölyemize ulaştı.' },
  { status: 'in_production', label: 'Üretimde', description: 'Aracınıza özel paspas üretiliyor — kalıp, kesim, dikim ve kalite kontrol.' },
  { status: 'ready', label: 'Hazır', description: 'Paspasınız hazır — kargo yolda veya dükkandan teslim almaya hazır.' },
  { status: 'delivered', label: 'Teslim Edildi', description: 'Aracınızda kullanım başlasın!' },
]

/** Müşteri tarafında gösterilen aşamalar = admin = aynı 4 */
export const CUSTOMER_TIMELINE = PRODUCTION_TIMELINE.map((t) => ({
  stage: t.status as CustomerStage,
  label: t.label,
  description: t.description,
}))
