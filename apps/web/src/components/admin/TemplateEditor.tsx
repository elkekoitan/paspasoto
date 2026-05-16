/**
 * TemplateEditor — admin /admin/sablonlar için inline edit.
 */
import { useState } from 'preact/hooks'
import type { MessageTemplate, TemplateKey } from '../../lib/template-types'

export default function TemplateEditor({ initial }: { initial: MessageTemplate[] }) {
  const [templates, setTemplates] = useState<MessageTemplate[]>(initial)

  async function save(key: TemplateKey, patch: Partial<MessageTemplate>) {
    const res = await fetch(`/api/admin/templates/${key}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const updated = await res.json()
      setTemplates((prev) => prev.map((t) => t.key === key ? updated : t))
    }
    return res.ok
  }

  async function reset(key: TemplateKey) {
    if (!confirm('Bu şablonu varsayılan haline döndürmek istediğinize emin misiniz?')) return
    const res = await fetch(`/api/admin/templates/${key}`, { method: 'DELETE' })
    if (res.ok) {
      const updated = await res.json()
      setTemplates((prev) => prev.map((t) => t.key === key ? updated : t))
    }
  }

  return (
    <div class="space-y-4">
      {templates.map((t) => (
        <TemplateCard key={t.key} template={t} onSave={save} onReset={() => reset(t.key)} />
      ))}
    </div>
  )
}

function TemplateCard({ template, onSave, onReset }: { template: MessageTemplate; onSave: (key: TemplateKey, patch: Partial<MessageTemplate>) => Promise<boolean>; onReset: () => void }) {
  const [open, setOpen] = useState(false)
  const [wa, setWa] = useState(template.variants.whatsapp ?? '')
  const [emailSubject, setEmailSubject] = useState(template.variants.email?.subject ?? '')
  const [emailBody, setEmailBody] = useState(template.variants.email?.body ?? '')
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  async function handleSave() {
    setSaving(true)
    const ok = await onSave(template.key, {
      variants: {
        whatsapp: wa || undefined,
        email: emailSubject || emailBody ? { subject: emailSubject, body: emailBody } : undefined,
      },
    })
    setSaving(false)
    if (ok) {
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1800)
    }
  }

  return (
    <div class="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        class="w-full p-4 flex items-center gap-3 hover:bg-[var(--color-surface-2)] transition-colors text-left"
      >
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-sm">{template.label}</h3>
          <p class="text-[11px] text-[var(--color-text-muted)] mt-0.5">{template.description}</p>
        </div>
        <span class="text-xs text-[var(--color-text-muted)]">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div class="p-4 pt-2 border-t border-[var(--color-border)]/40 space-y-4 bg-[var(--color-surface-2)]/30">
          <div>
            <div class="text-xs font-medium mb-1.5 text-[var(--color-text-soft)]">💬 WhatsApp Mesajı</div>
            <textarea
              value={wa}
              onInput={(e) => setWa((e.target as HTMLTextAreaElement).value)}
              rows={4}
              class="w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm resize-y"
              placeholder="WhatsApp metni — {customerName}, {orderNo} gibi yer tutucular kullanın"
            />
          </div>

          <div>
            <div class="text-xs font-medium mb-1.5 text-[var(--color-text-soft)]">✉ E-posta Konu</div>
            <input
              type="text"
              value={emailSubject}
              onInput={(e) => setEmailSubject((e.target as HTMLInputElement).value)}
              class="w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm"
            />
          </div>

          <div>
            <div class="text-xs font-medium mb-1.5 text-[var(--color-text-soft)]">✉ E-posta Gövde</div>
            <textarea
              value={emailBody}
              onInput={(e) => setEmailBody((e.target as HTMLTextAreaElement).value)}
              rows={5}
              class="w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm resize-y"
            />
          </div>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button type="button" onClick={onReset} class="text-xs text-[var(--color-text-muted)] hover:text-red-400">
              ↻ Varsayılana Döndür
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              class={[
                'px-5 py-2 rounded-lg text-sm font-bold transition-colors',
                savedFlash ? 'bg-emerald-500 text-white' : 'bg-[var(--color-primary)] text-black hover:opacity-90',
                saving && 'opacity-50',
              ].join(' ')}
            >
              {savedFlash ? '✓ Kaydedildi' : saving ? 'Kaydediliyor…' : '💾 Kaydet'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
