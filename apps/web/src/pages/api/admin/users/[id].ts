import type { APIRoute } from 'astro'
import { requireRole } from '../../../../server/auth'
import { getUser, updateUser, deactivateUser } from '../../../../server/users'

export const prerender = false

/** PATCH /api/admin/users/:id — Patron only, kullanıcı düzenle */
export const PATCH: APIRoute = async ({ cookies, params, request }) => {
  try {
    requireRole(cookies, ['patron'])
  } catch (r) {
    return r as Response
  }
  const id = String(params.id ?? '')
  if (!id) return new Response('Bad Request', { status: 400 })

  const body = await request.json().catch(() => null)
  if (!body) return new Response('Bad Request', { status: 400 })

  const updated = updateUser(id, {
    displayName: typeof body.displayName === 'string' ? body.displayName : undefined,
    active: typeof body.active === 'boolean' ? body.active : undefined,
    password: typeof body.password === 'string' && body.password.length >= 6 ? body.password : undefined,
  })
  if (!updated) return new Response('Not Found', { status: 404 })

  const { passwordHash: _h, passwordSalt: _s, ...safe } = updated
  return new Response(JSON.stringify(safe), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** DELETE /api/admin/users/:id — Patron only, pasifleştir (gerçek silme yok) */
export const DELETE: APIRoute = async ({ cookies, params }) => {
  try {
    requireRole(cookies, ['patron'])
  } catch (r) {
    return r as Response
  }
  const id = String(params.id ?? '')
  if (!id) return new Response('Bad Request', { status: 400 })

  const u = getUser(id)
  if (!u) return new Response('Not Found', { status: 404 })

  try {
    deactivateUser(id)
    return new Response(null, { status: 204 })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'Pasifleştirilemedi' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
