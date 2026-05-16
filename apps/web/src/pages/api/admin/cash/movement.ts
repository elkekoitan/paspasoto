/**
 * POST /api/admin/cash/movement
 * Body: { type: 'expense'|'withdrawal'|'deposit'|'refund', amount: number, reason: string, orderNo? }
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../server/auth'
import { addCashMovement, type CashMovementType } from '../../../../server/cash'
import { audit } from '../../../../server/audit'

export const prerender = false

const ALLOWED_TYPES: CashMovementType[] = ['expense', 'withdrawal', 'deposit', 'refund']

export const POST: APIRoute = async ({ cookies, request }) => {
  let auth
  try {
    auth = requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const body = await request.json().catch(() => null)
  const type = body?.type as CashMovementType
  const amount = Number(body?.amount)
  const reason = String(body?.reason ?? '').trim().slice(0, 200)

  if (!ALLOWED_TYPES.includes(type) || !isFinite(amount) || amount <= 0 || !reason) {
    return new Response(JSON.stringify({ error: 'invalid_input' }), { status: 400 })
  }

  try {
    const session = await addCashMovement({
      type,
      amount,
      reason,
      orderNo: body?.orderNo ? String(body.orderNo) : undefined,
      by: auth.user.username,
    })
    audit({
      userId: auth.user.id,
      username: auth.user.username,
      action: 'cash.movement',
      target: session?.id,
      details: { type, amount, reason },
    })
    return new Response(JSON.stringify(session), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'cannot_add' }), { status: 409 })
  }
}
