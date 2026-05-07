import type { APIRoute } from 'astro'
import { addSubscription, type PushAudience } from '../../../server/push'
import { getSession } from '../../../server/auth'
import { getByToken } from '../../../server/db'

export const prerender = false

/**
 * POST /api/push/subscribe
 * Body: { subscription: PushSubscriptionJSON, audience: 'admin' | 'order:<orderNo>', token?: string }
 *
 * Yetki:
 *  - audience='admin' → admin cookie session zorunlu
 *  - audience='order:XXX' → ya admin oturumu ya da geçerli accessToken zorunlu
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json().catch(() => null)
  if (!body?.subscription?.endpoint || !body?.subscription?.keys?.p256dh || !body?.subscription?.keys?.auth) {
    return new Response('Bad subscription', { status: 400 })
  }
  const audience = String(body.audience || '') as PushAudience
  if (audience === 'admin') {
    if (!getSession(cookies)) return new Response('Unauthorized', { status: 401 })
  } else if (audience.startsWith('order:')) {
    const orderNo = audience.slice('order:'.length)
    if (!getSession(cookies)) {
      // Admin değilse customer token doğrulaması
      const tok = body.token
      const order = tok ? getByToken(String(tok)) : null
      if (!order || order.orderNo !== orderNo) {
        return new Response('Forbidden', { status: 403 })
      }
    }
  } else {
    return new Response('Bad audience', { status: 400 })
  }

  await addSubscription({
    endpoint: body.subscription.endpoint,
    keys: { p256dh: body.subscription.keys.p256dh, auth: body.subscription.keys.auth },
    audience,
    ua: request.headers.get('user-agent') ?? undefined,
  })
  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
}
