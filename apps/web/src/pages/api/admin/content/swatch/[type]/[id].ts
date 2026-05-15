/**
 * PATCH /api/admin/content/swatch/:type/:id — swatch (mat/border/heel/logo/emblem) override
 * DELETE /api/admin/content/swatch/:type/:id — sıfırla
 *
 * Body: { imageUrl?, label? }
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../../../server/auth'
import { setSwatchOverride, deleteSwatchOverride, type SwatchType } from '../../../../../../server/content'

export const prerender = false

const ALLOWED_TYPES: SwatchType[] = ['mat', 'border', 'heel', 'logo', 'emblem']

export const PATCH: APIRoute = async ({ cookies, params, request }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const type = params.type as SwatchType | undefined
  const id = params.id
  if (!type || !ALLOWED_TYPES.includes(type) || !id) {
    return new Response('Bad Request', { status: 400 })
  }
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return new Response('Bad Request', { status: 400 })

  const patch: Record<string, any> = {}
  if ('imageUrl' in body) patch.imageUrl = body.imageUrl
  if ('label' in body) patch.label = body.label

  const updated = await setSwatchOverride(type, id, patch)
  return new Response(JSON.stringify(updated), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const DELETE: APIRoute = async ({ cookies, params }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const type = params.type as SwatchType | undefined
  const id = params.id
  if (!type || !ALLOWED_TYPES.includes(type) || !id) {
    return new Response('Bad Request', { status: 400 })
  }
  await deleteSwatchOverride(type, id)
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
