/**
 * Kargo provider registry — SHIPPING_PROVIDER env'ine göre aktif adapter seçer.
 *
 * Kullanım:
 *   import { getShippingAdapter } from '../server/shipping'
 *   const adapter = getShippingAdapter()
 *   if (adapter.isConfigured()) {
 *     const result = await adapter.createShipment({ order, packageInfo })
 *   }
 *
 * Env:
 *   SHIPPING_PROVIDER = 'yurtici' | 'aras' | 'kargonomi' (default: yurtici)
 */
import type { ShippingAdapter } from './types'
import { yurticiAdapter } from './yurtici'
import { arasAdapter } from './aras'
import { kargonomiAdapter } from './kargonomi'

const adapters: Record<string, ShippingAdapter> = {
  yurtici: yurticiAdapter,
  aras: arasAdapter,
  kargonomi: kargonomiAdapter,
}

export function getShippingAdapter(): ShippingAdapter {
  const provider = (process.env.SHIPPING_PROVIDER ?? 'yurtici').toLowerCase()
  return adapters[provider] ?? yurticiAdapter
}

export function listConfiguredAdapters(): ShippingAdapter[] {
  return Object.values(adapters).filter((a) => a.isConfigured())
}

export * from './types'
