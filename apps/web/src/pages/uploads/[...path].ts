/**
 * GET /uploads/{filename}
 *
 * /data/uploads/ altındaki admin'in yüklediği görselleri serve eder.
 * Astro public/ statik servisini kullanamıyoruz çünkü dosyalar runtime'da
 * persistent volume'a yazılıyor (build çıktısında yok).
 *
 * Path traversal koruma + sadece resim dönüş + uzun cache header.
 */
import type { APIRoute } from 'astro'
import { readUploadFile } from '../../server/uploads'

export const prerender = false

export const GET: APIRoute = async ({ params }) => {
  const path = params.path
  if (!path || typeof path !== 'string') {
    return new Response('Not Found', { status: 404 })
  }
  // path traversal koruma — sadece son segment (filename) kabul edilir
  const filename = path.split('/').pop()
  if (!filename) return new Response('Not Found', { status: 404 })

  const file = readUploadFile(filename)
  if (!file) return new Response('Not Found', { status: 404 })

  return new Response(file.buffer as any, {
    status: 200,
    headers: {
      'Content-Type': file.mime,
      'Content-Length': String(file.size),
      // Yüklenen dosyalar hash benzeri unique isimler, agresif cache OK
      'Cache-Control': 'public, max-age=2592000, immutable', // 30 gün
    },
  })
}
