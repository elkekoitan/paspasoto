/**
 * GET /api/admin/templates — tüm şablonları listele
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../server/auth'
import { listTemplates } from '../../../../server/message-templates'

export const prerender = false

export const GET: APIRoute = async ({ cookies }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  return new Response(JSON.stringify(listTemplates()), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
