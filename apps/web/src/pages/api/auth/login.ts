import type { APIRoute } from 'astro'
import { createSession, setSessionCookie } from '../../../server/auth'
import { verifyUserCredentials, markLoggedIn, seedPatronIfEmpty } from '../../../server/users'

export const prerender = false

/**
 * POST /api/auth/login — username + password.
 *
 * Backward-compat: form'da sadece "password" varsa (eski form) → username
 * varsayılan olarak 'patron' kullanılır (env ADMIN_USERNAME ile override).
 * Bu sayede mevcut localStorage/cookie'ye sahip kullanıcı tek alanla giriş yapabilir.
 */
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // İlk istek: users.json boşsa patron seed et
  seedPatronIfEmpty()

  const form = await request.formData().catch(() => null)
  const password = form?.get('password')?.toString() ?? ''
  const username = (form?.get('username')?.toString() ?? process.env.ADMIN_USERNAME ?? 'patron').trim()

  if (!password || !username) {
    return redirect('/admin/login?error=missing', 303)
  }

  const user = verifyUserCredentials(username, password)
  if (!user) {
    return redirect('/admin/login?error=invalid', 303)
  }

  markLoggedIn(user.id)
  setSessionCookie(cookies, createSession(user))

  // Role'e göre redirect
  const dest = user.role === 'patron' ? '/admin/patron' : '/admin/personel'
  return redirect(dest, 303)
}
