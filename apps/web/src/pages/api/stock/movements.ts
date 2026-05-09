import type { APIRoute } from 'astro'
import { listMovements } from '../../../server/stock'
import { requireAdmin } from '../../../server/auth'

export const prerender = false

/** GET /api/stock/movements?sku=...&orderNo=... — admin only, hareket geçmişi (yeniden eskiye). */
export const GET: APIRoute = async ({ cookies, url }) => {
  try { requireAdmin(cookies) } catch (r) { return r as Response }
  const sku = url.searchParams.get('sku') ?? undefined
  const orderNo = url.searchParams.get('orderNo') ?? undefined
  const limit = parseInt(url.searchParams.get('limit') ?? '200', 10)
  const list = listMovements({ sku, orderNo }).slice(0, limit)
  return new Response(JSON.stringify(list), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
