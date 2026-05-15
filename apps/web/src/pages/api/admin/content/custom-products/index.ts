/**
 * GET  /api/admin/content/custom-products — listele
 * POST /api/admin/content/custom-products — yeni ürün ekle
 *
 * Body (POST):
 *   { slug, category, name, price, oldPrice?, image, shortDescription, description,
 *     stock, sku, badges?, active }
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../../server/auth'
import { listCustomProducts, createCustomProduct } from '../../../../../server/content'

export const prerender = false

export const GET: APIRoute = async ({ cookies }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  return new Response(JSON.stringify(listCustomProducts()), {
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
  if (!body?.name || !body?.slug || !body?.category) {
    return new Response(JSON.stringify({ error: 'name, slug, category zorunlu' }), { status: 400 })
  }
  const product = await createCustomProduct({
    slug: String(body.slug).slice(0, 100),
    category: body.category,
    name: String(body.name).slice(0, 200),
    price: Number(body.price) || 0,
    oldPrice: body.oldPrice != null ? Number(body.oldPrice) : undefined,
    image: String(body.image ?? '').slice(0, 500),
    gallery: Array.isArray(body.gallery) ? body.gallery.slice(0, 10) : undefined,
    shortDescription: String(body.shortDescription ?? '').slice(0, 500),
    description: String(body.description ?? '').slice(0, 5000),
    stock: Number(body.stock) || 0,
    sku: String(body.sku ?? '').slice(0, 50) || `CUSTOM-${Date.now()}`,
    badges: Array.isArray(body.badges) ? body.badges : undefined,
    active: body.active !== false,
  })
  return new Response(JSON.stringify(product), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
}
