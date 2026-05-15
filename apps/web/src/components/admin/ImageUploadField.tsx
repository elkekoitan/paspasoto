/**
 * ImageUploadField — Admin görsel alanı: dosya yükle VEYA URL yapıştır.
 *
 * Tek bir bileşen olarak ContentManager / Hero / Custom Product
 * formlarının hepsi tarafından kullanılır.
 *
 * Özellikler:
 *  - Drag & drop dosya bırakma
 *  - Veya "Dosya Seç" butonu
 *  - Veya URL yapıştır (manuel)
 *  - Anlık preview (yüklenmiş veya URL yapıştırılmış)
 *  - Upload progress + hata gösterimi
 *  - Yüklenen dosya /uploads/{name} URL'i ile döner; parent value alır
 */
import { useRef, useState } from 'preact/hooks'

interface Props {
  value: string
  onChange: (url: string) => void
  /** Önizleme oranı, default 'square'. */
  aspect?: 'square' | 'video' | 'portrait' | 'wide'
  /** Önizleme boyutu (px). */
  previewSize?: number
  placeholder?: string
  /** Disabled? */
  disabled?: boolean
}

const ASPECT_CLASS: Record<NonNullable<Props['aspect']>, string> = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[16/9]',
}

export default function ImageUploadField({
  value,
  onChange,
  aspect = 'square',
  previewSize = 96,
  placeholder = 'Görsel URL veya dosya yükleyin',
  disabled = false,
}: Props) {
  const fileInput = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  async function handleFile(file: File) {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Sadece resim yükleyebilirsiniz')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Dosya çok büyük (max 5 MB)')
      return
    }
    setUploading(true)
    setProgress(10)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      setProgress(80)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Yükleme başarısız')
      }
      const data = await res.json()
      setProgress(100)
      onChange(data.url)
    } catch (e: any) {
      setError(e?.message ?? 'Yükleme hatası')
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 600)
    }
  }

  function onPickClick() {
    fileInput.current?.click()
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFile(file)
  }

  const hasImage = !!value

  return (
    <div class="space-y-2">
      {/* Drop zone + preview */}
      <div
        class={[
          'relative rounded-xl border-2 border-dashed transition-colors',
          dragOver
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
            : hasImage
              ? 'border-[var(--color-border)]/60 bg-[var(--color-surface)]'
              : 'border-[var(--color-border)]/40 bg-[var(--color-surface-2)]/30 hover:border-[var(--color-border)]',
        ].join(' ')}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div class="flex items-center gap-3 p-3">
          {/* Preview */}
          <div
            class={`${ASPECT_CLASS[aspect]} rounded-lg overflow-hidden bg-[var(--color-bg)] ring-1 ring-[var(--color-border)]/60 shrink-0 grid place-items-center`}
            style={`width: ${previewSize}px;`}
          >
            {hasImage ? (
              <img src={value} alt="" class="size-full object-cover" onError={(e: any) => e.currentTarget.style.opacity = '0.3'} />
            ) : (
              <span class="text-2xl opacity-40">📷</span>
            )}
          </div>

          {/* Eylemler */}
          <div class="flex-1 min-w-0 space-y-1.5">
            <div class="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={onPickClick}
                disabled={disabled || uploading}
                class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-primary)] text-black hover:opacity-90 disabled:opacity-50"
              >
                {uploading ? `Yükleniyor ${progress}%…` : (hasImage ? '↻ Değiştir' : '📤 Dosya Seç')}
              </button>
              {hasImage && (
                <button
                  type="button"
                  onClick={() => onChange('')}
                  disabled={disabled || uploading}
                  class="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[var(--color-text-muted)] hover:text-red-400"
                >
                  🗑 Kaldır
                </button>
              )}
            </div>
            <p class="text-[10px] text-[var(--color-text-muted)] leading-tight">
              Sürükle bırak veya yapıştır. JPG/PNG/WEBP, max 5 MB.
            </p>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInput as any}
          type="file"
          accept="image/*"
          class="hidden"
          onChange={(e) => {
            const f = (e.target as HTMLInputElement).files?.[0]
            if (f) handleFile(f)
          }}
        />

        {/* Progress bar */}
        {uploading && (
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-surface-2)] rounded-b-xl overflow-hidden">
            <div class="h-full bg-[var(--color-primary)] transition-all" style={`width: ${progress}%`}></div>
          </div>
        )}
      </div>

      {/* URL fallback — paste'le yapıştırma */}
      <details class="text-xs">
        <summary class="cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text)] select-none">
          🔗 URL yapıştırarak ekle
        </summary>
        <input
          type="url"
          value={value}
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
          placeholder={placeholder}
          disabled={disabled}
          class="mt-1.5 w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-xs"
        />
      </details>

      {error && (
        <div class="text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 py-1.5">
          ⚠ {error}
        </div>
      )}
    </div>
  )
}
