/**
 * E-posta gönderim katmanı.
 *
 * Nodemailer + standart SMTP ile çalışır — sağlayıcıdan bağımsız.
 * Çalıştığı sağlayıcılar (env tanımına göre):
 *  - Brevo (eski Sendinblue)  : smtp-relay.brevo.com:587
 *  - Resend                   : smtp.resend.com:465 (SSL)
 *  - SendGrid                 : smtp.sendgrid.net:587
 *  - AWS SES                  : email-smtp.<region>.amazonaws.com:587
 *  - Gmail App Password       : smtp.gmail.com:587 (kişisel deneme için)
 *  - Self-hosted Postal       : <coolify-postal>:25 / 587
 *
 * Coolify env'leri (Application → Environment Variables):
 *   SMTP_HOST            (zorunlu, örn smtp-relay.brevo.com)
 *   SMTP_PORT            (zorunlu, örn 587)
 *   SMTP_SECURE          (true → 465 SSL, false → 587 STARTTLS)
 *   SMTP_USER            (zorunlu)
 *   SMTP_PASS            (zorunlu)
 *   SMTP_FROM            (zorunlu — örn 'Carmat <atolye@carmat.com.tr>')
 *   SMTP_REPLY_TO        (opsiyonel)
 *   ADMIN_EMAIL          (yeni talep bildirimleri için, virgülle çoklu)
 *
 * SMTP_HOST tanımlı değilse — bu modül "sessizce" devre dışı kalır,
 * mail göndermek yerine console'a log atar (dev / test için ideal).
 */
import nodemailer, { type Transporter } from 'nodemailer'

let cachedTransporter: Transporter | null | undefined  // undefined=henüz init değil, null=devre dışı

function getTransporter(): Transporter | null {
  if (cachedTransporter !== undefined) return cachedTransporter

  const host = process.env.SMTP_HOST
  if (!host) {
    cachedTransporter = null
    return null
  }
  const port = Number(process.env.SMTP_PORT ?? 587)
  const secure = process.env.SMTP_SECURE === 'true' || port === 465
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    tls: { rejectUnauthorized: process.env.SMTP_TLS_INSECURE !== 'true' },
  })
  return cachedTransporter
}

export type SendMailInput = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  /** Sıraya alıp arka planda yolla — false ise await edip dön (default: true) */
  background?: boolean
}

export type SendMailResult = {
  ok: boolean
  messageId?: string
  error?: string
  skipped?: boolean  // SMTP_HOST yoksa true
}

/**
 * E-posta yolla. SMTP_HOST tanımlı değilse "skipped" döner — uygulama akışı bozulmaz.
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const transporter = getTransporter()
  if (!transporter) {
    console.log(
      '[mail] SMTP_HOST tanımlı değil — log only:',
      JSON.stringify({ to: input.to, subject: input.subject }),
    )
    return { ok: true, skipped: true }
  }

  const from = process.env.SMTP_FROM ?? 'Carmat <atolye@carmat.com.tr>'
  const replyTo = input.replyTo ?? process.env.SMTP_REPLY_TO ?? undefined

  try {
    const info = await transporter.sendMail({
      from,
      to: input.to,
      cc: input.cc,
      bcc: input.bcc,
      replyTo,
      subject: input.subject,
      html: input.html,
      text: input.text ?? input.html.replace(/<[^>]+>/g, '').slice(0, 4000),
    })
    return { ok: true, messageId: info.messageId }
  } catch (e) {
    const error = (e as Error).message
    console.error('[mail] gönderim hatası:', error)
    return { ok: false, error }
  }
}

/**
 * Background sender — promise'ı await etmeden geri dönmek için.
 * Hata durumunda sadece console'a yazar, akışı bloke etmez.
 */
export function sendMailAsync(input: SendMailInput): void {
  void sendMail(input).catch((e) =>
    console.error('[mail] background gönderim hatası:', (e as Error).message),
  )
}

/* ─────────────────────────────────────────────────────────
   Hazır şablonlar
   ───────────────────────────────────────────────────────── */

const BRAND_HEADER_HTML = `
<div style="background:#0b0b0f;padding:24px 32px;text-align:center;border-bottom:2px solid #d4923a;">
  <div style="display:inline-block;font-family:'Inter',sans-serif;color:#d4923a;font-weight:700;font-size:24px;letter-spacing:-0.02em;">CARMAT</div>
  <div style="color:#8e8e94;font-size:11px;font-family:'Inter',sans-serif;letter-spacing:1px;text-transform:uppercase;margin-top:4px;">Aracına Özel · Konya Atölyesi</div>
</div>`

const BRAND_FOOTER_HTML = `
<div style="background:#0b0b0f;padding:20px 32px;text-align:center;border-top:1px solid #2a2a33;color:#8e8e94;font-family:'Inter',sans-serif;font-size:11px;line-height:1.6;">
  Carmat · Konya, Türkiye<br/>
  <a href="https://carmat.com.tr" style="color:#d4923a;text-decoration:none;">carmat.com.tr</a>
  · <a href="https://wa.me/905545417561" style="color:#d4923a;text-decoration:none;">WhatsApp</a>
  · <a href="mailto:destek@carmat.com.tr" style="color:#d4923a;text-decoration:none;">destek@carmat.com.tr</a>
</div>`

