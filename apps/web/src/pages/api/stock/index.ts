import type { APIRoute } from 'astro'
import { listStock } from '../../../server/stock'
import { requireAdmin } from '../../../server/auth'

export const prerender = false

/** GET /api/stock — admin only, tüm SKU listesi (kritik dahil). */
export const GET: APIRoute = async ({ cookies }) => {
  try { requireAdmin(cookies) } catch (r) { return r as Response }
  return new Response(JSON.stringify(listStock()), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
