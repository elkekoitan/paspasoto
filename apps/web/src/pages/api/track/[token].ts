import type { APIRoute } from 'astro'
import { getByToken } from '../../../server/db'

export const prerender = false

/** GET /api/track/[token] — public-safe sipariş verisi (internalNote hariç). */
export const GET: APIRoute = async ({ params }) => {
  const token = params.token
  if (!token) return new Response('Bad Request', { status: 400 })
  const order = getByToken(token)
  if (!order) return new Response('Not Found', { status: 404 })
  // Internal note'u gizle
  const { internalNote: _omit, ...publicOrder } = order
  return new Response(JSON.stringify(publicOrder), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}