function shell(title: string, body: string): string {
  return `<!doctype html>
<html><body style="margin:0;background:#15151b;font-family:Inter,Arial,sans-serif;color:#f4ede0;">
  <div style="max-width:560px;margin:32px auto;background:#15151b;border:1px solid #2a2a33;border-radius:16px;overflow:hidden;">
    ${BRAND_HEADER_HTML}
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;letter-spacing:-0.01em;">${title}</h1>
      ${body}
    </div>
    ${BRAND_FOOTER_HTML}
  </div>
</body></html>`
}

/** Müşteriye: yeni teklif/sipariş onayı */
export async function sendQuoteReceivedMail(input: {
  to: string
  customerName: string
  orderNo: string
  total: number
  trackingUrl: string
}): Promise<SendMailResult> {
  return sendMail({
    to: input.to,
    subject: `Teklifiniz alındı — ${input.orderNo}`,
    html: shell(
      `Merhaba ${input.customerName},`,
      `
      <p style="line-height:1.6;color:#b4b4ba;">
        Aracınıza özel paspas talebiniz <strong style="color:#f4ede0;">${input.orderNo}</strong> numarasıyla atölyemize ulaştı.
        En geç <strong>1 iş günü içinde</strong> WhatsApp'tan size net fiyat teklifimizi ileteceğiz.
      </p>
      <table style="width:100%;margin:20px 0;border-collapse:collapse;">
        <tr>
          <td style="padding:12px;background:#1f1f26;border-radius:8px;">
            <div style="font-size:11px;color:#8e8e94;text-transform:uppercase;letter-spacing:1px;">Tahmini Tutar</div>
            <div style="font-size:24px;font-weight:700;color:#d4923a;margin-top:4px;">${input.total.toLocaleString('tr-TR')}₺</div>
            <div style="font-size:11px;color:#8e8e94;margin-top:4px;">(net fiyat WhatsApp'tan iletilir)</div>
          </td>
        </tr>
      </table>
      <a href="${input.trackingUrl}" style="display:inline-block;padding:12px 24px;background:#d4923a;color:#0b0b0f;font-weight:700;text-decoration:none;border-radius:8px;">Talebimi Takip Et</a>
      <p style="line-height:1.6;color:#8e8e94;font-size:12px;margin-top:24px;">
        Sorularınız için: WhatsApp +90 554 541 7561
      </p>
      `,
    ),
  })
}

/** Müşteriye: durum değişimi */
export async function sendStatusChangeMail(input: {
  to: string
  customerName: string
  orderNo: string
  status: string
  trackingUrl: string
}): Promise<SendMailResult> {
  return sendMail({
    to: input.to,
    subject: `Siparişiniz güncellendi — ${input.orderNo}`,
    html: shell(
      `Merhaba ${input.customerName},`,
      `
      <p style="line-height:1.6;color:#b4b4ba;">
        <strong style="color:#f4ede0;">${input.orderNo}</strong> numaralı siparişinizin durumu güncellendi:
      </p>
      <div style="margin:20px 0;padding:16px;background:#1f1f26;border-radius:8px;text-align:center;">
        <div style="font-size:24px;font-weight:700;color:#d4923a;">${input.status}</div>
      </div>
      <a href="${input.trackingUrl}" style="display:inline-block;padding:12px 24px;background:#d4923a;color:#0b0b0f;font-weight:700;text-decoration:none;border-radius:8px;">Detayları Gör</a>
      `,
    ),
  })
}

/** Admin'e: yeni talep bildirimi */
export async function sendAdminNewQuoteMail(input: {
  orderNo: string
  customerName: string
  customerPhone: string
  productSummary: string
  total: number
}): Promise<SendMailResult> {
  const adminEmails = (process.env.ADMIN_EMAIL ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  if (adminEmails.length === 0) return { ok: true, skipped: true }

  return sendMail({
    to: adminEmails,
    subject: `🔔 Yeni teklif: ${input.orderNo} — ${input.customerName}`,
    html: shell(
      `Yeni Teklif Talebi`,
      `
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#8e8e94;">Sipariş No</td><td style="padding:8px 0;font-family:monospace;color:#d4923a;font-weight:700;">${input.orderNo}</td></tr>
        <tr><td style="padding:8px 0;color:#8e8e94;">Müşteri</td><td style="padding:8px 0;">${input.customerName}</td></tr>
        <tr><td style="padding:8px 0;color:#8e8e94;">Telefon</td><td style="padding:8px 0;font-family:monospace;">${input.customerPhone}</td></tr>
        <tr><td style="padding:8px 0;color:#8e8e94;">Ürün</td><td style="padding:8px 0;">${input.productSummary}</td></tr>
        <tr><td style="padding:8px 0;color:#8e8e94;">Tutar</td><td style="padding:8px 0;font-weight:700;">${input.total.toLocaleString('tr-TR')}₺</td></tr>
      </table>
      <a href="https://carmat.com.tr/admin/quotes/${input.orderNo}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#d4923a;color:#0b0b0f;font-weight:700;text-decoration:none;border-radius:8px;">Admin'de Aç</a>
      `,
    ),
  })
}
