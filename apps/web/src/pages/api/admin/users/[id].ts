import type { APIRoute } from 'astro'
import { requireRole } from '../../../../server/auth'
import { getUserById, updateUser, deactivateUser } from '../../../../server/users'
import { audit } from '../../../../server/audit'

export const prerender = false

/** GET /api/admin/users/:id — Patron only */
export const GET: APIRoute = async ({ cookies, params }) => {
  try {
    requireRole(cookies, ['patron'])
  } catch (r) {
    return r as Response
  }
  const id = String(params.id ?? '')
  const u = getUserById(id)
  if (!u) return new Response('Not Found', { status: 404 })
  const { passwordHash: _h, passwordSalt: _s, ...safe } = u
  return new Response(JSON.stringify(safe), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** PATCH /api/admin/users/:id — Patron only, kullanıcı düzenle */
export const PATCH: APIRoute = async ({ cookies, params, request }) => {
  let auth
  try {
    auth = requireRole(cookies, ['patron'])
  } catch (r) {
    return r as Response
  }
  const id = String(params.id ?? '')
  if (!id) return new Response('Bad Request', { status: 400 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return new Response('Bad Request', { status: 400 })

  try {
    const updated = updateUser(id, body)
    if (!updated) return new Response('Not Found', { status: 404 })

    const passwordChanged = typeof body.password === 'string' && body.password.length > 0
    audit({
      userId: auth.user.id,
      username: auth.user.username,
      action: passwordChanged ? 'user.password-reset' : 'user.update',
      target: updated.id,
      details: {
        targetUsername: updated.username,
        changedFields: Object.keys(body).filter((k) => k !== 'password'),
        passwordChanged,
      },
    })

    const { passwordHash: _h, passwordSalt: _s, ...safe } = updated
    return new Response(JSON.stringify(safe), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'Güncellenemedi' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

/** DELETE /api/admin/users/:id — Patron only, pasifleştir (soft delete) */
export const DELETE: APIRoute = async ({ cookies, params }) => {
  let auth
  try {
    auth = requireRole(cookies, ['patron'])
  } catch (r) {
    return r as Response
  }
  const id = String(params.id ?? '')
  if (!id) return new Response('Bad Request', { status: 400 })

  const u = getUserById(id)
  if (!u) return new Response('Not Found', { status: 404 })

  try {
    deactivateUser(id)
    audit({
      userId: auth.user.id,
      username: auth.user.username,
      action: 'user.deactivate',
      target: id,
      details: { targetUsername: u.username },
    })
    return new Response(null, { status: 204 })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'Pasifleştirilemedi' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
