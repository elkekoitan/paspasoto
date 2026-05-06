/**
 * Basit admin auth — env variable ADMIN_PASSWORD ile kontrol.
 * Session: HMAC-imzalı cookie (server-side stateless).
 *
 * KOBİ paneli için tek admin kullanıcı yeterli.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { AstroCookies } from 'astro'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'paspasoto2026'
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'change-me-in-production-please-this-is-a-long-default-secret'
const COOKIE_NAME = 'paspasoto_admin'
const SESSION_TTL_DAYS = 30

function sign(payload: string): string {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
}

function verifyPassword(input: string): boolean {
  // timing-safe comparison
  const a = Buffer.from(input)
  const b = Buffer.from(ADMIN_PASSWORD)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export type Session = { sub: 'admin'; iat: number; exp: number }

export function createSession(): string {
  const now = Date.now()
  const payload: Session = {
    sub: 'admin',
    iat: now,
    exp: now + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = sign(body)
  return `${body}.${sig}`
}

export function verifySession(token: string | undefined): Session | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = sign(body)
  // timing-safe check
  if (sig.length !== expected.length) return null
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    const session = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Session
    if (session.sub !== 'admin') return null
    if (session.exp < Date.now()) return null
    return session
  } catch {
    return null
  }
}

export function loginCheck(password: string): boolean {
  return verifyPassword(password)
}

export function setSessionCookie(cookies: AstroCookies, token: string) {
  cookies.set(COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  })
}

export function clearSessionCookie(cookies: AstroCookies) {
  cookies.delete(COOKIE_NAME, { path: '/' })
}

export function getSession(cookies: AstroCookies): Session | null {
  const token = cookies.get(COOKIE_NAME)?.value
  return verifySession(token)
}

export function requireAdmin(cookies: AstroCookies): Session {
  const s = getSession(cookies)
  if (!s) throw new Response('Unauthorized', { status: 401 })
  return s
}
