/**
 * POST /api/orders/:orderNo/production-step
 *   Body: { step: 'cutting'|...|'packaging', completed: true|false, note? }
 *
 * Adım tamamlandı işaretlenir. Tüm relevant adımlar tamamlanınca
 * productionStatus otomatik 'ready' olur ve kargo akışı tetiklenir.
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../server/auth'
import { getByOrderNo, updateOrder } from '../../../../server/db'
import { audit } from '../../../../server/audit'
import { PRODUCTION_STEPS, isStepRelevant, type ProductionStepKey } from '../../../../lib/production-steps'
import { getShippingAdapter } from '../../../../server/shipping'

export const prerender = false

export const POST: APIRoute = async ({ cookies, params, request }) => {
  let auth
  try {
    auth = requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  const orderNo = params.orderNo!
  const order = getByOrderNo(orderNo)
  if (!order) return new Response('Not Found', { status: 404 })
  if (auth.user.role === 'staff' && order.createdBy !== auth.user.id) {
    return new Response('Forbidden', { status: 403 })
  }
  const body = await request.json().catch(() => null)
  const step = body?.step as ProductionStepKey
  if (!step || !PRODUCTION_STEPS.find((s) => s.key === step)) {
    return new Response(JSON.stringify({ error: 'invalid_step' }), { status: 400 })
  }
  const completed = body?.completed !== false

  const current = order.productionSteps ?? []
  const idx = current.findIndex((s) => s.step === step)
  const next = [...current]
  if (idx >= 0) {
    if (completed) {
      next[idx] = { ...next[idx], completedAt: Date.now(), completedBy: auth.user.username }
    } else {
      // İptal — completedAt'i temizle
      const { completedAt, completedBy, ...rest } = next[idx]
      next[idx] = rest
    }
  } else {
    next.push({
      step,
      completedAt: completed ? Date.now() : undefined,
      completedBy: completed ? auth.user.username : undefined,
    })
  }

  // Tüm relevant adımlar tamamlandı mı?
  const it = order.items[0]
  const hasLogo = !!(it?.logoBrandSlug)
  const hasHeel = !!(it?.heelSlug && it.heelSlug !== '-')
  const relevant = PRODUCTION_STEPS.filter((s) => isStepRelevant(s.key, hasLogo, hasHeel))
  const allDone = relevant.every((s) => {
    const found = next.find((x) => x.step === s.key)
    return found?.completedAt != null
  })

  // Güncelle
  const patch: any = { productionSteps: next }
  let triggerShipping = false
  if (allDone && order.productionStatus !== 'ready' && order.productionStatus !== 'delivered') {
    patch.productionStatus = 'ready'
    triggerShipping = order.deliveryMethod !== 'pickup'
  }

  const event = completed ? {
    status: patch.productionStatus ?? order.productionStatus,
    at: Date.now(),
    note: `Üretim aşaması tamamlandı: ${step}`,
    by: auth.user.username,
  } : undefined

  await updateOrder(orderNo, patch, event)

  audit({
    userId: auth.user.id,
    username: auth.user.username,
    action: 'order.production-step',
    target: orderNo,
    details: { step, completed, autoReady: allDone },
  })

  // Tüm adımlar bitti + cargo delivery → otomatik kargo barkodu denenir (adapter configured ise)
  if (triggerShipping) {
    const adapter = getShippingAdapter()
    if (adapter.isConfigured() && !order.cargoTrackingNo) {
      const weight = order.items[0]?.productSlug === 'bagaj-only' ? 0.8 : 2.5
      const shippingResult = await adapter.createShipment({
        order,
        packageInfo: {
          weight,
          description: `${order.items[0]?.brandName ?? ''} ${order.items[0]?.productName ?? 'Carmat'}`.trim(),
        },
      }).catch((e) => ({ status: 'error', message: e?.message } as any))
      if (shippingResult.status === 'ok') {
        await updateOrder(orderNo, {
          cargoCompany: adapter.provider as any,
          cargoTrackingNo: shippingResult.trackingNumber,
          shippedAt: Date.now(),
        }, {
          status: 'ready',
          at: Date.now(),
          note: `${adapter.provider} otomatik kargo barkodu: ${shippingResult.trackingNumber}`,
          by: 'system',
        })
      }
    }
  }

  const updated = getByOrderNo(orderNo)
  return new Response(JSON.stringify(updated), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
