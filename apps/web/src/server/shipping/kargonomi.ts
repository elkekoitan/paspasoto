/**
 * Kargonomi Gateway Adapter — multi-kargo tek API.
 *
 * Kargonomi: https://api.kargonomi.com.tr (gerçek URL anahtara göre değişir)
 *
 * Env:
 *   KARGONOMI_API_KEY — Kargonomi merchant API anahtarı
 *   KARGONOMI_API_URI — opsiyonel override
 *
 * Avantaj: Yurtiçi/Aras/MNG/Sürat/PTT/UPS/FedEx — hepsi tek bağlantı
 * üzerinden. Müşteri en uygun fiyatı seçer.
 */
import type { ShippingAdapter, CreateShipmentInput, CreateShipmentResult, TrackResult } from './types'

const DEFAULT_URI = 'https://api.kargonomi.com.tr/v1'

function isConfigured(): boolean {
  return !!process.env.KARGONOMI_API_KEY
}

async function createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
  if (!isConfigured()) return { status: 'not_configured' }
  const { order, packageInfo } = input

  const payload = {
    order_number: order.orderNo,
    receiver: {
      name: order.shippingAddress.fullName,
      phone: order.shippingAddress.phone,
      email: order.customer.email,
      address: order.shippingAddress.addressLine,
      city: order.shippingAddress.city,
      district: order.shippingAddress.district,
    },
    package: {
      weight_kg: packageInfo.weight,
      desi: packageInfo.desi ?? Math.ceil(packageInfo.weight),
      description: packageInfo.description,
      pieces: 1,
    },
    // Kargonomi otomatik en uygun kargoyu seçer
    provider_preference: 'cheapest',
  }

  try {
    const res = await fetch(`${process.env.KARGONOMI_API_URI ?? DEFAULT_URI}/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.KARGONOMI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return { status: 'error', message: `HTTP ${res.status}: ${errText.slice(0, 200)}` }
    }
    const data = await res.json()
    return {
      status: 'ok',
      trackingNumber: data.tracking_number,
      barcodeUrl: data.barcode_pdf_url,
      provider: 'kargonomi',
      cost: data.cost,
      estimatedDelivery: data.estimated_delivery,
    }
  } catch (e: any) {
    return { status: 'error', message: e?.message ?? 'Bağlantı hatası' }
  }
}

async function trackShipment(trackingNumber: string): Promise<TrackResult> {
  if (!isConfigured()) return { status: 'not_configured' }

  try {
    const res = await fetch(
      `${process.env.KARGONOMI_API_URI ?? DEFAULT_URI}/shipments/${encodeURIComponent(trackingNumber)}/track`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${process.env.KARGONOMI_API_KEY}` },
      }
    )
    if (res.status === 404) return { status: 'not_found' }
    if (!res.ok) return { status: 'error', message: `HTTP ${res.status}` }
    const data = await res.json()
    return {
      status: 'ok',
      shipmentStatus: data.status ?? 'in_transit',
      currentLocation: data.current_location,
      events: data.events?.map((e: any) => ({
        at: e.timestamp,
        description: e.description,
        location: e.location,
      })) ?? [],
      lastUpdate: data.last_update,
    }
  } catch (e: any) {
    return { status: 'error', message: e?.message ?? 'Bağlantı hatası' }
  }
}

export const kargonomiAdapter: ShippingAdapter = {
  provider: 'kargonomi',
  isConfigured,
  createShipment,
  trackShipment,
}
