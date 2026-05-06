import type { APIRoute } from 'astro'
import { loginCheck, createSession, setSessionCookie } from '../../../server/auth'

export const prerender = false

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData().catch(() => null)
  const password = form?.get('password')?.toString() ?? ''
  if (!loginCheck(password)) {
    return redirect('/admin/login?error=1', 303)
  }
  setSessionCookie(cookies, createSession())
  return redirect('/admin', 303)
}
