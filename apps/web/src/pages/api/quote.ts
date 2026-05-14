import type { APIRoute } from 'astro'

export const prerender = false

/**
 * POST /api/quote — DEPRECATED.
 *
 * Quote (ön talep) akışı kaldırıldı. Yeni akış: müşteri sepete ekler →
 * /odeme sayfası → /api/orders/checkout. Tüm konfigüratör çıktıları artık
 * doğrudan sipariş olarak kaydedilir.
 *
 * Bu endpoint geriye dönük uyumluluk için 410 Gone döndürür ve müşteriyi
 * yeni akışa yönlendirir. 3 ay sonra tamamen kaldırılacak.
 */
export const POST: APIRoute = async () =>
  new Response(
    JSON.stringify({
      error: 'Bu endpoint kaldırıldı.',
      message: 'Sipariş için lütfen /odeme sayfasını kullanın.',
      newEndpoint: '/api/orders/checkout',
    }),
    {
      status: 410,
      headers: {
        'Content-Type': 'application/json',
        'X-Deprecated': 'true',
      },
    },
  )
