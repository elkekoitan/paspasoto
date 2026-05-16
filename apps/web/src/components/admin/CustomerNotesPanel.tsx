/**
 * CustomerNotesPanel — Müşteri detay sayfası için admin notu thread'i.
 */
import { useState } from 'preact/hooks'
import { formatDateTime } from '../../lib/format'

interface CustomerNote {
  id: string
  by: string
  body: string
  at: number
}

export default function CustomerNotesPanel({ phoneKey, initialNotes }: { phoneKey: string; initialNotes: CustomerNote[] }) {
  const [notes, setNotes] = useState<CustomerNote[]>(initialNotes)
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  async function add() {
    const text = body.trim()
    if (!text) return
    setSaving(true)
    const res = await fetch(`/api/admin/customers/${encodeURIComponent(phoneKey)}/note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    })
    setSaving(false)
    if (res.ok) {
      const note = await res.json()
      setNotes((prev) => [...prev, note])
      setBody('')
    }
  }

  async function remove(id: string) {
    if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return
    const res = await fetch(`/api/admin/customers/${encodeURIComponent(phoneKey)}/note?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (res.ok) setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  const sorted = [...notes].sort((a, b) => b.at - a.at)

  return (
    <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
      <h3 class="font-display text-base font-semibold mb-3 flex items-center gap-2">
        📝 İç Notlar
        {notes.length > 0 && (
          <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold">
            {notes.length}
          </span>
        )}
      </h3>
      <p class="text-[11px] text-[var(--color-text-muted)] mb-3">
        Sadece personel görür. Müşteri görmez.
      </p>

      <div class="space-y-2">
        <textarea
          value={body}
          onInput={(e) => setBody((e.target as HTMLTextAreaElement).value)}
          rows={2}
          placeholder="Müşteri hakkında not… (örn: büyük müşteri, ödemeleri yavaş, ...)"
          class="w-full px-2.5 py-1.5 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] text-xs resize-none"
        />
        <button
          type="button"
          onClick={add}
          disabled={saving || !body.trim()}
          class="w-full px-3 py-2 rounded-md bg-[var(--color-primary)] text-black text-xs font-bold disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor…' : '+ Not Ekle'}
        </button>
      </div>

      {sorted.length === 0 ? (
        <p class="text-xs text-[var(--color-text-muted)] text-center py-4 mt-3">Henüz not yok.</p>
      ) : (
        <ul class="mt-4 space-y-2">
          {sorted.map((n) => (
            <li class="rounded-lg p-2.5 bg-amber-500/10 border border-amber-500/30">
              <div class="flex items-start justify-between gap-2 mb-1">
                <span class="text-[10px] text-[var(--color-text-muted)]">
                  {n.by} · {formatDateTime(n.at)}
                </span>
                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  class="text-[10px] text-[var(--color-text-muted)] hover:text-red-400"
                  title="Sil"
                >
                  ✕
                </button>
              </div>
              <p class="text-xs whitespace-pre-wrap break-words leading-relaxed">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
