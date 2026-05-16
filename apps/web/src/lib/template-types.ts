/**
 * Client + server'da paylaşılır mesaj şablon tipleri.
 */

export type TemplateKey =
  | 'order_received'
  | 'production_started'
  | 'ready_pickup'
  | 'ready_cargo'
  | 'delivered'
  | 'payment_reminder'
  | 'delay_notice'
  | 'feedback_request'

export type TemplateChannel = 'whatsapp' | 'email' | 'sms'

export interface MessageTemplate {
  key: TemplateKey
  label: string
  description: string
  /** Çoklu kanal — her kanalın kendi içeriği. */
  variants: {
    whatsapp?: string
    email?: { subject: string; body: string }
    sms?: string
  }
}

export const TEMPLATE_META: Record<TemplateKey, { label: string; description: string; whenStatus?: string }> = {
  order_received: { label: 'Sipariş Alındı', description: 'İlk sipariş onayı', whenStatus: 'received' },
  production_started: { label: 'Üretime Başladı', description: 'Üretim başlangıcı bildirimi', whenStatus: 'in_production' },
  ready_pickup: { label: 'Atölyeden Teslim Hazır', description: 'Pickup için hazır', whenStatus: 'ready' },
  ready_cargo: { label: 'Kargoya Verildi', description: 'Tracking no içerir', whenStatus: 'ready' },
  delivered: { label: 'Teslim Edildi', description: 'Memnuniyet talebi', whenStatus: 'delivered' },
  payment_reminder: { label: 'Ödeme Hatırlatma', description: 'Havale bekleyen sipariş' },
  delay_notice: { label: 'Gecikme Bildirimi', description: 'Üretim gecikti' },
  feedback_request: { label: 'Yorum İste', description: 'Memnuniyet anketi' },
}

/**
 * Yer tutucu doldur. Bilinen değişkenler: {customerName}, {orderNo},
 * {trackingNo}, {total}, {shippingCity}, {brand}, {model}
 */
export function renderTemplate(
  text: string,
  vars: Record<string, string | undefined>,
): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}
