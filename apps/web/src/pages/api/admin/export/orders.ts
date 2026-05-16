/**
 * GET /api/admin/export/orders?orderNos=a,b,c  (veya filtre param.)
 *
 * UTF-8 BOM + CSV — Excel TR uyumlu.
 * orderNos verilmezse mevcut tüm sipariş listesi.
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../server/auth'
import { listOrders } from '../../../../server/db'

export const prerender = false

function csvEscape(v: any): string {
  if (v == null) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function csvRow(values: any[]): string {
  return values.map(csvEscape).join(',')
}

export const GET: APIRoute = async ({ cookies, url }) => {
  let auth
  try {
    auth = requireAuth(cookies)
  } catch (r) {
    return r as Response
  }

  let orders = listOrders().filter((o) => (o.kind ?? 'order') === 'order')
  if (auth.user.role === 'staff') {
    orders = orders.filter((o) => o.createdBy === auth.user.id)
  }

  const orderNosParam = url.searchParams.get('orderNos')
  if (orderNosParam) {
    const wanted = new Set(orderNosParam.split(',').map((s) => s.trim()).filter(Boolean))
    orders = orders.filter((o) => wanted.has(o.orderNo))
  }

  const headers = [
    'Sipariş No', 'Tarih', 'Kaynak', 'Müşteri', 'Telefon', 'E-posta',
    'Şehir', 'İlçe', 'Adres',
    'Marka', 'Model', 'Ürün',
    'Üretim', 'Ödeme Durumu', 'Ödeme Yöntemi',
    'Toplam (₺)', 'Tahsil (₺)', 'Bakiye (₺)',
    'Kargo Firma', 'Kargo No', 'Kargoya Verildi',
  ]

  const rows: string[] = [csvRow(headers)]
  for (const o of orders) {
    const it = o.items[0]
    rows.push(csvRow([
      o.orderNo,
      new Date(o.createdAt).toLocaleString('tr-TR'),
      o.channel ?? 'manual',
      o.customer.fullName,
      o.customer.phone,
      o.customer.email ?? '',
      o.shippingAddress.city,
      o.shippingAddress.district,
      o.shippingAddress.addressLine,
      it?.brandName ?? '',
      it?.modelName ?? '',
      it?.productName ?? '',
      o.productionStatus,
      o.paymentStatus,
      o.paymentMethod,
      o.total.toFixed(2),
      o.paidAmount.toFixed(2),
      (o.total - o.paidAmount).toFixed(2),
      o.cargoCompany ?? '',
      o.cargoTrackingNo ?? '',
      o.shippedAt ? new Date(o.shippedAt).toLocaleString('tr-TR') : '',
    ]))
  }

  // UTF-8 BOM ile başla — Excel'in TR karakterleri düzgün okuması için
  const csv = '﻿' + rows.join('\n')
  const date = new Date().toISOString().slice(0, 10)

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="carmat-siparisler-${date}.csv"`,
    },
  })
}
