/**
 * Multi-user auth — Patron + Personel rolleri.
 *
 * Cookie payload v2: { uid, role, username, iat, exp }, HMAC-SHA256 imzalı.
 * Eski v1 (`{ sub: 'admin', iat, exp }`) cookie'leri "admin alias" olarak
 * patron rolüne map edilir — kullanıcı tekrar login olunca v2'ye geçer.
 *
 * İlk istek: users.json boşsa patron seed edilir (ADMIN_PASSWORD env'den).
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { AstroCookies } from 'astro'
import {
  getUser,
  getUserByUsername,
  seedPatronIfEmpty,
  type User,
  type UserRole,
} from './users'

const SESSION_SECRET = process.env.SESSION_SECRET
  ?? 'change-me-in-production-please-this-is-a-long-default-secret'
const COOKIE_NAME = 'paspasoto_admin'
const SESSION_TTL_DAYS = 30
const SESSION_VERSION = 2

let seeded = false
function ensureSeeded(): void {
  if (seeded) return
  seedPatronIfEmpty()
  seeded = true
}

function sign(payload: string): string {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
}

export interface Session {
  v: number
  uid: string
  role: UserRole
  username: string
  iat: number
  exp: number
}

/** v1 cookie payload (legacy) — eski tek-admin sürümü */
interface LegacySessionV1 {
  sub: 'admin'
  iat: number
  exp: number
}

export function createSession(user: User): string {
  const now = Date.now()
  const payload: Session = {
    v: SESSION_VERSION,
    uid: user.id,
    role: user.role,
    username: user.username,
    iat: now,
    exp: now + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = sign(body)
  return `${body}.${sig}`
}

export function verifySession(token: string | undefined): Session | null {
  ensureSeeded()
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = sign(body)
  if (sig.length !== expected.length) return null
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))

    // v2 cookie
    if (parsed.v === SESSION_VERSION) {
      const s = parsed as Session
      if (s.exp < Date.now()) return null
      return s
    }

    // v1 legacy cookie (sub === 'admin') → patron alias
    if ((parsed as LegacySessionV1).sub === 'admin') {
      const legacy = parsed as LegacySessionV1
      if (legacy.exp < Date.now()) return null
      // İlk patron user'ı bul ve onun bilgileriyle session döndür
      const patron = getUserByUsername(process.env.ADMIN_USERNAME ?? 'patron')
      if (!patron || patron.role !== 'patron') return null
      return {
        v: 1, // legacy işareti — frontend ihtiyacı yok
        uid: patron.id,
        role: 'patron',
        username: patron.username,
        iat: legacy.iat,
        exp: legacy.exp,
      }
    }

    return null
  } catch {
    return null
  }
}

export function setSessionCookie(cookies: AstroCookies, token: string): void {
  const secure = process.env.COOKIE_SECURE === 'true'
  cookies.set(COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  })
}

export function clearSessionCookie(cookies: AstroCookies): void {
  cookies.delete(COOKIE_NAME, { path: '/' })
}

export function getSession(cookies: AstroCookies): Session | null {
  const token = cookies.get(COOKIE_NAME)?.value
  return verifySession(token)
}

/** Aktif session'ın User kaydını döndür (DB lookup). Pasif user → null. */
export function getCurrentUser(cookies: AstroCookies): User | null {
  const s = getSession(cookies)
  if (!s) return null
  const u = getUser(s.uid)
  if (!u || !u.active) return null
  return u
}

/* -------------------- Guards -------------------- */

/** Herhangi bir aktif user (patron veya staff). Throw 401 yoksa. */
export function requireAuth(cookies: AstroCookies): { user: User; session: Session } {
  const s = getSession(cookies)
  if (!s) throw new Response('Unauthorized', { status: 401 })
  const u = getUser(s.uid)
  if (!u || !u.active) throw new Response('Unauthorized', { status: 401 })
  return { user: u, session: s }
}

/** Belirli role(ler) gerekli. Throw 403 yetkisizse. */
export function requireRole(
  cookies: AstroCookies,
  roles: UserRole[],
): { user: User; session: Session } {
  const { user, session } = requireAuth(cookies)
  if (!roles.includes(user.role)) {
    throw new Response('Forbidden', { status: 403 })
  }
  return { user, session }
}

/** Backward-compat: eski requireAdmin → patron yetkisi gerekli */
export function requireAdmin(cookies: AstroCookies): Session {
  const { session } = requireRole(cookies, ['patron'])
  return session
}
