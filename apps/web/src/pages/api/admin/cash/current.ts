/**
 * GET /api/admin/cash/current — açık kasa + beklenen balans
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../server/auth'
import { getOpenSession, computeExpectedBalance } from '../../../../server/cash'

export const prerender = false

export const GET: APIRoute = async ({ cookies }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const session = getOpenSession()
  if (!session) {
    return new Response(JSON.stringify({ open: false }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  return new Response(JSON.stringify({
    open: true,
    session,
    expectedBalance: computeExpectedBalance(session),
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
