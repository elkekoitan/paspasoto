/**
 * POST /api/admin/customers/:phoneKey/note    — not ekle
 * DELETE /api/admin/customers/:phoneKey/note?id={noteId}
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../../server/auth'
import { addCustomerNote, deleteCustomerNote } from '../../../../../server/customers'

export const prerender = false

export const POST: APIRoute = async ({ cookies, params, request }) => {
  let auth
  try {
    auth = requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const phoneKey = params.phoneKey!
  const body = await request.json().catch(() => null)
  const text = String(body?.body ?? '').trim().slice(0, 500)
  if (!text) return new Response('Bad Request', { status: 400 })
  const note = await addCustomerNote(phoneKey, auth.user.username, text)
  return new Response(JSON.stringify(note), { status: 201, headers: { 'Content-Type': 'application/json' } })
}

export const DELETE: APIRoute = async ({ cookies, params, url }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const phoneKey = params.phoneKey!
  const id = url.searchParams.get('id')
  if (!id) return new Response('Bad Request', { status: 400 })
  await deleteCustomerNote(phoneKey, id)
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
