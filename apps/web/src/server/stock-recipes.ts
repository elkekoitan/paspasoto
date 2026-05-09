/**
 * Sipariş → hammadde tüketim formülleri.
 *
 * Her sipariş `in_production` durumuna geçince bu modül çağrılır,
 * ilgili `OrderItem`'ların kullanacağı SKU + miktar listesini hesaplar.
 *
 * NOT: Recipe'ler V1'de sabit. V2'de admin UI'dan editlenebilir hale getirilebilir.
 */
import type { Order, OrderItem } from './db'

/** Bir paspas için tüketim sabitleri */
const PER_MAT = {
  baseMeter: 0.55,        // ~55cm rulo
  borderKg: 0.08,         // ~80gr biye
  threadKg: 0.005,        // ~5gr iplik
}

/** Set tipi (productSlug) → kaç paspas içerir */
function partsOf(item: OrderItem): number {
  return item.productParts ?? 4
}

/**
 * Topukluk konum tercihi → kaç adet topukluk pedi.
 * Eski schema (heelPadPassenger boolean) için backward compat.
 */
function heelPadCount(item: OrderItem): number {
  if (item.heelPosition) {
    if (item.heelPosition === 'none') return 0
    if (item.heelPosition === 'both') return 2
    return 1 // driver-only veya passenger-only
  }
  // Legacy: heelPadPassenger true ise 2, değilse 1
  return item.heelPadPassenger ? 2 : 1
}

/**
 * Logo plakası adedi (per-mat veya legacy).
 */
function logoPlateCount(item: OrderItem): { brandSlug: string; count: number } | null {
  if (item.logos && item.logos.length > 0) {
    const active = item.logos.filter((l) => l.brandSlug !== null)
    if (active.length === 0) return null
    return { brandSlug: active[0]!.brandSlug!, count: active.length }
  }
  if (item.logoBrandSlug && item.logoQty > 0) {
    return { brandSlug: item.logoBrandSlug, count: item.logoQty }
  }
  return null
}

export type ConsumptionEntry = {
  sku: string
  delta: number  // negatif (tüketim)
  label: string  // human-readable, log için
}

/**
 * Bir order için toplam hammadde tüketimini hesapla.
 * Pozitif sayılar — apply ederken negatif yapacağız.
 */
export function computeConsumption(order: Order): ConsumptionEntry[] {
  const consumption = new Map<string, ConsumptionEntry>()

  function add(sku: string, qty: number, label: string) {
    const ex = consumption.get(sku)
    if (ex) ex.delta -= qty
    else consumption.set(sku, { sku, delta: -qty, label })
  }

  for (const item of order.items) {
    const qty = item.qty ?? 1
    const category = item.category ?? 'mat'

    if (category === 'mat') {
      const parts = partsOf(item) * qty

      // Mat tabanı (zemin renk SKU'su)
      const matSku = `MAT_BASE_${item.matSlug.toUpperCase()}`
      add(matSku, PER_MAT.baseMeter * parts, `Paspas tabanı (${item.matName})`)

      // Kenarlık biyesi
      const borderSku = `BORDER_${item.borderSlug.toUpperCase()}`
      add(borderSku, PER_MAT.borderKg * parts, `Kenarlık biye (${item.borderName})`)

      // İplik
      add('THREAD_GENERIC', PER_MAT.threadKg * parts, 'Dikiş ipliği')

      // Topukluk
      const heelCount = heelPadCount(item) * qty
      if (heelCount > 0) {
        const heelSku = `HEEL_PAD_${item.heelSlug.toUpperCase()}`
        add(heelSku, heelCount, `Topukluk pedi (${item.heelName})`)
      }

      // Logo plakaları
      const logo = logoPlateCount(item)
      if (logo) {
        const logoSku = `LOGO_PLATE_${logo.brandSlug.toUpperCase()}`
        add(logoSku, logo.count * qty, `${logo.brandSlug.toUpperCase()} amblem plakası`)
      }
    } else if (category === 'seat-cover') {
      // Koltuk kılıfı: malzeme metresi
      if (item.seatMaterialSlug) {
        const sku = `SEAT_FABRIC_${item.seatMaterialSlug.toUpperCase()}`
        // Bir 4'lü set ortalama 6 metre kumaş kullanır
        add(sku, 6 * qty, `Koltuk kumaşı (${item.seatMaterialSlug})`)
      }
    } else if (category === 'steering-cover') {
      // Direksiyon kılıfı: hazır parça (her sipariş 1 adet)
      const sku = `STEERING_${(item.steeringSize ?? 'M').toUpperCase()}_${(item.steeringPatternSlug ?? 'plain').toUpperCase()}`
      add(sku, qty, `Direksiyon kılıfı (${item.steeringSize ?? 'M'})`)
    }
  }

  // Paketleme (tüm siparişlere ortak — siparişe 1 set)
  add('PACKAGING_BOX', 1, 'Karton kutu')
  add('PACKAGING_NYLON', 1, 'Naylon ambalaj')
  add('PACKAGING_LABEL', 1, 'Kargo etiketi')

  return [...consumption.values()].filter((e) => e.delta !== 0)
}
