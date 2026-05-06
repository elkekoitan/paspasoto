/**
 * Seed örnek siparişleri oluşturur.
 * Çalıştırma: node scripts/seed.mjs
 * Hedef dosya: apps/web/.data/orders.json (yoksa oluşturulur)
 *
 * 3 örnek sipariş:
 *  1) PO-260306-AB12 — üretimde (production_sewing), kısmi ödeme
 *  2) PO-260304-CD34 — kargoda (shipped), tamamen ödenmiş
 *  3) PO-260228-EF56 — teslim edildi (delivered), tamam
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, '..', 'apps', 'web', '.data')
const DATA_FILE = resolve(DATA_DIR, 'orders.json')

const SWATCH = '/assets/swatches'
const HEEL = '/assets/heel-pads'

const day = 24 * 60 * 60 * 1000
const now = Date.now()

const orders = [
  {
    orderNo: 'PO-260306-AB12',
    accessToken: randomUUID(),
    customer: {
      fullName: 'Mehmet Aksoy',
      phone: '0532 412 88 17',
      email: 'mehmet.aksoy@example.com',
    },
    shippingAddress: {
      fullName: 'Mehmet Aksoy',
      phone: '0532 412 88 17',
      city: 'Konya',
      district: 'Selçuklu',
      addressLine: 'Beyhekim Mah. Şehit Erol Olçok Cd. No:14 D:7',
    },
    items: [
      {
        brandSlug: 'bmw',
        brandName: 'BMW',
        modelSlug: '3-serisi-g20',
        modelName: '3 Serisi',
        modelChassis: 'G20',
        productSlug: '4lu-bagaj',
        productName: "4'lü + Bagaj",
        productParts: 5,
        matSlug: 'siyah',
        matName: 'Siyah',
        matSwatchUrl: `${SWATCH}/mat-siyah.webp`,
        borderSlug: 'kirmizi',
        borderName: 'Kırmızı',
        borderSwatchUrl: `${SWATCH}/border-kirmizi.webp`,
        heelSlug: 'antrasit-karbon',
        heelName: 'Karbon Doku Antrasit',
        heelSwatchUrl: `${HEEL}/heel-antrasit-karbon.webp`,
        heelPadPassenger: true,
        logoBrandSlug: 'bmw',
        logoQty: 2,
        qty: 1,
        unitPrice: 2840,
      },
    ],
    subtotal: 2840,
    shipping: 0,
    total: 2840,
    paidAmount: 1500,
    paymentMethod: 'havale',
    paymentStatus: 'kismi',
    productionStatus: 'production_sewing',
    customerNote: 'Sürücü tarafına yolcu topukluğu da olsun. Acelem yok ama şık olsun.',
    internalNote: 'Müşteri eski müşteri, daha önce Passat sipariş etmiş. Topukluk diyagonal yerleşim istiyor.',
    createdAt: now - 4 * day,
    paidAt: now - 3 * day,
    events: [
      { status: 'received', at: now - 4 * day, note: 'WhatsApp üzerinden alındı' },
      { status: 'awaiting_payment', at: now - 4 * day + 60 * 60 * 1000 },
      { status: 'payment_confirmed', at: now - 3 * day, note: 'Kapora 1500 TL alındı' },
      { status: 'production_started', at: now - 3 * day + 4 * 60 * 60 * 1000 },
      { status: 'production_cutting', at: now - 2 * day },
      { status: 'production_sewing', at: now - 1 * day, note: 'Kenar dikimi başladı' },
    ],
  },
  {
    orderNo: 'PO-260304-CD34',
    accessToken: randomUUID(),
    customer: {
      fullName: 'Elif Yıldız',
      phone: '0507 318 22 49',
    },
    shippingAddress: {
      fullName: 'Elif Yıldız',
      phone: '0507 318 22 49',
      city: 'Ankara',
      district: 'Çankaya',
      addressLine: 'Kavaklıdere Mah. Tunalı Hilmi Cd. No:88 K:3 D:9',
    },
    items: [
      {
        brandSlug: 'volkswagen',
        brandName: 'Volkswagen',
        modelSlug: 'passat-b8',
        modelName: 'Passat',
        modelChassis: 'B8',
        productSlug: '4lu-set',
        productName: "4'lü Set",
        productParts: 4,
        matSlug: 'fume',
        matName: 'Füme',
        matSwatchUrl: `${SWATCH}/mat-fume.webp`,
        borderSlug: 'lacivert',
        borderName: 'Lacivert',
        borderSwatchUrl: `${SWATCH}/border-lacivert.webp`,
        heelSlug: 'standart',
        heelName: 'Standart Antrasit',
        heelSwatchUrl: `${HEEL}/heel-standart.webp`,
        heelPadPassenger: false,
        logoBrandSlug: 'volkswagen',
        logoQty: 4,
        qty: 1,
        unitPrice: 2590,
      },
    ],
    subtotal: 2590,
    shipping: 0,
    total: 2590,
    paidAmount: 2590,
    paymentMethod: 'havale',
    paymentStatus: 'tamamlandi',
    productionStatus: 'shipped',
    customerNote: 'Hızlı teslim olursa çok memnun olurum, doğum günü hediyesi.',
    cargoCompany: 'yurtici',
    cargoTrackingNo: '1234567890123',
    createdAt: now - 9 * day,
    paidAt: now - 9 * day + 6 * 60 * 60 * 1000,
    shippedAt: now - 1 * day,
    events: [
      { status: 'received', at: now - 9 * day, note: 'Telefon ile alındı' },
      { status: 'payment_confirmed', at: now - 9 * day + 6 * 60 * 60 * 1000, note: 'Tam ödeme havale' },
      { status: 'production_started', at: now - 8 * day },
      { status: 'production_cutting', at: now - 7 * day },
      { status: 'production_sewing', at: now - 5 * day },
      { status: 'quality_check', at: now - 2 * day },
      { status: 'shipped', at: now - 1 * day, note: 'Yurtiçi Kargo · 1234567890123' },
    ],
  },
  {
    orderNo: 'PO-260228-EF56',
    accessToken: randomUUID(),
    customer: {
      fullName: 'Hasan Demir',
      phone: '0533 887 14 02',
      email: 'hasandemir@example.com',
    },
    shippingAddress: {
      fullName: 'Hasan Demir',
      phone: '0533 887 14 02',
      city: 'İzmir',
      district: 'Karşıyaka',
      addressLine: 'Bostanlı Mah. Cemal Gürsel Cd. No:312 D:5',
    },
    items: [
      {
        brandSlug: 'audi',
        brandName: 'Audi',
        modelSlug: 'a4-b9',
        modelName: 'A4',
        modelChassis: 'B9',
        productSlug: '4lu-bagaj',
        productName: "4'lü + Bagaj",
        productParts: 5,
        matSlug: 'taba',
        matName: 'Taba',
        matSwatchUrl: `${SWATCH}/mat-taba.webp`,
        borderSlug: 'kahve',
        borderName: 'Kahve',
        borderSwatchUrl: `${SWATCH}/border-kahve.webp`,
        heelSlug: 'beyaz-noktali',
        heelName: 'Beyaz Karbon',
        heelSwatchUrl: `${HEEL}/heel-beyaz-noktali.webp`,
        heelPadPassenger: true,
        logoBrandSlug: 'audi',
        logoQty: 2,
        qty: 1,
        unitPrice: 2990,
      },
    ],
    subtotal: 2990,
    shipping: 0,
    total: 2990,
    paidAmount: 2990,
    paymentMethod: 'kapida',
    paymentStatus: 'tamamlandi',
    productionStatus: 'delivered',
    customerNote: '',
    internalNote: 'Teslimden sonra Google yorum istedik, müşteri çok memnun.',
    cargoCompany: 'aras',
    cargoTrackingNo: '9876543210987',
    createdAt: now - 18 * day,
    paidAt: now - 4 * day,
    shippedAt: now - 6 * day,
    deliveredAt: now - 4 * day,
    events: [
      { status: 'received', at: now - 18 * day },
      { status: 'production_started', at: now - 17 * day },
      { status: 'production_cutting', at: now - 15 * day },
      { status: 'production_sewing', at: now - 12 * day },
      { status: 'quality_check', at: now - 8 * day },
      { status: 'shipped', at: now - 6 * day, note: 'Aras Kargo · 9876543210987' },
      { status: 'delivered', at: now - 4 * day, note: 'Kapıda nakit tahsilat' },
    ],
  },
]

const data = { orders, meta: { version: 1 } }

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')

console.log(`✓ ${orders.length} örnek sipariş yazıldı: ${DATA_FILE}`)
for (const o of orders) {
  console.log(`  · ${o.orderNo}  ${o.customer.fullName.padEnd(16)}  ${o.productionStatus.padEnd(20)}  token=${o.accessToken.slice(0, 8)}…`)
}
