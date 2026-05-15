/**
 * MultiImageUpload — Çoklu görsel yükleyici (max N).
 *
 * Tek "ana görsel" + 6 ek "galeri" görseli = toplam 7 görsel.
 * Ana görsel = images[0]. Sıralama drag-drop ile değiştirilebilir.
 *
 * Her görsel için: yükle (dosya seç / sürükle bırak), URL yapıştır, sırasını
 * kaydır, kaldır. İlk görsel "ANA" rozeti taşır.
 */
import { useRef, useState } from 'preact/hooks'

interface Props {
  /** Mevcut tüm görsel URL'leri. İlk eleman ana görsel. */
  images: string[]
  /** Maksimum görsel sayısı (default 7). */
  max?: number
  onChange: (next: string[]) => void
  disabled?: boolean
}

export default function MultiImageUpload({ images, max = 7, onChange, disabled = false }: Props) {
  const fileInput = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const [showUrlPaste, setShowUrlPaste] = useState(false)
  const [urlPaste, setUrlPaste] = useState('')

  const slotsLeft = Math.max(0, max - images.length)

  async function uploadFiles(files: FileList | File[]) {
    setError(null)
    const fileArray = Array.from(files).slice(0, slotsLeft)
    if (fileArray.length === 0) {
      if (slotsLeft === 0) setError(`Maksimum ${max} görsel yükleyebilirsiniz`)
      return
    }
    setUploading(true)
    const uploaded: string[] = []
    let done = 0
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        setError(`"${file.name}" resim değil — atlandı`)
        done++
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`"${file.name}" 5 MB üzerinde — atlandı`)
        done++
        continue
      }
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        if (res.ok) {
          const data = await res.json()
          uploaded.push(data.url)
        } else {
          const data = await res.json().catch(() => ({}))
          setError(`"${file.name}": ${data?.error ?? 'yükleme hatası'}`)
        }
      } catch (e: any) {
        setError(e?.message ?? 'Yükleme hatası')
      }
      done++
      setProgress(Math.round((done / fileArray.length) * 100))
    }
    if (uploaded.length > 0) onChange([...images, ...uploaded])
    setUploading(false)
    setTimeout(() => setProgress(0), 600)
  }

  function moveImage(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= images.length || to >= images.length) return
    const next = [...images]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  function removeAt(idx: number) {
    onChange(images.filter((_, i) => i !== idx))
  }

  function setAsMain(idx: number) {
    if (idx === 0) return
    moveImage(idx, 0)
  }

  function addUrl() {
    const u = urlPaste.trim()
    if (!u) return
    if (images.length >= max) {
      setError(`Maksimum ${max} görsel`)
      return
    }
    onChange([...images, u])
    setUrlPaste('')
    setShowUrlPaste(false)
  }

  return (
    <div class="space-y-3">
      {/* Görsel grid */}
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {images.map((src, idx) => (
          <div
            key={`${src}-${idx}`}
            draggable={!disabled}
            onDragStart={() => setDraggingIdx(idx)}
            onDragEnd={() => { setDraggingIdx(null); setDragOverIdx(null) }}
            onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx) }}
            onDragLeave={() => setDragOverIdx(null)}
            onDrop={(e) => {
              e.preventDefault()
              if (draggingIdx !== null) moveImage(draggingIdx, idx)
              setDraggingIdx(null)
              setDragOverIdx(null)
            }}
            class={[
              'relative aspect-square rounded-lg overflow-hidden ring-1 group transition-all',
              idx === 0 ? 'ring-2 ring-[var(--color-primary)]' : 'ring-[var(--color-border)]/60',
              dragOverIdx === idx && 'ring-2 ring-[var(--color-primary)] scale-95',
              draggingIdx === idx && 'opacity-40',
            ].filter(Boolean).join(' ')}
          >
            <img src={src} alt="" class="size-full object-cover" onError={(e: any) => e.currentTarget.style.opacity = '0.3'} />

            {/* Ana rozet */}
            {idx === 0 && (
              <span class="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-[var(--color-primary)] text-black text-[8px] font-black uppercase tracking-wider">
                ANA
              </span>
            )}

            {/* Hover/touch actions */}
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
              {idx !== 0 && (
                <button
                  type="button"
                  onClick={() => setAsMain(idx)}
                  class="px-2 py-1 rounded text-[10px] font-bold bg-white text-black hover:bg-amber-300"
                >
                  ⭐ Ana yap
                </button>
              )}
              <div class="flex gap-1">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(idx, idx - 1)}
                    class="size-6 grid place-items-center rounded bg-white/90 text-black text-xs font-bold hover:bg-white"
                    title="Sola"
                  >‹</button>
                )}
                {idx < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(idx, idx + 1)}
                    class="size-6 grid place-items-center rounded bg-white/90 text-black text-xs font-bold hover:bg-white"
                    title="Sağa"
                  >›</button>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  class="size-6 grid place-items-center rounded bg-red-500 text-white text-xs font-bold hover:bg-red-600"
                  title="Sil"
                >×</button>
              </div>
            </div>
          </div>
        ))}

        {/* Boş slot — yükle */}
        {slotsLeft > 0 && (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={disabled || uploading}
            class="aspect-square rounded-lg border-2 border-dashed border-[var(--color-border)]/60 hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-primary)]/5 grid place-items-center transition-colors disabled:opacity-50"
          >
            <div class="text-center">
              <div class="text-2xl mb-0.5">📤</div>
              <div class="text-[10px] font-semibold text-[var(--color-text-soft)]">{uploading ? `${progress}%` : 'Yükle'}</div>
              <div class="text-[9px] text-[var(--color-text-muted)] mt-0.5">{slotsLeft} kaldı</div>
            </div>
          </button>
        )}
      </div>

      <input
        ref={fileInput as any}
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        onChange={(e) => {
          const fs = (e.target as HTMLInputElement).files
          if (fs && fs.length > 0) uploadFiles(fs)
          ;(e.target as HTMLInputElement).value = ''
        }}
      />

      <div class="flex items-center justify-between gap-2 flex-wrap">
        <p class="text-[11px] text-[var(--color-text-muted)] leading-tight">
          📷 {images.length}/{max} görsel · İlk görsel ürün kartı/listede ana görseldir. Sürükleyerek sırasını değiştirebilirsiniz.
        </p>
        <button
          type="button"
          onClick={() => setShowUrlPaste(!showUrlPaste)}
          class="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          🔗 URL ile ekle
        </button>
      </div>

      {showUrlPaste && slotsLeft > 0 && (
        <div class="flex gap-2">
          <input
            type="url"
            value={urlPaste}
            onInput={(e) => setUrlPaste((e.target as HTMLInputElement).value)}
            placeholder="https://images.pexels.com/..."
            class="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs"
          />
          <button
            type="button"
            onClick={addUrl}
            class="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-primary)] text-black"
          >
            + Ekle
          </button>
        </div>
      )}

      {error && (
        <div class="text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 py-1.5">
          ⚠ {error}
        </div>
      )}
    </div>
  )
}
