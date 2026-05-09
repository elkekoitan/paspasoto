import type { APIRoute } from 'astro'
import { requireAdmin } from '../../../../server/auth'
import { testConnection } from '../../../../server/integrations/trendyol-api'

export const prerender = false

/**
 * POST /api/integrations/trendyol/test
 * Trendyol REST API'sine bağlantı testi yapar — credential'lar doğru mu?
 * Yalnızca admin.
 */
export const POST: APIRoute = async ({ cookies }) => {
  try { requireAdmin(cookies) } catch (r) { return r as Response }
  const result = await testConnection()
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 502,
    headers: { 'Content-Type': 'application/json' },
  })
}
