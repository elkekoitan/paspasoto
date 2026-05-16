/**
 * message-templates.ts — Müşteri bildirim şablonları JSON store.
 *
 * /data/templates.json — admin tarafından düzenlenir. Default'lar
 * (DEFAULT_TEMPLATES) iç bellek, dosya yoksa veya alan eksikse fallback olur.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'
import type { TemplateKey, MessageTemplate } from '../lib/template-types'

export type { TemplateKey, MessageTemplate, TemplateChannel } from '../lib/template-types'
export { TEMPLATE_META, renderTemplate } from '../lib/template-types'

const DATA_DIR = process.env.DATA_DIR ?? resolve(process.cwd(), '.data')
const FILE = resolve(DATA_DIR, 'templates.json')

const DEFAULT_TEMPLATES: Record<TemplateKey, MessageTemplate> = {
  order_received: {
    key: 'order_received',
    label: 'Sipariş Alındı',
    description: 'İlk sipariş onayı',
    variants: {
      whatsapp: 'Merhaba {customerName}, {orderNo} numaralı siparişiniz alındı ✓ Üretime gönderdik, 2-3 iş günü içinde kargoya vereceğiz. — Carmat',
      email: { subject: 'Siparişiniz alındı — {orderNo}', body: 'Merhaba {customerName},\n\nSiparişiniz başarıyla alındı. Sipariş numaranız: {orderNo}\n\nToplam: {total} ₺\nTeslimat: {shippingCity}\n\nÜretim ortalama 2-3 iş günü sürer. Kargoya verildiğinde takip numarası ile bilgilendireceğiz.\n\nSorularınız için: +90 544 710 81 15\n\nCarmat ekibi' },
    },
  },
  production_started: {
    key: 'production_started',
    label: 'Üretime Başladı',
    description: 'Üretim başlangıcı bildirimi',
    variants: {
      whatsapp: '{customerName}, {orderNo} siparişiniz atölyemizde üretime girdi 🔨 2-3 gün içinde hazır olacak. — Carmat',
      email: { subject: 'Üretime alındı — {orderNo}', body: 'Merhaba {customerName},\n\n{orderNo} numaralı siparişiniz üretime alındı. Tahmini hazır olma süresi 2-3 iş günü.\n\nCarmat' },
    },
  },
  ready_pickup: {
    key: 'ready_pickup',
    label: 'Atölyeden Teslim Hazır',
    description: 'Pickup için hazır',
    variants: {
      whatsapp: '{customerName}, {orderNo} paspasınız hazır 🎉 Atölyemizden uygun zamanda teslim alabilirsiniz: Fevzi Çakmak Mah. 10733. Sk. No: 1, Karatay/Konya. — Carmat',
      email: { subject: 'Siparişiniz hazır — {orderNo}', body: 'Merhaba {customerName},\n\n{orderNo} numaralı siparişiniz hazır. Atölyemizden teslim alabilirsiniz:\n\nFevzi Çakmak Mah. 10733. Sk. No: 1, Karatay/Konya\n\nÇalışma saatleri: 09:00-19:00\n\nCarmat' },
    },
  },
  ready_cargo: {
    key: 'ready_cargo',
    label: 'Kargoya Verildi',
    description: 'Tracking no içerir',
    variants: {
      whatsapp: '{customerName}, {orderNo} paspasınız kargoya verildi 📦\n\nKargo takip no: {trackingNo}\n\n1-2 iş günü içinde elinizde olur. — Carmat',
      email: { subject: 'Kargoya verildi — {orderNo}', body: 'Merhaba {customerName},\n\n{orderNo} siparişiniz kargoya verildi.\n\nTakip numarası: {trackingNo}\n\nTahmini teslim 1-2 iş günü.\n\nCarmat' },
    },
  },
  delivered: {
    key: 'delivered',
    label: 'Teslim Edildi',
    description: 'Memnuniyet talebi',
    variants: {
      whatsapp: '{customerName}, paspasınız size ulaştı, umarız memnun kalmışsınızdır! 🙏 Görüşlerinizi paylaşırsanız çok seviniriz: carmat.com.tr. — Carmat',
      email: { subject: 'Memnun kaldınız mı? — {orderNo}', body: 'Merhaba {customerName},\n\nPaspasınızı kullanmaya başladınız mı? Görüşleriniz bizim için çok değerli.\n\nİsterseniz site üzerinden yorum bırakabilirsiniz.\n\nCarmat' },
    },
  },
  payment_reminder: {
    key: 'payment_reminder',
    label: 'Ödeme Hatırlatma',
    description: 'Havale bekleyen sipariş',
    variants: {
      whatsapp: '{customerName}, {orderNo} siparişinizin ödemesini bekliyoruz. Üretime başlayabilmemiz için havale yapmanızı rica ederiz.\n\nTutar: {total} ₺\n\nIBAN için yazışmamıza bakabilirsiniz. — Carmat',
      email: { subject: 'Ödeme bekleniyor — {orderNo}', body: 'Merhaba {customerName},\n\n{orderNo} siparişinizin {total} ₺ tutarındaki ödemesini bekliyoruz.\n\nÖdeme yapıldıktan sonra üretime başlıyoruz.\n\nCarmat' },
    },
  },
  delay_notice: {
    key: 'delay_notice',
    label: 'Gecikme Bildirimi',
    description: 'Üretim gecikti',
    variants: {
      whatsapp: '{customerName}, üretimimizde kısa bir gecikme yaşandı. {orderNo} paspasınız bir gün geç hazır olacak, bilgilendirmek istedik. Anlayışınız için teşekkürler. — Carmat',
      email: { subject: 'Küçük gecikme — {orderNo}', body: 'Merhaba {customerName},\n\nÜretimde küçük bir gecikme yaşandı. {orderNo} siparişiniz tahminimizden bir gün geç hazır olacak.\n\nAnlayışınız için teşekkür ederiz.\n\nCarmat' },
    },
  },
  feedback_request: {
    key: 'feedback_request',
    label: 'Yorum İste',
    description: 'Memnuniyet anketi',
    variants: {
      whatsapp: '{customerName}, paspasınızı ne kadar süredir kullanıyorsunuz? 🚗 Memnun kaldıysanız Trendyol veya Google\'da yorum bırakırsanız çok seviniriz! — Carmat',
      email: { subject: 'Yorumunuz bizim için değerli', body: 'Merhaba {customerName},\n\nPaspasınızı kullanmaya başlayalı bir süre oldu. Memnun kaldıysanız Google veya Trendyol\'da yorum bırakırsanız bize çok yardımcı olur.\n\nTeşekkürler!\n\nCarmat' },
    },
  },
}

function ensure() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(FILE)) {
    writeFileSync(FILE, JSON.stringify(DEFAULT_TEMPLATES, null, 2), 'utf8')
  }
}

let _q: Promise<unknown> = Promise.resolve()

function read(): Record<TemplateKey, MessageTemplate> {
  ensure()
  try {
    const raw = JSON.parse(readFileSync(FILE, 'utf8')) as Partial<Record<TemplateKey, MessageTemplate>>
    // Default'larla merge — eksik key'ler default'tan gelir
    const merged = { ...DEFAULT_TEMPLATES } as Record<TemplateKey, MessageTemplate>
    for (const k of Object.keys(raw) as TemplateKey[]) {
      if (raw[k]) merged[k] = raw[k]!
    }
    return merged
  } catch {
    return { ...DEFAULT_TEMPLATES }
  }
}

function write(db: Record<TemplateKey, MessageTemplate>): Promise<void> {
  _q = _q.then(() => {
    const tmp = FILE + '.tmp'
    writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8')
    renameSync(tmp, FILE)
  })
  return _q as Promise<void>
}

export function listTemplates(): MessageTemplate[] {
  return Object.values(read())
}

export function getTemplate(key: TemplateKey): MessageTemplate | undefined {
  return read()[key]
}

export async function setTemplate(key: TemplateKey, patch: Partial<MessageTemplate>): Promise<MessageTemplate> {
  const db = read()
  db[key] = { ...db[key], ...patch, key }
  await write(db)
  return db[key]
}

export async function resetTemplate(key: TemplateKey): Promise<MessageTemplate> {
  const db = read()
  db[key] = DEFAULT_TEMPLATES[key]
  await write(db)
  return db[key]
}
