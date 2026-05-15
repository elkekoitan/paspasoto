/**
 * PATCH /api/admin/content/site — site-level içerik (hero görseli, başlık)
 *
 * Body: { heroImage?, heroTitle?, heroSubtitle? }
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../server/auth'
import { setSiteContent } from '../../../../server/content'

export const prerender = false

export const PATCH: APIRoute = async ({ cookies, request }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return new Response('Bad Request', { status: 400 })

  const patch: Record<string, any> = {}
  for (const k of ['heroImage', 'heroTitle', 'heroSubtitle'] as const) {
    if (k in body) patch[k] = body[k]
  }
  const updated = await setSiteContent(patch)
  return new Response(JSON.stringify(updated), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
