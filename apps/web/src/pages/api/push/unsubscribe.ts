import type { APIRoute } from 'astro'
import { removeSubscription, type PushAudience } from '../../../server/push'

export const prerender = false

/**
 * POST /api/push/unsubscribe
 * Body: { endpoint: string, audience?: 'admin' | 'order:<orderNo>' }
 */
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null)
  if (!body?.endpoint) return new Response('Bad request', { status: 400 })
  await removeSubscription(String(body.endpoint), body.audience as PushAudience | undefined)
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
