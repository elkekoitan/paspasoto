/**
 * GET    /api/admin/integrations/mappings              — listele (?platform=trendyol)
 * POST   /api/admin/integrations/mappings              — yeni mapping ekle
 * PATCH  /api/admin/integrations/mappings?id=...       — güncelle
 * DELETE /api/admin/integrations/mappings?id=...       — sil
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../server/auth'
import {
  listMappings, createMapping, updateMapping, deleteMapping,
  type ProductMappingPlatform,
} from '../../../../server/integrations/trendyol-mapping'
import { audit } from '../../../../server/audit'

export const prerender = false

export const GET: APIRoute = async ({ cookies, url }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const platform = (url.searchParams.get('platform') as ProductMappingPlatform | null) ?? undefined
  return new Response(JSON.stringify(listMappings(platform)), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ cookies, request }) => {
  let auth
  try {
    auth = requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const body = await request.json().catch(() => null)
  if (!body?.externalCode || !body?.platform || !body?.brandSlug) {
    return new Response(JSON.stringify({ error: 'missing_fields' }), { status: 400 })
  }
  const m = await createMapping(body)
  audit({
    userId: auth.user.id,
    username: auth.user.username,
    action: 'integration.mapping-create',
    target: m.id,
    details: { platform: m.platform, externalCode: m.externalCode },
  })
  return new Response(JSON.stringify(m), { status: 201, headers: { 'Content-Type': 'application/json' } })
}

export const PATCH: APIRoute = async ({ cookies, url, request }) => {
  let auth
  try {
    auth = requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const id = url.searchParams.get('id')
  if (!id) return new Response('Bad Request', { status: 400 })
  const body = await request.json().catch(() => null)
  if (!body) return new Response('Bad Request', { status: 400 })
  const m = await updateMapping(id, body)
  if (!m) return new Response('Not Found', { status: 404 })
  audit({
    userId: auth.user.id,
    username: auth.user.username,
    action: 'integration.mapping-update',
    target: id,
  })
  return new Response(JSON.stringify(m), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

export const DELETE: APIRoute = async ({ cookies, url }) => {
  let auth
  try {
    auth = requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const id = url.searchParams.get('id')
  if (!id) return new Response('Bad Request', { status: 400 })
  await deleteMapping(id)
  audit({
    userId: auth.user.id,
    username: auth.user.username,
    action: 'integration.mapping-delete',
    target: id,
  })
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
