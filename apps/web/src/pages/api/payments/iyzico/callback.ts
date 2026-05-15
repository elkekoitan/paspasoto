import type { APIRoute } from 'astro'
import { getByOrderNo, updateOrder } from '../../../../server/db'
import { retrieveCheckoutResult } from '../../../../server/payments/iyzico'

export const prerender = false

/**
 * POST /api/payments/iyzico/callback
 * iyzico ödeme tamamlandığında hosted form bu URL'e form POST eder
 * (form fields: token, conversationData, ...).
 *
 * Akış:
 * 1. token ile retrieveCheckoutResult çağrılır
 * 2. Başarılıysa Order.paymentStatus='tamamlandi', paidAmount=total
 * 3. Başarısızsa Order durumu değişmez (admin manuel ele alır)
 * 4. /odeme/sonuc sayfasına redirect (success/failure)
 */
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData().catch(() => null)
  const token = form?.get('token')?.toString()
  if (!token) {
    return redirect('/odeme/sonuc?status=failure&reason=token_missing', 303)
  }

  const result = await retrieveCheckoutResult(token)

  if (result.status === 'not_configured') {
    return redirect('/odeme/sonuc?status=failure&reason=not_configured', 303)
  }
  if (result.status === 'error') {
    return redirect('/odeme/sonuc?status=failure&reason=sdk_error', 303)
  }
  if (result.status === 'failure') {
    return redirect(`/odeme/sonuc?status=failure&orderNo=${encodeURIComponent(result.orderNo)}`, 303)
  }

  // SUCCESS — order'ı güncelle (idempotent: zaten ödenmişse tekrar update etme)
  const order = getByOrderNo(result.orderNo)
  if (order && order.paymentStatus !== 'tamamlandi') {
    await updateOrder(
      order.orderNo,
      {
        paymentStatus: 'tamamlandi',
        paidAmount: result.paidAmount,
        paymentMethod: 'iyzico',
        paidAt: Date.now(),
      },
      {
        status: order.productionStatus ?? 'received',
        at: Date.now(),
        note: `iyzico ödemesi alındı: ${result.paidAmount.toFixed(2)}₺`,
        by: 'iyzico',
      },
    )
  }
  return redirect(`/odeme/sonuc?status=success&orderNo=${encodeURIComponent(result.orderNo)}`, 303)
}

// GET de destekle — iyzico bazı durumlarda GET çağırabilir
export const GET: APIRoute = async ({ url, redirect }) => {
  const token = url.searchParams.get('token')
  if (!token) return redirect('/odeme/sonuc?status=failure&reason=token_missing', 303)

  const result = await retrieveCheckoutResult(token)
  if (result.status !== 'success') {
    const reason = result.status === 'failure' ? '' : `&reason=${result.status}`
    return redirect(`/odeme/sonuc?status=failure${reason}`, 303)
  }
  const order = getByOrderNo(result.orderNo)
  // Idempotent: zaten tamamlandı ise tekrar update etmiyoruz
  if (order && order.paymentStatus !== 'tamamlandi') {
    await updateOrder(order.orderNo, {
      paymentStatus: 'tamamlandi',
      paidAmount: result.paidAmount,
      paymentMethod: 'iyzico',
      paidAt: Date.now(),
    })
  }
  return redirect(`/odeme/sonuc?status=success&orderNo=${encodeURIComponent(result.orderNo)}`, 303)
}
