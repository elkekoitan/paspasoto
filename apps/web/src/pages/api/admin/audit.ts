/**
 * GET /api/admin/audit — Aktivite log listele (patron only).
 *
 * Query:
 *   userId, action, actionPrefix, target, fromTs, toTs, limit
 */
import type { APIRoute } from 'astro'
import { requirePermission } from '../../../server/auth'
import { listAudit, listAuditActions } from '../../../server/audit'

export const prerender = false

export const GET: APIRoute = async ({ cookies, url }) => {
  try {
    requirePermission(cookies, 'audit.view')
  } catch (r) {
    return r as Response
  }
  const filter = {
    userId: url.searchParams.get('userId') ?? undefined,
    action: url.searchParams.get('action') ?? undefined,
    actionPrefix: url.searchParams.get('actionPrefix') ?? undefined,
    target: url.searchParams.get('target') ?? undefined,
    fromTs: url.searchParams.get('fromTs') ? Number(url.searchParams.get('fromTs')) : undefined,
    toTs: url.searchParams.get('toTs') ? Number(url.searchParams.get('toTs')) : undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : 200,
  }
  return new Response(
    JSON.stringify({ events: listAudit(filter), actions: listAuditActions() }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}
