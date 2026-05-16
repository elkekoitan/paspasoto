/**
 * POST /api/admin/cash/open
 * Body: { openingBalance: number, note?: string }
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../server/auth'
import { openCashSession } from '../../../../server/cash'
import { audit } from '../../../../server/audit'

export const prerender = false

export const POST: APIRoute = async ({ cookies, request }) => {
  let auth
  try {
    auth = requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const body = await request.json().catch(() => null)
  if (typeof body?.openingBalance !== 'number' || body.openingBalance < 0) {
    return new Response(JSON.stringify({ error: 'invalid_balance' }), { status: 400 })
  }
  try {
    const session = await openCashSession({
      openedBy: auth.user.username,
      openingBalance: body.openingBalance,
      note: body.note,
    })
    audit({
      userId: auth.user.id,
      username: auth.user.username,
      action: 'cash.open',
      target: session.id,
      details: { openingBalance: session.openingBalance },
    })
    return new Response(JSON.stringify(session), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'cannot_open' }), { status: 409 })
  }
}
