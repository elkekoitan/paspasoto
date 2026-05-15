/**
 * WhatsApp helper — wa.me deeplink üretici.
 *
 * Carmat MVP'de tam otomatik mesaj gönderimi YOK (Meta WhatsApp Business API
 * lisans + onay gerektirir). Bunun yerine yarı-otomatik akış:
 *   - Admin order detail sayfasında "📲 WhatsApp Bildir" butonu
 *   - Tıklandığında atölye telefonundaki WhatsApp Business açılır
 *   - Mesaj prefilled (sipariş no + takip linki + atölye iletişim)
 *   - Admin "Send" basar → müşteriye gerçek WhatsApp mesajı gider
 *
 * V2'de Meta Cloud API entegrasyonu için:
 *   apps/web/src/server/whatsapp-api.ts (Twilio veya Meta Graph API client)
 *   Aylık 1000 mesaj ücretsiz; sonra ~$0.005/mesaj.
 */

import type { Order } from '../server/db'

/**
 * Türkiye telefon numarasını uluslararası WhatsApp formatına çevirir.
 * - "0532 123 45 67"  → "905321234567"
 * - "+90 532 123 45 67" → "905321234567"
 * - "905321234567"     → "905321234567" (no-op)
 * - "5321234567"       → "905321234567" (eksikse 90 ekle)
 */
export function toIntlWhatsAppPhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('90') && digits.length === 12) return digits  // +90 5XX XXX XX XX
  if (digits.startsWith('0') && digits.length === 11) return '90' + digits.slice(1)  // 0 + 10 hane
  if (digits.length === 10) return '90' + digits  // başında 0 yok, 10 hane
  return digits  // anormal — olduğu gibi (Trendyol'dan farklı format gelebilir)
}

/** Sipariş takip URL'ini üret. */
export function buildTrackingUrl(orderNo: string, accessToken: string, siteUrl?: string): string {
  const base = siteUrl ?? process.env.PUBLIC_SITE_URL ?? 'https://carmat.com.tr'
  return `${base}/siparis-takip/detay?o=${encodeURIComponent(orderNo)}&t=${encodeURIComponent(accessToken)}`
}

/**
 * Üretime alındığında müşteriye gönderilecek WhatsApp mesajı için wa.me deeplink üretir.
 * Admin tıklayınca atölye telefonundaki WhatsApp açılır, mesaj hazır.
 */
export function buildProductionStartedWaUrl(order: Order, siteUrl?: string): string {
  const phone = toIntlWhatsAppPhone(order.customer.phone)
  if (!phone) return ''
  const trackUrl = buildTrackingUrl(order.orderNo, order.accessToken, siteUrl)
  const firstName = (order.customer.fullName || '').split(/\s+/)[0] || 'Müşterimiz'
  const text = encodeURIComponent(
    `Merhaba ${firstName}, ${order.orderNo} numaralı siparişiniz Carmat atölyesinde üretime alındı! 🔧\n\n` +
      `📦 Takip linkiniz:\n${trackUrl}\n\n` +
      `Üretim süresi yaklaşık 2-3 iş günü. Hazır olunca tekrar haber vereceğiz.\n\n` +
      `Sorularınız için: 0544 710 81 15\n— Carmat Atölye, Konya 🇹🇷`,
  )
  return `https://wa.me/${phone}?text=${text}`
}

/**
 * Sipariş hazır olduğunda gönderilecek WhatsApp mesajı için wa.me deeplink.
 */
export function buildReadyWaUrl(order: Order, siteUrl?: string): string {
  const phone = toIntlWhatsAppPhone(order.customer.phone)
  if (!phone) return ''
  const trackUrl = buildTrackingUrl(order.orderNo, order.accessToken, siteUrl)
  const firstName = (order.customer.fullName || '').split(/\s+/)[0] || 'Müşterimiz'
  const cargoNo = order.cargoTrackingNo
  const cargoLine = cargoNo
    ? `🚚 Kargo no: ${cargoNo}\n`
    : `📍 Kargo bilgisi sipariş takip sayfanızda yer alacak.\n`
  const text = encodeURIComponent(
    `Merhaba ${firstName}, ${order.orderNo} numaralı siparişiniz hazır! ✅\n\n` +
      cargoLine +
      `\n📦 Takip linkiniz:\n${trackUrl}\n\n` +
      `Carmat'ı tercih ettiğiniz için teşekkür ederiz. Memnun kaldıysanız Trendyol/Hepsiburada'da yorum yapmanızı çok memnun ederiz 🙏\n\n` +
      `— Carmat Atölye, Konya`,
  )
  return `https://wa.me/${phone}?text=${text}`
}

/**
 * Genel destek WhatsApp linki — atölyeye soru sor (Base.astro floating button).
 */
export function getSupportWaUrl(): string {
  return 'https://wa.me/905447108115?text=Merhaba%2C+aracıma+özel+paspas+hakkında+bir+sorum+var.'
}

/**
 * "Emin Değilim" — Konfigüratör halındaki seçimleri WhatsApp'a iletir.
 * Atölye gelen config'i okur, müşteriye uygun öneri yapar.
 */
export function buildHelpRequestUrl(state: {
  brandName?: string
  modelName?: string
  modelChassis?: string
  productName?: string
  matColorName?: string
  borderColorName?: string
  heelName?: string
  totalPrice?: number
}): string {
  const lines = ['Merhaba, paspas konfigürasyonumda emin değilim. Tavsiye eder misiniz?', '']
  if (state.brandName) lines.push(`🚗 Araç: ${state.brandName} ${state.modelName ?? ''} ${state.modelChassis ?? ''}`.trim())
  if (state.productName) lines.push(`📦 Set: ${state.productName}`)
  if (state.matColorName) lines.push(`🎨 Zemin: ${state.matColorName}`)
  if (state.borderColorName) lines.push(`🪡 Kenarlık: ${state.borderColorName}`)
  if (state.heelName) lines.push(`👟 Topukluk: ${state.heelName}`)
  if (state.totalPrice) lines.push(`💰 Tahmini: ${state.totalPrice.toLocaleString('tr-TR')}₺`)
  lines.push('', 'Bu kombinasyona ne dersiniz? Daha iyi bir öneriniz var mı?')
  const text = encodeURIComponent(lines.join('\n'))
  return `https://wa.me/905447108115?text=${text}`
}

/**
 * Sipariş üzerinden Carmat atölyesine direkt WhatsApp — admin değil müşteri için.
 * (örn. /siparis-takip/detay sayfasında "Atölye ile iletişim" butonu)
 */
export function getOrderSupportWaUrl(orderNo: string): string {
  const text = encodeURIComponent(
    `Merhaba, ${orderNo} numaralı siparişim hakkında bir sorum var.`,
  )
  return `https://wa.me/905447108115?text=${text}`
}
