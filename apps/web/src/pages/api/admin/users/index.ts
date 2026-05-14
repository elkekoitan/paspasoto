import type { APIRoute } from 'astro'
import { requireRole } from '../../../../server/auth'
import { listUsers, createUser, type UserRole } from '../../../../server/users'

export const prerender = false

/** GET /api/admin/users — Patron only, tüm kullanıcılar (hash hariç). */
export const GET: APIRoute = async ({ cookies }) => {
  try {
    requireRole(cookies, ['patron'])
  } catch (r) {
    return r as Response
  }
  const users = listUsers().map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  }))
  return new Response(JSON.stringify(users), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** POST /api/admin/users — Patron only, yeni personel ekle (veya patron). */
export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    requireRole(cookies, ['patron'])
  } catch (r) {
    return r as Response
  }
  const body = await request.json().catch(() => null)
  if (!body || !body.username || !body.password) {
    return new Response('Bad Request', { status: 400 })
  }
  try {
    const user = createUser({
      username: String(body.username),
      displayName: body.displayName ? String(body.displayName) : undefined,
      password: String(body.password),
      role: (body.role === 'patron' ? 'patron' : 'staff') as UserRole,
    })
    const { passwordHash: _h, passwordSalt: _s, ...safe } = user
    return new Response(JSON.stringify(safe), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'Kullanıcı oluşturulamadı' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
