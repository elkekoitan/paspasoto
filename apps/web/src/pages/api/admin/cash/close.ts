/**
 * POST /api/admin/cash/close
 * Body: { countedBalance: number, note?: string }
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../server/auth'
import { closeCashSession } from '../../../../server/cash'
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
  if (typeof body?.countedBalance !== 'number' || body.countedBalance < 0) {
    return new Response(JSON.stringify({ error: 'invalid_balance' }), { status: 400 })
  }
  try {
    const session = await closeCashSession({
      closedBy: auth.user.username,
      countedBalance: body.countedBalance,
      note: body.note,
    })
    audit({
      userId: auth.user.id,
      username: auth.user.username,
      action: 'cash.close',
      target: session.id,
      details: {
        expectedBalance: session.expectedBalance,
        countedBalance: session.countedBalance,
        diff: session.diff,
      },
    })
    return new Response(JSON.stringify(session), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'cannot_close' }), { status: 409 })
  }
}
