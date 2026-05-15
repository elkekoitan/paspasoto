/**
 * POST /api/admin/upload — Admin görsel yükleme.
 *
 * multipart/form-data:
 *   file: File (max 5 MB, image/* only)
 *
 * Response: { url: '/uploads/abc-123.webp', size, name }
 *
 * Yüklenen URL admin formlarına (ürün görseli, swatch, hero, vb.)
 * yapıştırılır veya doğrudan input.value = url ile bağlanır.
 */
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../server/auth'
import { saveUploadFile, listUploads, MAX_UPLOAD_BYTES } from '../../../server/uploads'

export const prerender = false

export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return new Response(JSON.stringify({ error: 'multipart_required' }), { status: 400 })
  }
  const file = form.get('file')
  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'file_required' }), { status: 400 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return new Response(
      JSON.stringify({ error: `Dosya cok buyuk (max ${(MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0)} MB)` }),
      { status: 413 },
    )
  }
  if (!file.type.startsWith('image/')) {
    return new Response(JSON.stringify({ error: 'Sadece resim dosyalari yuklenebilir' }), { status: 400 })
  }
  try {
    const buf = new Uint8Array(await file.arrayBuffer())
    const url = saveUploadFile(buf, file.name || 'image', file.type)
    return new Response(
      JSON.stringify({ url, size: file.size, name: file.name }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'Yukleme basarisiz' }), { status: 400 })
  }
}

export const GET: APIRoute = async ({ cookies }) => {
  try {
    requireAuth(cookies)
  } catch (r) {
    return r as Response
  }
  return new Response(JSON.stringify(listUploads()), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
