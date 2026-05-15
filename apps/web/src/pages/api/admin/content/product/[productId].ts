/**
 * PATCH /api/admin/content/product/:productId — ürün override güncelle
 * DELETE /api/admin/content/product/:productId — ürün override sıfırla
 *
 * Body: { name?, shortDescription?, description?, image?, gallery?, price?, oldPrice?, stock?, active? }
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../../server/auth'
import { setProductOverride, deleteProductOverride } from '../../../../../server/content'

export const prerender = false

export const PATCH: APIRoute = async ({ cookies, params, request }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const productId = params.productId
  if (!productId) return new Response('Bad Request', { status: 400 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return new Response('Bad Request', { status: 400 })

  // Whitelist alanlar — beklenmeyen field'lar reddedilir
  const patch: Record<string, any> = {}
  for (const k of ['name', 'shortDescription', 'description', 'image', 'gallery', 'price', 'oldPrice', 'stock', 'active'] as const) {
    if (k in body) patch[k] = body[k]
  }
  const updated = await setProductOverride(productId, patch)
  return new Response(JSON.stringify(updated), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const DELETE: APIRoute = async ({ cookies, params }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const productId = params.productId
  if (!productId) return new Response('Bad Request', { status: 400 })
  await deleteProductOverride(productId)
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
