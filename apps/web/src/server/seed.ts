/**
 * Seed — örnek 3 sipariş ekler (data dosyası boşsa).
 * Çalıştır: NODE_OPTIONS="--experimental-strip-types" node src/server/seed.ts
 * Veya production'da: ilk start'ta otomatik (entry-point hook).
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  insertOrder,
  generateOrderNo,
  generateToken,
  type Order,
  type OrderItem,
} from './db.ts'

const SAMPLES: Array<{
  customer: Order['customer']
  shippingAddress: Order['shippingAddress']
  item: Partial<OrderItem> & { matName: string; borderName: string; heelName: string }
  total: number
  paidAmount: number
  productionStatus: Order['productionStatus']
  paymentStatus: Order['paymentStatus']
  paymentMethod: Order['paymentMethod']
  deliveryMethod: 'cargo' | 'pickup'
  daysAgo: number
  customerNote?: string
  internalNote?: string
}> = [
  {
    customer: { fullName: 'Ahmet Yılmaz', phone: '0532 444 11 22', email: 'ahmet@example.com' },
    shippingAddress: {
      fullName: 'Ahmet Yılmaz',
      phone: '0532 444 11 22',
      city: 'İstanbul',
      district: 'Kadıköy',
      addressLine: 'Caferağa Mah. Moda Cad. No:12/4',
    },
    item: {
      brandSlug: 'bmw',
      brandName: 'BMW',
      modelSlug: '3-serisi-f30',
      modelName: '3 Serisi',
      modelChassis: 'F30',
      productSlug: '4lu-set',
      productName: "4'lü Set",
      productParts: 4,
      matSlug: 'siyah',
      matName: 'Siyah',
      matSwatchUrl: '/assets/swatches/mat-siyah.webp',
      borderSlug: 'kirmizi',
      borderName: 'Kırmızı',
      borderSwatchUrl: '/assets/swatches/border-kirmizi.webp',
      heelSlug: 'antrasit-karbon',
      heelName: 'Karbon Doku Antrasit',
      heelSwatchUrl: '/assets/heel-pads/heel-antrasit-karbon.webp',
      heelPadPassenger: true,
      logoBrandSlug: 'bmw',
      logoQty: 4,
      qty: 1,
    },
    total: 2740,
    paidAmount: 2740,
    productionStatus: 'in_production',
    paymentStatus: 'tamamlandi',
    paymentMethod: 'havale',
    deliveryMethod: 'cargo',
    daysAgo: 2,
    customerNote: 'Acil değil, sağlam paketleyin lütfen.',
  },
  {
    customer: { fullName: 'Ayşe Kaya', phone: '0535 123 45 67', email: 'ayse.k@example.com' },
    shippingAddress: {
      fullName: 'Ayşe Kaya',
      phone: '0535 123 45 67',
      city: 'Konya',
      district: 'Selçuklu',
      addressLine: 'Bosna Mah. Şehit Volkan Cad. No:34/2',
    },
    item: {
      brandSlug: 'dacia',
      brandName: 'Dacia',
      modelSlug: 'duster-2',
      modelName: 'Duster',
      modelChassis: 'Mk2',
      productSlug: '4lu-bagaj',
      productName: "4'lü + Bagaj",
      productParts: 5,
      matSlug: 'bej',
      matName: 'Bej',
      matSwatchUrl: '/assets/swatches/mat-bej.webp',
      borderSlug: 'kahve',
      borderName: 'Kahve',
      borderSwatchUrl: '/assets/swatches/border-kahve.webp',
      heelSlug: 'krem-noktali',
      heelName: 'Krem Noktalı',
      heelSwatchUrl: '/assets/heel-pads/heel-krem-noktali.webp',
      heelPadPassenger: false,
      logoBrandSlug: null,
      logoQty: 0,
      qty: 1,
    },
    total: 2490,
    paidAmount: 1000,
    productionStatus: 'received',
    paymentStatus: 'kismi',
    paymentMethod: 'havale',
    deliveryMethod: 'cargo',
    daysAgo: 1,
    internalNote: 'Müşteri kalan 1490 ₺ için bu hafta havale yapacağını söyledi.',
  },
  {
    customer: { fullName: 'Mehmet Demir', phone: '0533 987 65 43' },
    shippingAddress: {
      fullName: 'Mehmet Demir',
      phone: '0533 987 65 43',
      city: 'Konya',
      district: 'Meram',
      addressLine: 'Dükkanda teslim alacak',
    },
    item: {
      brandSlug: 'audi',
      brandName: 'Audi',
      modelSlug: 'a4-b9',
      modelName: 'A4',
      modelChassis: 'B9',
      productSlug: '4lu-set',
      productName: "4'lü Set",
      productParts: 4,
      matSlug: 'fume',
      matName: 'Füme',
      matSwatchUrl: '/assets/swatches/mat-fume.webp',
      borderSlug: 'siyah',
      borderName: 'Siyah',
      borderSwatchUrl: '/assets/swatches/border-siyah.webp',
      heelSlug: 'antrasit-karbon',
      heelName: 'Karbon Doku Antrasit',
      heelSwatchUrl: '/assets/heel-pads/heel-antrasit-karbon.webp',
      heelPadPassenger: true,
      logoBrandSlug: 'audi',
      logoQty: 4,
      qty: 1,
    },
    total: 2840,
    paidAmount: 2840,
    productionStatus: 'ready',
    paymentStatus: 'tamamlandi',
    paymentMethod: 'elden-nakit',
    deliveryMethod: 'pickup',
    daysAgo: 5,
  },
]

const day = 24 * 60 * 60 * 1000

async function run() {
  const dataDir = process.env.DATA_DIR ?? resolve(process.cwd(), '.data')
  const dataFile = resolve(dataDir, 'orders.json')
  if (existsSync(dataFile)) {
    try {
      const existing = JSON.parse(readFileSync(dataFile, 'utf8')) as { orders?: unknown[] }
      if (existing.orders && existing.orders.length > 0) {
        console.log(`Seed atlandı — ${existing.orders.length} sipariş mevcut.`)
        return
      }
    } catch {
      /* devam et */
    }
  }

  for (const s of SAMPLES) {
    const now = Date.now() - s.daysAgo * day
    const item = {
      ...s.item,
      seatMaterialSlug: undefined,
      seatColorSlug: undefined,
      seatFitmentBrand: undefined,
      steeringSize: undefined,
      steeringPatternSlug: undefined,
      steeringMaterialSlug: undefined,
      trimId: undefined,
      trimName: undefined,
      trimEngine: undefined,
      trimFuel: undefined,
      trimTransmission: undefined,
      trimPackage: undefined,
      unitPrice: s.total / (s.item.qty ?? 1),
    } as OrderItem

    const events: Order['events'] = [
      { status: 'received', at: now, note: 'Sipariş oluşturuldu.', by: 'seed' },
    ]
    if (
      s.productionStatus === 'in_production' ||
      s.productionStatus === 'ready' ||
      s.productionStatus === 'delivered'
    ) {
      events.push({ status: 'in_production', at: now + 1 * 60 * 60 * 1000, by: 'seed' })
    }
    if (s.productionStatus === 'ready' || s.productionStatus === 'delivered') {
      events.push({ status: 'ready', at: now + 2 * day, by: 'seed' })
    }
    if (s.productionStatus === 'delivered') {
      events.push({ status: 'delivered', at: now + 3 * day, by: 'seed' })
    }

    const order: Order = {
      orderNo: generateOrderNo(),
      accessToken: generateToken(),
      kind: 'order',
      channel: 'manual',
      customer: s.customer,
      shippingAddress: s.shippingAddress,
      items: [item],
      subtotal: s.total,
      shipping: 0,
      total: s.total,
      paidAmount: s.paidAmount,
      paymentMethod: s.paymentMethod,
      paymentStatus: s.paymentStatus,
      productionStatus: s.productionStatus,
      deliveryMethod: s.deliveryMethod,
      customerNote: s.customerNote,
      internalNote: s.internalNote,
      createdAt: now,
      paidAt: s.paymentStatus === 'tamamlandi' ? now + 60 * 60 * 1000 : undefined,
      events,
    }
    await insertOrder(order)
    console.log(`✓ ${order.orderNo} · ${order.customer.fullName} · ${s.productionStatus}`)
  }
  console.log('Seed tamamlandı.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
