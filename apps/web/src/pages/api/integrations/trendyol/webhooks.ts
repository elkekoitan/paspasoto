import type { APIRoute } from 'astro'
import { requireAdmin } from '../../../../server/auth'
import { listWebhooks, createWebhook, deleteWebhook } from '../../../../server/integrations/trendyol-api'

export const prerender = false

/**
 * GET /api/integrations/trendyol/webhooks
 *   Trendyol'da kayıtlı webhook'ları listeler.
 *
 * POST /api/integrations/trendyol/webhooks
 *   Body: { url?: string }  (boşsa otomatik /api/integrations/trendyol/webhook eklenir)
 *   Yeni webhook oluşturur. Webhook secret env'den (TRENDYOL_WEBHOOK_SECRET) kullanılır.
 *
 * DELETE /api/integrations/trendyol/webhooks?id=...
 *   Belirtilen webhook'u Trendyol'dan siler.
 */

export const GET: APIRoute = async ({ cookies }) => {
  try { requireAdmin(cookies) } catch (r) { return r as Response }
  try {
    const webhooks = await listWebhooks()
    return new Response(JSON.stringify({ ok: true, webhooks }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const POST: APIRoute = async ({ cookies, request, url }) => {
  try { requireAdmin(cookies) } catch (r) { return r as Response }

  const body = await request.json().catch(() => ({}))
  const siteUrl = process.env.PUBLIC_SITE_URL ?? url.origin
  const webhookUrl = body?.url || `${siteUrl}/api/integrations/trendyol/webhook`
  const secret = process.env.TRENDYOL_WEBHOOK_SECRET || undefined

  try {
    const wh = await createWebhook({ url: webhookUrl, webhookSecret: secret })
    return new Response(JSON.stringify({ ok: true, webhook: wh, registeredUrl: webhookUrl }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const DELETE: APIRoute = async ({ cookies, url }) => {
  try { requireAdmin(cookies) } catch (r) { return r as Response }
  const id = url.searchParams.get('id')
  if (!id) return new Response('id required', { status: 400 })
  try {
    const ok = await deleteWebhook(id)
    return new Response(JSON.stringify({ ok }), {
      status: ok ? 200 : 502, headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    })
  }
}
