/**
 * GET  /api/admin/materials — tüm hammaddeleri listele
 * POST /api/admin/materials — yeni hammadde kaydı oluştur
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../server/auth'
import { listMaterials, createMaterial, type MaterialCategory, type MaterialUnit } from '../../../../server/materials'

export const prerender = false

export const GET: APIRoute = async ({ cookies }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  return new Response(JSON.stringify(listMaterials()), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const body = await request.json().catch(() => null)
  if (!body?.name || !body?.category || !body?.unit) {
    return new Response(JSON.stringify({ error: 'bad_request' }), { status: 400 })
  }
  const item = await createMaterial({
    name: String(body.name).slice(0, 100),
    category: body.category as MaterialCategory,
    color: body.color ? String(body.color).slice(0, 50) : undefined,
    unit: body.unit as MaterialUnit,
    quantity: Number(body.quantity) || 0,
    minThreshold: body.minThreshold != null ? Number(body.minThreshold) : undefined,
    supplier: body.supplier ? String(body.supplier).slice(0, 100) : undefined,
    supplierContact: body.supplierContact ? String(body.supplierContact).slice(0, 100) : undefined,
    costPerUnit: body.costPerUnit != null ? Number(body.costPerUnit) : undefined,
    lastPurchaseAt: body.lastPurchaseAt != null ? Number(body.lastPurchaseAt) : undefined,
    note: body.note ? String(body.note).slice(0, 500) : undefined,
  })
  return new Response(JSON.stringify(item), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
}
