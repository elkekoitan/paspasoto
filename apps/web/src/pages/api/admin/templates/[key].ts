/**
 * PATCH /api/admin/templates/:key — şablon güncelle
 * DELETE /api/admin/templates/:key — varsayılana döndür
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../server/auth'
import { setTemplate, resetTemplate, type TemplateKey } from '../../../../server/message-templates'

export const prerender = false

const VALID_KEYS: TemplateKey[] = [
  'order_received', 'production_started', 'ready_pickup', 'ready_cargo',
  'delivered', 'payment_reminder', 'delay_notice', 'feedback_request',
]

export const PATCH: APIRoute = async ({ cookies, params, request }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const key = params.key as TemplateKey | undefined
  if (!key || !VALID_KEYS.includes(key)) return new Response('Bad Request', { status: 400 })
  const body = await request.json().catch(() => null)
  if (!body) return new Response('Bad Request', { status: 400 })
  const updated = await setTemplate(key, body)
  return new Response(JSON.stringify(updated), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

export const DELETE: APIRoute = async ({ cookies, params }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const key = params.key as TemplateKey | undefined
  if (!key || !VALID_KEYS.includes(key)) return new Response('Bad Request', { status: 400 })
  const t = await resetTemplate(key)
  return new Response(JSON.stringify(t), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
