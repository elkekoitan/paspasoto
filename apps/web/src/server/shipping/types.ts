/**
 * Kargo entegrasyon ortak tipleri.
 *
 * Provider-agnostik interface: Yurtiçi, Aras, MNG, Kargonomi gateway, vb.
 * Hepsi aynı `createShipment` + `trackShipment` kontratını uygular.
 */
import type { Order } from '../db'

export type ShippingProvider = 'yurtici' | 'aras' | 'mng' | 'surat' | 'ptt' | 'kargonomi' | 'shipentegra'

export type ShipmentStatus =
  | 'created'        // Barkod oluşturuldu, kargo henüz teslim alınmadı
  | 'picked_up'      // Kargo şubesi ürünü teslim aldı
  | 'in_transit'     // Yolda
  | 'out_for_delivery' // Dağıtımda
  | 'delivered'      // Teslim edildi
  | 'failed'         // Teslimat başarısız (müşteri bulunamadı, vb.)
  | 'returned'       // İade edildi

export type CreateShipmentInput = {
  order: Order
  /** Paket bilgisi (desi-kg, ağırlık) — paspas seti ~2-4 kg */
  packageInfo: {
    weight: number      // kg
    desi?: number       // desi-kg (genelde hesaplanır)
    description: string // "Aracına özel EVA paspas seti"
  }
}

export type CreateShipmentResult =
  | {
      status: 'ok'
      trackingNumber: string
      barcodeUrl?: string         // PDF/PNG barkod URL (atölye yazdırır)
      provider: ShippingProvider
      cost?: number                // Sözleşme fiyatı varsa
      estimatedDelivery?: string  // ISO date
    }
  | { status: 'not_configured' }
  | { status: 'error'; message: string }

export type TrackResult =
  | {
      status: 'ok'
      shipmentStatus: ShipmentStatus
      currentLocation?: string
      events: Array<{ at: string; description: string; location?: string }>
      lastUpdate?: string
    }
  | { status: 'not_configured' }
  | { status: 'not_found' }
  | { status: 'error'; message: string }

/** Provider adapter kontrat */
export interface ShippingAdapter {
  readonly provider: ShippingProvider
  /** Env'de credentials var mı? */
  isConfigured(): boolean
  /** Sipariş için kargo oluştur, barkod + takip no üret */
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>
  /** Takip numarası ile durum sorgula */
  trackShipment(trackingNumber: string): Promise<TrackResult>
}
