import type { APIRoute } from 'astro'
import { getVapidPublicKey } from '../../../server/push'

export const prerender = false

/** GET /api/push/vapid → public anahtarı döner (tarayıcı subscribe için) */
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ publicKey: getVapidPublicKey() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
