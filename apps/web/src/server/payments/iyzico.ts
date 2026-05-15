/**
 * iyzico Tam Entegrasyon — Hosted Checkout (CheckoutFormInitialize).
 *
 * Akış:
 * 1. Müşteri /odeme'de iyzico seçer → POST /api/payments/iyzico/init
 * 2. createCheckoutSession() ile iyzipay sandbox/prod'a istek
 * 3. paymentPageUrl client'a döner → window.location ile yönlenir
 * 4. Müşteri iyzico hosted form'unda kart bilgilerini girer
 * 5. iyzico callback URL'sine POST yapar (token + status)
 * 6. retrieveCheckoutResult() ile doğrulanır, order güncellenir
 *
 * Env:
 *   IYZICO_API_KEY     — sandbox-... veya prod
 *   IYZICO_SECRET      — sandbox-... veya prod
 *   IYZICO_URI         — https://sandbox-api.iyzipay.com (default) veya https://api.iyzipay.com
 *   PUBLIC_SITE_URL    — https://carmat.com.tr (callback için)
 *
 * API key olmadan: 'not_configured' döner — UI radio "Yakında" gösterilir.
 */
import type { Order } from '../db'

// iyzipay SDK CommonJS — dynamic import server-side için
type IyzipayClient = {
  checkoutFormInitialize: {
    create: (req: object, cb: (err: unknown, result: { status?: string; paymentPageUrl?: string; token?: string; errorMessage?: string }) => void) => void
  }
  checkoutForm: {
    retrieve: (req: object, cb: (err: unknown, result: { status?: string; paymentStatus?: string; price?: number; paidPrice?: number; errorMessage?: string; basketId?: string }) => void) => void
  }
}

let _client: IyzipayClient | null = null
async function getClient(): Promise<IyzipayClient | null> {
  if (!process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET) return null
  if (_client) return _client
  try {
    // @ts-expect-error — iyzipay CommonJS default export
    const Iyzipay = (await import('iyzipay')).default
    _client = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET,
      uri: process.env.IYZICO_URI ?? 'https://sandbox-api.iyzipay.com',
    }) as IyzipayClient
    return _client
  } catch (e) {
    console.error('[iyzico] SDK init failed:', e)
    return null
  }
}

export type CheckoutSessionResult =
  | { status: 'ok'; paymentPageUrl: string; token: string }
  | { status: 'not_configured' }
  | { status: 'error'; message: string }

/** Order verisinden iyzico checkout form initialize çağrısı. */
export async function createCheckoutSession(order: Order): Promise<CheckoutSessionResult> {
  const client = await getClient()
  if (!client) return { status: 'not_configured' }

  const siteUrl = process.env.PUBLIC_SITE_URL ?? 'https://carmat.com.tr'
  const callbackUrl = `${siteUrl}/api/payments/iyzico/callback`

  // iyzico basketItems: her order item için ayrı satır
  const basketItems = order.items.map((it, idx) => ({
    id: `${order.orderNo}-${idx}`,
    name: `${it.brandName ?? it.productName ?? 'Ürün'} ${it.modelName ?? ''}`.trim().slice(0, 200),
    category1: it.category ?? 'mat',
    itemType: 'PHYSICAL',
    price: ((it.unitPrice ?? 0) * (it.qty ?? 1)).toFixed(2),
  }))

  // Kalem toplamı = subtotal; iyzico paidPrice ile basketItems toplamı eşit olmalı
  const subtotalCalc = order.items.reduce((s, it) => s + (it.unitPrice ?? 0) * (it.qty ?? 1), 0)

  // Müşteri adres bilgisi
  const phone = order.customer.phone?.replace(/\s/g, '') ?? '+905000000000'
  const buyer = {
    id: `BY-${order.orderNo}`,
    name: order.customer.fullName?.split(' ')[0] ?? 'Müşteri',
    surname: order.customer.fullName?.split(' ').slice(1).join(' ') ?? '.',
    gsmNumber: phone.startsWith('+') ? phone : `+90${phone.replace(/^0/, '')}`,
    email: order.customer.email ?? `${order.orderNo}@carmat.com.tr`,
    identityNumber: '11111111111',
    registrationAddress: order.shippingAddress.addressLine ?? 'Belirtilmedi',
    city: order.shippingAddress.city ?? 'Konya',
    country: 'Turkey',
    ip: '127.0.0.1',
  }
  const address = {
    contactName: order.shippingAddress.fullName ?? buyer.name,
    city: order.shippingAddress.city ?? 'Konya',
    country: 'Turkey',
    address: order.shippingAddress.addressLine ?? 'Belirtilmedi',
  }

  const req = {
    locale: 'tr',
    conversationId: order.orderNo,
    price: subtotalCalc.toFixed(2),
    paidPrice: order.total.toFixed(2),
    currency: 'TRY',
    basketId: order.orderNo,
    paymentGroup: 'PRODUCT',
    callbackUrl,
    enabledInstallments: [2, 3, 6, 9],
    buyer,
    shippingAddress: address,
    billingAddress: address,
    basketItems,
  }

  return new Promise<CheckoutSessionResult>((resolve) => {
    client.checkoutFormInitialize.create(req, (err, result) => {
      if (err) {
        console.error('[iyzico] init error:', err)
        resolve({ status: 'error', message: 'SDK hatası' })
        return
      }
      if (result.status !== 'success' || !result.paymentPageUrl || !result.token) {
        resolve({ status: 'error', message: result.errorMessage ?? 'iyzico checkout başlatılamadı' })
        return
      }
      resolve({ status: 'ok', paymentPageUrl: result.paymentPageUrl, token: result.token })
    })
  })
}

export type RetrieveResult =
  | { status: 'success'; orderNo: string; paidAmount: number }
  | { status: 'failure'; orderNo: string; message: string }
  | { status: 'not_configured' }
  | { status: 'error'; message: string }

/** Callback sonrası iyzico'dan ödeme sonucunu çek. */
export async function retrieveCheckoutResult(token: string): Promise<RetrieveResult> {
  const client = await getClient()
  if (!client) return { status: 'not_configured' }

  return new Promise<RetrieveResult>((resolve) => {
    client.checkoutForm.retrieve({ token, locale: 'tr' }, (err, result) => {
      if (err) {
        console.error('[iyzico] retrieve error:', err)
        resolve({ status: 'error', message: 'SDK hatası' })
        return
      }
      const orderNo = result.basketId ?? 'unknown'
      if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
        resolve({
          status: 'success',
          orderNo,
          paidAmount: Number(result.paidPrice ?? 0),
        })
      } else {
        resolve({
          status: 'failure',
          orderNo,
          message: result.errorMessage ?? `Status: ${result.paymentStatus ?? result.status}`,
        })
      }
    })
  })
}

/** Env durumu — UI'da iyzico opsiyonunun aktif olup olmadığını kontrol için */
export function isIyzicoConfigured(): boolean {
  return !!(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET)
}
