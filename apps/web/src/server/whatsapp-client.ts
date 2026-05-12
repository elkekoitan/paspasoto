/**
 * Evolution API WhatsApp client.
 *
 * Carmat tam-otomatik WhatsApp gönderim için Evolution API'ye HTTP isteği atar.
 * Evolution API: open-source WhatsApp Business gateway — Coolify'a docker compose
 * ile self-host edilir, Carmat backend buraya REST request atar.
 *
 * Çalışma akışı:
 *  1. Evolution API container Coolify'da çalışır (örn. https://wa.carmat.com.tr)
 *  2. Admin Evolution API panelinde "carmat" instance oluşturur, QR scan ile
 *     atölyenin WhatsApp Business hesabı bağlanır
 *  3. Carmat backend bu modül üzerinden mesaj atar
 *
 * Env değişkenleri:
 *   EVOLUTION_API_URL=https://wa.carmat.com.tr
 *   EVOLUTION_API_KEY=<global apikey>
 *   EVOLUTION_INSTANCE_NAME=carmat
 *   WHATSAPP_AUTO_SEND=true|false  (false ise log only — debug için)
 *
 * Kurulum talimatı: docs/wiki/40-runbooks/evolution-api-setup.md
 */

export type WaSendResult = {
  ok: boolean
  messageId?: string
  error?: string
  skipped?: boolean
}

const BASE = process.env.EVOLUTION_API_URL
const KEY = process.env.EVOLUTION_API_KEY
const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME ?? 'carmat'
const AUTO_SEND = process.env.WHATSAPP_AUTO_SEND === 'true'

/** TR telefonunu Evolution API'nin beklediği uluslararası formata çevir (90XXXXXXXXXX). */
export function toEvolutionPhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('90') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 11) return '90' + digits.slice(1)
  if (digits.length === 10) return '90' + digits
  return digits
}

/**
 * WhatsApp metin mesajı gönder.
 *
 * - EVOLUTION_API_URL/KEY tanımlı değilse "skipped" döner (akış bozulmaz, dev için ideal)
 * - WHATSAPP_AUTO_SEND=false ise sadece console.log, gerçek istek atılmaz
 */
export async function sendWhatsAppText(
  toPhone: string,
  message: string,
): Promise<WaSendResult> {
  if (!BASE || !KEY) {
    console.log('[whatsapp] EVOLUTION_API_URL/KEY tanımsız — atlandı:', { toPhone, message: message.slice(0, 60) })
    return { ok: true, skipped: true }
  }
  if (!AUTO_SEND) {
    console.log('[whatsapp] WHATSAPP_AUTO_SEND=false — log only:', { toPhone, message: message.slice(0, 60) })
    return { ok: true, skipped: true }
  }

  const number = toEvolutionPhone(toPhone)
  if (!number) return { ok: false, error: 'Geçersiz telefon' }

  try {
    const res = await fetch(`${BASE.replace(/\/$/, '')}/message/sendText/${encodeURIComponent(INSTANCE)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: KEY,
      },
      body: JSON.stringify({
        number,
        options: {
          delay: 1200,
          presence: 'composing',
          linkPreview: false,
        },
        textMessage: { text: message },
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[whatsapp] gönderim hata:', res.status, text.slice(0, 200))
      return { ok: false, error: `HTTP ${res.status} — ${text.slice(0, 200)}` }
    }
    const data = (await res.json().catch(() => ({}))) as { key?: { id?: string } }
    return { ok: true, messageId: data?.key?.id }
  } catch (e) {
    console.error('[whatsapp] network hata:', (e as Error).message)
    return { ok: false, error: (e as Error).message }
  }
}

/** Background gönderim — fire-and-forget */
export function sendWhatsAppTextAsync(toPhone: string, message: string): void {
  void sendWhatsAppText(toPhone, message).catch((e) =>
    console.error('[whatsapp] background hata:', (e as Error).message),
  )
}

/* ─────────────────────────────────────────────────────────
   Hazır mesaj şablonları (Order durum değişimleri için)
   ───────────────────────────────────────────────────────── */

export function buildProductionStartedMessage(args: {
  customerName: string
  orderNo: string
  trackingUrl: string
}): string {
  const firstName = (args.customerName || '').split(/\s+/)[0] || 'Müşterimiz'
  return (
    `Merhaba ${firstName}, ${args.orderNo} numaralı siparişiniz Carmat atölyesinde üretime alındı! 🔧\n\n` +
    `📦 Takip linkiniz:\n${args.trackingUrl}\n\n` +
    `Üretim süresi yaklaşık 5-7 iş günü. Hazır olunca tekrar haber vereceğiz.\n\n` +
    `Sorularınız için: 0507 498 89 89\n— Carmat Atölye, Konya`
  )
}

export function buildReadyMessage(args: {
  customerName: string
  orderNo: string
  trackingUrl: string
  cargoTrackingNo?: string
  cargoCompany?: string
}): string {
  const firstName = (args.customerName || '').split(/\s+/)[0] || 'Müşterimiz'
  const cargoLine = args.cargoTrackingNo
    ? `🚚 ${args.cargoCompany ?? 'Kargo'}: ${args.cargoTrackingNo}\n`
    : '📍 Kargo bilgisi takip sayfasında yer alacak.\n'
  return (
    `Merhaba ${firstName}, ${args.orderNo} siparişiniz hazır! ✅\n\n` +
    cargoLine +
    `\n📦 Takip linkiniz:\n${args.trackingUrl}\n\n` +
    `Carmat'ı tercih ettiğiniz için teşekkürler 🙏\n— Carmat Atölye`
  )
}

export function buildDeliveredMessage(args: {
  customerName: string
  orderNo: string
}): string {
  const firstName = (args.customerName || '').split(/\s+/)[0] || 'Müşterimiz'
  return (
    `Merhaba ${firstName}, ${args.orderNo} siparişiniz teslim edildi! 🎉\n\n` +
    `Aracınızda kullanmaya başlayın. Memnun kaldıysanız Trendyol/Hepsiburada'da yorum yapmanızı çok memnun eder.\n\n` +
    `İade/değişim için: 0507 498 89 89\n— Carmat Atölye, Konya 🇹🇷`
  )
}
