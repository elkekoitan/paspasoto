/**
 * Trendyol REST API Client.
 *
 * Webhook'a EK olarak — webhook gelmediği veya gözden kaçtığı durumlar için
 * doğrudan Trendyol API'sinden sipariş polling, ürün senkronizasyonu ve
 * webhook kayıt/silme işlemleri yapar.
 *
 * Auth: HTTP Basic — base64(API_KEY:API_SECRET)
 * Header: User-Agent: <SUPPLIER_ID> - SelfIntegration  (Trendyol zorunlu kılıyor)
 *
 * Tüm credential'lar runtime'da process.env'den okunur — kodda hardcoded YOK.
 * Coolify panelinden eklenecek env'ler:
 *   TRENDYOL_SUPPLIER_ID, TRENDYOL_API_KEY, TRENDYOL_API_SECRET,
 *   TRENDYOL_BASE_URL (default: https://apigw.trendyol.com)
 */

const TRENDYOL_BASE = process.env.TRENDYOL_BASE_URL ?? 'https://apigw.trendyol.com'

function getCreds() {
  const supplierId = process.env.TRENDYOL_SUPPLIER_ID
  const apiKey = process.env.TRENDYOL_API_KEY
  const apiSecret = process.env.TRENDYOL_API_SECRET
  if (!supplierId || !apiKey || !apiSecret) {
    throw new Error(
      'Trendyol API credentials eksik — TRENDYOL_SUPPLIER_ID, TRENDYOL_API_KEY, TRENDYOL_API_SECRET env tanımla',
    )
  }
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  return { supplierId, auth }
}

async function trendyolFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { supplierId, auth } = getCreds()
  const url = `${TRENDYOL_BASE}${path}`
  const headers = new Headers(init.headers ?? {})
  headers.set('Authorization', `Basic ${auth}`)
  headers.set('User-Agent', `${supplierId} - SelfIntegration`)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return fetch(url, { ...init, headers })
}

/* ─────────────────────────────────────────────────────────
   Bağlantı testi — credentials çalışıyor mu?
   ───────────────────────────────────────────────────────── */
export async function testConnection(): Promise<{
  ok: boolean
  status: number
  message: string
}> {
  try {
    const { supplierId } = getCreds()
    const res = await trendyolFetch(`/integration/sellers/${supplierId}/addresses`)
    if (res.ok) {
      return { ok: true, status: res.status, message: 'Bağlantı başarılı — supplier doğrulandı.' }
    }
    const text = await res.text()
    return {
      ok: false,
      status: res.status,
      message: `${res.status} ${res.statusText} — ${text.slice(0, 240)}`,
    }
  } catch (e) {
    return { ok: false, status: 0, message: (e as Error).message }
  }
}

/* ─────────────────────────────────────────────────────────
   Sipariş listesi (poll fallback)
   ───────────────────────────────────────────────────────── */
export type TrendyolOrder = {
  orderNumber: string
  status: string
  customerFirstName?: string
  customerLastName?: string
  customerEmail?: string
  totalPrice: number
  shippingAddress?: {
    firstName?: string
    lastName?: string
    address1?: string
    address2?: string
    city?: string
    district?: string
    gsm?: string
  }
  lines?: Array<{
    productCode?: string
    sku?: string
    productName?: string
    quantity: number
    price: number
    discount?: number
  }>
  orderDate: number
  shipmentPackageStatus?: string
  paymentType?: string
  paymentStatus?: string
}

