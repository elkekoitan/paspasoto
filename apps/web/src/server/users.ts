/**
 * Çoklu kullanıcı yönetimi — patron + personel rolleri.
 *
 * Storage: DATA_DIR/users.json (atomic write+rename)
 * Hash:    PBKDF2-SHA256, 100k iter, 64 byte key (Node crypto, sıfır dep)
 *
 * Roller:
 *   - 'patron' : Tam yetki (tek hesap, tüm finansal raporlar)
 *   - 'staff'  : Sınırlı (kendi siparişleri + günlük ciro)
 *
 * İlk migration: ADMIN_PASSWORD env'inden tek patron yarat (idempotent).
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs'
import { resolve } from 'node:path'
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'

export type UserRole = 'patron' | 'staff'

export interface User {
  id: string
  username: string
  displayName: string
  passwordHash: string
  passwordSalt: string
  role: UserRole
  active: boolean
  createdAt: number
  lastLoginAt?: number
}

type UsersFile = {
  users: User[]
  meta: { version: number }
}

const DATA_DIR = process.env.DATA_DIR ?? resolve(process.cwd(), '.data')
const FILE = resolve(DATA_DIR, 'users.json')

const HASH_ITERATIONS = 100_000
const HASH_KEYLEN = 64
const HASH_DIGEST = 'sha256'

/* -------------------- Storage helpers -------------------- */

function ensure(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(FILE)) {
    const initial: UsersFile = { users: [], meta: { version: 1 } }
    writeFileSync(FILE, JSON.stringify(initial, null, 2), 'utf8')
  }
}

function read(): UsersFile {
  ensure()
  try {
    return JSON.parse(readFileSync(FILE, 'utf8')) as UsersFile
  } catch {
    return { users: [], meta: { version: 1 } }
  }
}

function write(data: UsersFile): void {
  ensure()
  const tmp = `${FILE}.tmp`
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  renameSync(tmp, FILE)
}

/* -------------------- Hash helpers -------------------- */

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt ?? randomBytes(16).toString('hex')
  const buf = pbkdf2Sync(password, useSalt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST)
  return { hash: buf.toString('hex'), salt: useSalt }
}

function verifyPasswordHash(password: string, hash: string, salt: string): boolean {
  const { hash: derived } = hashPassword(password, salt)
  const a = Buffer.from(derived, 'hex')
  const b = Buffer.from(hash, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function newId(prefix = 'u'): string {
  return `${prefix}_${randomBytes(6).toString('hex')}`
}

/* -------------------- CRUD -------------------- */

export function listUsers(): User[] {
  return read().users
}

export function getUser(id: string): User | null {
  return read().users.find((u) => u.id === id) ?? null
}

export function getUserByUsername(username: string): User | null {
  const u = read().users.find(
    (x) => x.username.toLowerCase() === username.trim().toLowerCase(),
  )
  return u ?? null
}

export function createUser(input: {
  username: string
  displayName?: string
  password: string
  role: UserRole
}): User {
  const username = input.username.trim().toLowerCase()
  if (!username || username.length < 3) {
    throw new Error('Kullanıcı adı en az 3 karakter olmalı')
  }
  if (!/^[a-z0-9_.-]+$/.test(username)) {
    throw new Error('Kullanıcı adı sadece küçük harf, rakam, _ . - içerebilir')
  }
  if (input.password.length < 6) {
    throw new Error('Şifre en az 6 karakter olmalı')
  }
  const data = read()
  if (data.users.some((u) => u.username.toLowerCase() === username)) {
    throw new Error('Bu kullanıcı adı zaten alınmış')
  }
  // Patron tek hesap kuralı
  if (input.role === 'patron' && data.users.some((u) => u.role === 'patron')) {
    throw new Error('Sistemde zaten bir patron hesabı var')
  }
  const { hash, salt } = hashPassword(input.password)
  const user: User = {
    id: newId(),
    username,
    displayName: input.displayName?.trim() || username,
    passwordHash: hash,
    passwordSalt: salt,
    role: input.role,
    active: true,
    createdAt: Date.now(),
  }
  data.users.push(user)
  write(data)
  return user
}

export function updateUser(
  id: string,
  patch: Partial<Pick<User, 'displayName' | 'active'>> & { password?: string },
): User | null {
  const data = read()
  const i = data.users.findIndex((u) => u.id === id)
  if (i < 0) return null
  const u = data.users[i]!
  if (patch.displayName !== undefined) u.displayName = patch.displayName.trim()
  if (patch.active !== undefined) u.active = patch.active
  if (patch.password !== undefined && patch.password.length >= 6) {
    const { hash, salt } = hashPassword(patch.password)
    u.passwordHash = hash
    u.passwordSalt = salt
  }
  write(data)
  return u
}

export function deactivateUser(id: string): boolean {
  const data = read()
  const u = data.users.find((x) => x.id === id)
  if (!u) return false
  if (u.role === 'patron') {
    throw new Error('Patron hesabı pasifleştirilemez')
  }
  u.active = false
  write(data)
  return true
}

export function markLoggedIn(id: string): void {
  const data = read()
  const u = data.users.find((x) => x.id === id)
  if (!u) return
  u.lastLoginAt = Date.now()
  write(data)
}

/* -------------------- Auth -------------------- */

/** Username + password doğrulama. Başarısızsa null. Timing-safe. */
export function verifyUserCredentials(username: string, password: string): User | null {
  const u = getUserByUsername(username)
  if (!u || !u.active) return null
  if (!verifyPasswordHash(password, u.passwordHash, u.passwordSalt)) return null
  return u
}

/* -------------------- Migration: seed patron from env -------------------- */

/**
 * users.json boşsa ADMIN_PASSWORD env'inden tek patron user üret.
 * Idempotent — patron varsa hiçbir şey yapmaz.
 *
 * Bu fonksiyon her server başlangıcında çağrılır (auth.ts içinden lazy).
 */
export function seedPatronIfEmpty(): User | null {
  const data = read()
  if (data.users.length > 0) return null

  const password = process.env.ADMIN_PASSWORD ?? 'paspasoto2026'
  const username = process.env.ADMIN_USERNAME ?? 'patron'
  const displayName = process.env.ADMIN_DISPLAYNAME ?? 'Patron'

  try {
    return createUser({ username, displayName, password, role: 'patron' })
  } catch {
    return null
  }
}
