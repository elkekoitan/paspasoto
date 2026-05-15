/**
 * Aras Kargo Adapter — KARGOM REST API.
 *
 * Sandbox: https://customerws.araskargo.com.tr (KARGOM)
 * Production: https://customerservices.araskargo.com.tr
 *
 * Env:
 *   ARAS_USERNAME — KOBİ portal kullanıcı adı
 *   ARAS_PASSWORD — şifre
 *   ARAS_CUSTOMER_CODE — müşteri kodu (bayi)
 *   ARAS_API_URI — opsiyonel override
 *
 * Aras KARGOM API JSON-RPC tarzı çalışır.
 */
import type { ShippingAdapter, CreateShipmentInput, CreateShipmentResult, TrackResult } from './types'

const DEFAULT_URI = 'https://customerws.araskargo.com.tr'

function isConfigured(): boolean {
  return !!(process.env.ARAS_USERNAME && process.env.ARAS_PASSWORD && process.env.ARAS_CUSTOMER_CODE)
}

async function createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
  if (!isConfigured()) return { status: 'not_configured' }
  const { order, packageInfo } = input

  const payload = {
    UserName: process.env.ARAS_USERNAME,
    Password: process.env.ARAS_PASSWORD,
    CustomerCode: process.env.ARAS_CUSTOMER_CODE,
    Shipments: [{
      IntegrationCode: order.orderNo,
      ReceiverCustName: order.shippingAddress.fullName,
      ReceiverAddress: order.shippingAddress.addressLine,
      ReceiverCityName: order.shippingAddress.city,
      ReceiverTownName: order.shippingAddress.district,
      ReceiverPhone: order.shippingAddress.phone?.replace(/\D/g, ''),
      ReceiverEmail: order.customer.email ?? '',
      Desi: packageInfo.desi ?? Math.ceil(packageInfo.weight),
      Kg: packageInfo.weight,
      ItemDescription: packageInfo.description,
      PieceCount: 1,
    }],
  }

  try {
    const res = await fetch(`${process.env.ARAS_API_URI ?? DEFAULT_URI}/ArasCargoIntegrationService/SetOrder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return { status: 'error', message: `HTTP ${res.status}` }
    const data = await res.json().catch(() => null)
    if (!data || data.HasError) {
      return { status: 'error', message: data?.ErrorMessage ?? 'Aras hata' }
    }
    return {
      status: 'ok',
      trackingNumber: data.TrackingNumber ?? data.ShipmentNumber ?? order.orderNo,
      provider: 'aras',
    }
  } catch (e: any) {
    return { status: 'error', message: e?.message ?? 'Bağlantı hatası' }
  }
}

async function trackShipment(trackingNumber: string): Promise<TrackResult> {
  if (!isConfigured()) return { status: 'not_configured' }
  try {
    const res = await fetch(`${process.env.ARAS_API_URI ?? DEFAULT_URI}/ArasCargoIntegrationService/GetTrackingInfo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        UserName: process.env.ARAS_USERNAME,
        Password: process.env.ARAS_PASSWORD,
        CustomerCode: process.env.ARAS_CUSTOMER_CODE,
        TrackingNumber: trackingNumber,
      }),
    })
    if (!res.ok) return { status: 'error', message: `HTTP ${res.status}` }
    const data = await res.json().catch(() => null)
    if (!data) return { status: 'not_found' }
    return {
      status: 'ok',
      shipmentStatus: mapArasStatus(data.CargoStatus),
      events: data.Movements?.map((m: any) => ({
        at: m.Date, description: m.Description, location: m.Branch,
      })) ?? [],
      currentLocation: data.CurrentBranch,
    }
  } catch (e: any) {
    return { status: 'error', message: e?.message ?? 'Bağlantı hatası' }
  }
}

function mapArasStatus(s: string | number): any {
  const code = String(s)
  if (code.includes('teslim') || code === '5') return 'delivered'
  if (code.includes('dağıt') || code === '4') return 'out_for_delivery'
  if (code.includes('yolda') || code === '3') return 'in_transit'
  if (code.includes('alındı') || code === '2') return 'picked_up'
  return 'created'
}

export const arasAdapter: ShippingAdapter = {
  provider: 'aras',
  isConfigured,
  createShipment,
  trackShipment,
}
