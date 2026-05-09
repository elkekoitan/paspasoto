/**
 * Platform adapter registry.
 *
 * Yeni platform eklerken bu dosyada bir entry eklemek + adapter sınıfını import etmek yeterli.
 */
import type { Channel } from '../db'
import type { PlatformAdapter } from './types'
import { trendyolAdapter } from './trendyol'
import { hepsiburadaAdapter } from './hepsiburada'

const REGISTRY: Partial<Record<Channel, PlatformAdapter>> = {
  trendyol: trendyolAdapter,
  hepsiburada: hepsiburadaAdapter,
  // woocommerce: woocommerceAdapter,
  // shopify: shopifyAdapter,
  // n11: n11Adapter,
}

export function getAdapter(platform: Channel): PlatformAdapter | undefined {
  return REGISTRY[platform]
}

export function listAdapters(): PlatformAdapter[] {
  return Object.values(REGISTRY).filter(Boolean) as PlatformAdapter[]
}
