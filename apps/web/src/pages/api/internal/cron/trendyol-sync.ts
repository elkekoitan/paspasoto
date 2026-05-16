// POST /api/internal/cron/trendyol-sync
//
// Coolify cron job tetikler. Son N saatteki Trendyol siparişlerini çeker.
// Auth: X-Cron-Secret header (CRON_SECRET env ile eşleşmeli)
//
// Coolify cron örneği (her 15 dk):
//   minute=15 ... saat... curl -X POST https://carmat.com.tr/api/internal/cron/trendyol-sync \
//     -H "X-Cron-Secret: {CRON_SECRET}"
import type { APIRoute } from 'astro'

export const prerender = false

const SINCE_HOURS = 1 // Her cron koşusunda son 1 saat çekilir

export const POST: APIRoute = async ({ request }) => {
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret) {
    return new Response(JSON.stringify({ error: 'CRON_SECRET env not set' }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    })
  }
  const providedSecret = request.headers.get('X-Cron-Secret')
  if (providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
  }

  // Trendyol sync endpoint'ini dahili olarak çağır
  try {
    const internalRes = await fetch(
      `${process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321'}/api/integrations/trendyol/sync`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Cron': '1' },
        body: JSON.stringify({ sinceHours: SINCE_HOURS }),
      },
    )
    const data = await internalRes.json().catch(() => ({}))
    return new Response(JSON.stringify({ ok: true, sinceHours: SINCE_HOURS, ...data }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'sync_failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
