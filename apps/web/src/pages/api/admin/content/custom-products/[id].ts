/**
 * PATCH  /api/admin/content/custom-products/:id — alanları güncelle
 * DELETE /api/admin/content/custom-products/:id — kaldır
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../../server/auth'
import { updateCustomProduct, deleteCustomProduct } from '../../../../../server/content'

export const prerender = false

export const PATCH: APIRoute = async ({ cookies, params, request }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const id = params.id
  if (!id) return new Response('Bad Request', { status: 400 })
  const body = await request.json().catch(() => null)
  if (!body) return new Response('Bad Request', { status: 400 })

  const allowed = ['slug', 'category', 'name', 'price', 'oldPrice', 'image', 'gallery', 'shortDescription', 'description', 'stock', 'sku', 'badges', 'active']
  const patch: Record<string, any> = {}
  for (const k of allowed) if (k in body) patch[k] = body[k]

  const updated = await updateCustomProduct(id, patch)
  if (!updated) return new Response('Not Found', { status: 404 })
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
  const id = params.id
  if (!id) return new Response('Bad Request', { status: 400 })
  const ok = await deleteCustomProduct(id)
  if (!ok) return new Response('Not Found', { status: 404 })
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
