/**
 * GET  /api/admin/content — tüm override DB'yi döner (admin UI başlangıçta yükler)
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../server/auth'
import { listContent } from '../../../../server/content'

export const prerender = false

export const GET: APIRoute = async ({ cookies }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  return new Response(JSON.stringify(listContent()), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
