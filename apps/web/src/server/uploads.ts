/**
 * uploads.ts — Admin'in yüklediği görselleri yönetir.
 *
 * Konum: /data/uploads/ (Coolify persistent volume) — DATA_DIR/uploads
 * Public URL: /uploads/{filename}  (API route ile stream edilir)
 *
 * Güvenlik:
 *  - Sadece auth'lu admin upload edebilir
 *  - Sadece resim MIME tipleri kabul edilir (jpeg/png/webp/gif)
 *  - Max 5 MB
 *  - Filename sanitize edilir (path traversal koruma)
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync, statSync, readdirSync, unlinkSync } from 'node:fs'
import { resolve, extname } from 'node:path'

const DATA_DIR = process.env.DATA_DIR ?? resolve(process.cwd(), '.data')
const UPLOADS_DIR = resolve(DATA_DIR, 'uploads')

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIMES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

function ensure() {
  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })
}

function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'image'
}

/**
 * Dosyayı /data/uploads/ altına yazar. Filename çakışması olmasın diye
 * timestamp + random suffix eklenir.
 *
 * @returns Public URL relative path: /uploads/{filename}
 */
export function saveUploadFile(buffer: Uint8Array, originalName: string, mime: string): string {
  ensure()
  const ext = ALLOWED_MIMES[mime] ?? (extname(originalName).toLowerCase() || '.bin')
  if (!Object.values(ALLOWED_MIMES).includes(ext)) {
    throw new Error('Sadece resim dosyaları yüklenebilir (JPG, PNG, WEBP, GIF)')
  }
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error(`Dosya çok büyük (max ${(MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0)} MB)`)
  }
  const baseName = sanitizeName(originalName.replace(/\.[^.]+$/, ''))
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 6)
  const filename = `${baseName}-${ts}${rand}${ext}`
  const fullPath = resolve(UPLOADS_DIR, filename)

  // Path traversal koruma — fullPath UPLOADS_DIR içinde mi
  if (!fullPath.startsWith(UPLOADS_DIR)) {
    throw new Error('Geçersiz dosya yolu')
  }

  writeFileSync(fullPath, buffer)
  return `/uploads/${filename}`
}

/** /data/uploads/{filename} → Buffer (dosya yoksa null). path traversal koruma. */
export function readUploadFile(filename: string): { buffer: Buffer; mime: string; size: number } | null {
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return null
  }
  const fullPath = resolve(UPLOADS_DIR, filename)
  if (!fullPath.startsWith(UPLOADS_DIR) || !existsSync(fullPath)) return null

  const buf = readFileSync(fullPath)
  const st = statSync(fullPath)
  const ext = extname(filename).toLowerCase()
  const mime =
    ext === '.png' ? 'image/png' :
    ext === '.webp' ? 'image/webp' :
    ext === '.gif' ? 'image/gif' :
    ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
    'application/octet-stream'
  return { buffer: buf, mime, size: st.size }
}

/** Tüm yüklü dosyaları listele (admin galerisi için). */
export function listUploads(): Array<{ name: string; url: string; size: number; mtime: number }> {
  ensure()
  try {
    return readdirSync(UPLOADS_DIR).map((name) => {
      const st = statSync(resolve(UPLOADS_DIR, name))
      return { name, url: `/uploads/${name}`, size: st.size, mtime: st.mtimeMs }
    }).sort((a, b) => b.mtime - a.mtime)
  } catch {
    return []
  }
}

/** Bir yüklü dosyayı sil (admin galeri yönetimi). */
export function deleteUploadFile(filename: string): boolean {
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false
  }
  const fullPath = resolve(UPLOADS_DIR, filename)
  if (!fullPath.startsWith(UPLOADS_DIR) || !existsSync(fullPath)) return false
  try {
    unlinkSync(fullPath)
    return true
  } catch {
    return false
  }
}