export async function listOrders(opts: {
  startDate?: number
  endDate?: number
  status?: 'Created' | 'Picking' | 'Invoiced' | 'Shipped' | 'Cancelled' | 'Delivered'
  page?: number
  size?: number
} = {}): Promise<{ orders: TrendyolOrder[]; totalCount: number; page: number; size: number }> {
  const { supplierId } = getCreds()
  const params = new URLSearchParams()
  if (opts.startDate) params.set('startDate', String(opts.startDate))
  if (opts.endDate) params.set('endDate', String(opts.endDate))
  if (opts.status) params.set('status', opts.status)
  params.set('page', String(opts.page ?? 0))
  params.set('size', String(opts.size ?? 50))
  params.set('orderByField', 'PackageLastModifiedDate')
  params.set('orderByDirection', 'DESC')

  const res = await trendyolFetch(`/integration/order/sellers/${supplierId}/orders?${params.toString()}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Trendyol listOrders: ${res.status} ${text.slice(0, 240)}`)
  }
  const data = (await res.json()) as {
    content?: TrendyolOrder[]
    totalElements?: number
    page?: number
    size?: number
  }
  return {
    orders: data.content ?? [],
    totalCount: data.totalElements ?? 0,
    page: data.page ?? 0,
    size: data.size ?? 50,
  }
}

/* ─────────────────────────────────────────────────────────
   Webhook yönetimi
   ───────────────────────────────────────────────────────── */
export type TrendyolWebhook = {
  id?: string
  url: string
  username?: string
  password?: string
  authenticationType?: 'BASIC_AUTHENTICATION' | 'API_KEY' | 'NONE'
  subscribedStatuses: Array<
    | 'Created'
    | 'Picking'
    | 'Invoiced'
    | 'Shipped'
    | 'Cancelled'
    | 'Delivered'
    | 'UnDelivered'
    | 'UnDeliveredAndReturned'
    | 'Returned'
    | 'AtCollectionPoint'
    | 'UnSupplied'
  >
  status?: 'ACTIVE' | 'PASSIVE'
  apiKey?: string
}

export async function listWebhooks(): Promise<TrendyolWebhook[]> {
  const { supplierId } = getCreds()
  const res = await trendyolFetch(`/integration/webhook/sellers/${supplierId}/webhooks`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Trendyol listWebhooks: ${res.status} — ${text.slice(0, 240)}`)
  }
  const data = await res.json()
  return Array.isArray(data) ? data : (data?.content ?? [])
}

export async function createWebhook(spec: {
  url: string
  webhookSecret?: string
  statuses?: TrendyolWebhook['subscribedStatuses']
}): Promise<TrendyolWebhook> {
  const { supplierId } = getCreds()
  const body: TrendyolWebhook = {
    url: spec.url,
    authenticationType: spec.webhookSecret ? 'BASIC_AUTHENTICATION' : 'NONE',
    username: spec.webhookSecret ? 'carmat' : undefined,
    password: spec.webhookSecret,
    subscribedStatuses: spec.statuses ?? [
      'Created',
      'Picking',
      'Invoiced',
      'Shipped',
      'Cancelled',
      'Delivered',
      'Returned',
    ],
  }
  const res = await trendyolFetch(`/integration/webhook/sellers/${supplierId}/webhooks`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Trendyol createWebhook: ${res.status} ${text.slice(0, 300)}`)
  }
  return (await res.json()) as TrendyolWebhook
}

export async function deleteWebhook(webhookId: string): Promise<boolean> {
  const { supplierId } = getCreds()
  const res = await trendyolFetch(
    `/integration/webhook/sellers/${supplierId}/webhooks/${webhookId}`,
    { method: 'DELETE' },
  )
  return res.ok
}

/* ─────────────────────────────────────────────────────────
   Brand & Category lookup helpers (mapping UI için)
   ───────────────────────────────────────────────────────── */
export async function listBrands(query?: string): Promise<Array<{ id: number; name: string }>> {
  const path = query
    ? `/integration/product/brands/by-name?name=${encodeURIComponent(query)}`
    : `/integration/product/brands?page=0&size=200`
  const res = await trendyolFetch(path)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Trendyol listBrands: ${res.status} — ${text.slice(0, 240)}`)
  }
  const data = await res.json()
  return data?.brands ?? data?.content ?? []
}
