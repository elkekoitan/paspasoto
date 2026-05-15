/**
 * GET /api/shipping/track?trackingNumber=...
 *
 * Public endpoint — müşteri sipariş takip sayfasında kullanır.
 * Provider'a göre durumu sorgular ve normalize eder.
 */
import type { APIRoute } from 'astro'
import { getShippingAdapter } from '../../../server/shipping'

export const prerender = false

export const GET: APIRoute = async ({ url }) => {
  const trackingNumber = url.searchParams.get('trackingNumber')
  if (!trackingNumber) {
    return new Response(JSON.stringify({ error: 'tracking_number_required' }), { status: 400 })
  }

  const adapter = getShippingAdapter()
  if (!adapter.isConfigured()) {
    return new Response(
      JSON.stringify({ error: 'not_configured', provider: adapter.provider }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const result = await adapter.trackShipment(trackingNumber)
  const status = result.status === 'ok' ? 200 : result.status === 'not_found' ? 404 : 502
  return new Response(JSON.stringify(result), {
    status, headers: { 'Content-Type': 'application/json' },
  })
}
