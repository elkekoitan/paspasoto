/**
 * Yurtiçi Kargo Adapter — WCM (Web Cargo Module) SOAP servisleri.
 *
 * Sandbox: https://testservices.yurticikargo.com/KOPSDLLws/wsCreateShipment.asmx
 * Production: https://servisler.yurticikargo.com/KOPSDLLws/wsCreateShipment.asmx
 *
 * Env:
 *   YURTICI_USERNAME — WCM kullanıcı adı (KOBİ portal)
 *   YURTICI_PASSWORD — WCM şifresi
 *   YURTICI_LANGUAGE — 'TR' (varsayılan)
 *   YURTICI_API_URI  — opsiyonel override (sandbox vs prod)
 *
 * SOAP servisleri için XML payload + parseString.
 * Bu MVP — gerçek SDK eklenince yeniden yazılır (örn. node-soap kullan).
 */
import type {
  ShippingAdapter,
  CreateShipmentInput,
  CreateShipmentResult,
  TrackResult,
} from './types'

const DEFAULT_URI = 'https://testservices.yurticikargo.com'

function isConfigured(): boolean {
  return !!(process.env.YURTICI_USERNAME && process.env.YURTICI_PASSWORD)
}

async function createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
  if (!isConfigured()) return { status: 'not_configured' }

  const { order, packageInfo } = input
  const username = process.env.YURTICI_USERNAME!
  const password = process.env.YURTICI_PASSWORD!
  const uri = process.env.YURTICI_API_URI ?? DEFAULT_URI

  // Yurtiçi WCM SOAP envelope
  const soapPayload = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.kop.yk.com/">
  <soapenv:Body>
    <ws:createShipment>
      <wsUserData>
        <wsUserName>${username}</wsUserName>
        <wsPassword>${password}</wsPassword>
        <wsLanguage>${process.env.YURTICI_LANGUAGE ?? 'TR'}</wsLanguage>
      </wsUserData>
      <ShippingOrderVO>
        <cargoKey>${order.orderNo}</cargoKey>
        <invoiceKey>${order.orderNo}</invoiceKey>
        <receiverCustName>${escapeXml(order.shippingAddress.fullName)}</receiverCustName>
        <receiverAddress>${escapeXml(order.shippingAddress.addressLine)}</receiverAddress>
        <receiverPhone1>${escapeXml(order.shippingAddress.phone)}</receiverPhone1>
        <cityName>${escapeXml(order.shippingAddress.city)}</cityName>
        <townName>${escapeXml(order.shippingAddress.district)}</townName>
        <orgGeoCode>1</orgGeoCode>
        <emailAddress>${escapeXml(order.customer.email ?? '')}</emailAddress>
        <desi>${packageInfo.desi ?? Math.ceil(packageInfo.weight)}</desi>
        <kg>${packageInfo.weight}</kg>
        <cargoCount>1</cargoCount>
        <waybillNo></waybillNo>
        <specialField1>${escapeXml(packageInfo.description)}</specialField1>
      </ShippingOrderVO>
    </ws:createShipment>
  </soapenv:Body>
</soapenv:Envelope>`

  try {
    const res = await fetch(`${uri}/KOPSDLLws/wsCreateShipment.asmx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'http://ws.kop.yk.com/createShipment',
      },
      body: soapPayload,
    })
    if (!res.ok) {
      return { status: 'error', message: `HTTP ${res.status}` }
    }
    const text = await res.text()
    // Basit regex parse — gerçek implementasyonda fast-xml-parser kullan
    const trackingMatch = text.match(/<cargoKey>([^<]+)<\/cargoKey>/)
    const errMatch = text.match(/<errCode>(\d+)<\/errCode>/)
    if (errMatch && errMatch[1] !== '0') {
      const msgMatch = text.match(/<errMessage>([^<]+)<\/errMessage>/)
      return { status: 'error', message: msgMatch?.[1] ?? 'Yurtiçi hata' }
    }
    return {
      status: 'ok',
      trackingNumber: trackingMatch?.[1] ?? order.orderNo,
      provider: 'yurtici',
    }
  } catch (e: any) {
    return { status: 'error', message: e?.message ?? 'Bağlantı hatası' }
  }
}

async function trackShipment(trackingNumber: string): Promise<TrackResult> {
  if (!isConfigured()) return { status: 'not_configured' }

  const username = process.env.YURTICI_USERNAME!
  const password = process.env.YURTICI_PASSWORD!
  const uri = process.env.YURTICI_API_URI ?? DEFAULT_URI

  const soapPayload = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.kop.yk.com/">
  <soapenv:Body>
    <ws:queryShippingOrder>
      <wsUserData>
        <wsUserName>${username}</wsUserName>
        <wsPassword>${password}</wsPassword>
        <wsLanguage>TR</wsLanguage>
      </wsUserData>
      <cargoKey>${trackingNumber}</cargoKey>
    </ws:queryShippingOrder>
  </soapenv:Body>
</soapenv:Envelope>`

  try {
    const res = await fetch(`${uri}/KOPSDLLws/wsQueryShippingOrder.asmx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'http://ws.kop.yk.com/queryShippingOrder',
      },
      body: soapPayload,
    })
    if (!res.ok) return { status: 'error', message: `HTTP ${res.status}` }

    const text = await res.text()
    // Basit parse
    const statusMatch = text.match(/<operationCode>([^<]+)<\/operationCode>/)
    const stateMap: Record<string, any> = {
      'C50': 'delivered',
      'C100': 'in_transit',
      'C200': 'out_for_delivery',
      'C300': 'failed',
    }
    return {
      status: 'ok',
      shipmentStatus: stateMap[statusMatch?.[1] ?? ''] ?? 'in_transit',
      events: [],
    }
  } catch (e: any) {
    return { status: 'error', message: e?.message ?? 'Bağlantı hatası' }
  }
}

function escapeXml(s: string): string {
  return (s ?? '').replace(/[<>&"']/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
  })[c]!)
}

export const yurticiAdapter: ShippingAdapter = {
  provider: 'yurtici',
  isConfigured,
  createShipment,
  trackShipment,
}
