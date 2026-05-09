/**
 * Trendyol product code ↔ Carmat product mapping.
 *
 * Trendyol'da yayınlanan her ürünün barkod/sku'su Carmat tarafındaki
 * (productSlug + matSlug + borderSlug + heelSlug + brandSlug) kombinasyonuna eşlenir.
 *
 * V1: kod içinde sabit map. V2: /data/integration-mappings.json + admin UI.
 *
 * Eşleşme bulunmazsa adapter generic placeholder kullanır, admin manuel düzeltir.
 */
import type { OrderItem, Channel } from '../db'

export type ProductMapping = {
  externalCode: string                 // Trendyol product code / barcode
  /** Trendyol line item → OrderItem dönüşümü */
  toOrderItem: (line: any) => OrderItem
}

/**
 * Default mapping listesi. Atölye Trendyol'da hangi ürünleri açtıysa
 * burayı (veya admin UI'dan eklenecek json'ı) doldurması gerekir.
 *
 * Örnek: 'CARMAT-MAT-BMW-SIYAH-KIRMIZI-4LU' → BMW 4'lü siyah-kırmızı kombin.
 */
const TRENDYOL_MAPPINGS: ProductMapping[] = [
  // Kullanıcı kendi Trendyol product code'larını ekleyince buraya yazılır.
  // Örnek (placeholder, gerçek ürünler eklendiğinde silinecek):
  // {
  //   externalCode: 'CARMAT-MAT-BMW-SIYAH-KIRMIZI-4LU',
  //   toOrderItem: (l) => ({
  //     category: 'mat',
  //     brandSlug: 'bmw', brandName: 'BMW',
  //     modelSlug: '3-serisi-g20', modelName: '3 Serisi', modelChassis: 'G20/G21',
  //     productSlug: '4lu-set', productName: "4'lü Set", productParts: 4,
  //     matSlug: 'siyah', matName: 'Siyah', matSwatchUrl: '/assets/swatches/mat-siyah.webp',
  //     borderSlug: 'kirmizi', borderName: 'Kırmızı', borderSwatchUrl: '/assets/swatches/border-kirmizi.webp',
  //     heelSlug: 'standart', heelName: 'Standart Antrasit', heelSwatchUrl: '/assets/heel-pads/heel-standart.webp',
  //     heelPadPassenger: false, logoBrandSlug: null, logoQty: 0,
  //     qty: Number(l.quantity ?? 1), unitPrice: Number(l.price ?? 1990),
  //   }),
  // },
]

const REGISTRY: Record<string, ProductMapping[]> = {
  trendyol: TRENDYOL_MAPPINGS,
}

export function getMappingByExternalCode(platform: Channel, code: string): ProductMapping | undefined {
  return REGISTRY[platform]?.find((m) => m.externalCode === code)
}

export function listMappings(platform: Channel): ProductMapping[] {
  return REGISTRY[platform] ?? []
}
