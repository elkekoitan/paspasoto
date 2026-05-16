/**
 * GET /api/admin/customers — tüm müşterileri agrege liste
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../server/auth'
import { listCustomers } from '../../../../server/customers'

export const prerender = false

export const GET: APIRoute = async ({ cookies }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  return new Response(JSON.stringify(listCustomers()), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
