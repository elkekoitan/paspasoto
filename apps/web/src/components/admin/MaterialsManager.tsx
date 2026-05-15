/**
 * MaterialsManager — Hammadde takip (EVA foam, kenarlık, topukluk vb.)
 */
import { useState } from 'preact/hooks'
import type {
  MaterialItem,
  MaterialCategory,
  MaterialUnit,
} from '../../lib/materials-types'
import { MATERIAL_CATEGORY_LABELS, MATERIAL_UNIT_LABELS } from '../../lib/materials-types'

interface Props {
  initial: MaterialItem[]
}

export default function MaterialsManager({ initial }: Props) {
  const [items, setItems] = useState<MaterialItem[]>(initial)
  const [filter, setFilter] = useState<MaterialCategory | 'all' | 'low'>('all')
  const [showAdd, setShowAdd] = useState(false)

  const filtered = items.filter((m) => {
    if (filter === 'all') return true
    if (filter === 'low') return m.minThreshold != null && m.quantity <= m.minThreshold
    return m.category === filter
  })

  async function refresh() {
    const res = await fetch('/api/admin/materials')
    if (res.ok) setItems(await res.json())
  }

  return (
    <div>
      {/* Filtre + ekle */}
      <div class="flex flex-col md:flex-row gap-3 mb-5">
        <div class="flex flex-wrap gap-2 flex-1">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>Tümü ({items.length})</FilterChip>
          <FilterChip active={filter === 'low'} onClick={() => setFilter('low')}>⚠ Düşük Stok ({items.filter((m) => m.minThreshold != null && m.quantity <= m.minThreshold).length})</FilterChip>
          {Object.entries(MATERIAL_CATEGORY_LABELS).map(([k, label]) => {
            const count = items.filter((m) => m.category === k).length
            if (count === 0) return null
            return (
              <FilterChip key={k} active={filter === k} onClick={() => setFilter(k as MaterialCategory)}>
                {label} ({count})
              </FilterChip>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          class="px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-black font-semibold text-sm hover:opacity-90 whitespace-nowrap"
        >
          {showAdd ? '✕ Kapat' : '+ Yeni Hammadde'}
        </button>
      </div>

      {showAdd && (
        <AddMaterialForm
          onAdded={(m) => {
            setItems((prev) => [m, ...prev])
            setShowAdd(false)
          }}
        />
      )}

      {/* Tablo */}
      {filtered.length === 0 ? (
        <div class="text-center py-16 text-[var(--color-text-muted)]">
          Bu filtrede hammadde yok. "+ Yeni Hammadde" ile başlayın.
        </div>
      ) : (
        <div class="space-y-3">
          {filtered.map((m) => (
            <MaterialRow key={m.id} material={m} onUpdate={(updated) => {
              setItems((prev) => prev.map((x) => x.id === m.id ? updated : x))
            }} onDelete={async () => {
              if (!confirm(`"${m.name}" hammaddesini silmek istediğinize emin misiniz?`)) return
              const res = await fetch(`/api/admin/materials/${m.id}`, { method: 'DELETE' })
              if (res.ok) setItems((prev) => prev.filter((x) => x.id !== m.id))
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({ active, onClick, children }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      class={[
        'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap',
        active
          ? 'bg-[var(--color-primary)] text-black'
          : 'bg-[var(--color-surface)] text-[var(--color-text-soft)] hover:bg-[var(--color-surface-2)]',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

/* ---------------- Add form ---------------- */

function AddMaterialForm({ onAdded }: { onAdded: (m: MaterialItem) => void }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<MaterialCategory>('eva-foam')
  const [color, setColor] = useState('')
  const [unit, setUnit] = useState<MaterialUnit>('m2')
  const [quantity, setQuantity] = useState<number>(0)
  const [minThreshold, setMinThreshold] = useState<number | ''>('')
  const [supplier, setSupplier] = useState('')
  const [costPerUnit, setCostPerUnit] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    const res = await fetch('/api/admin/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        category,
        color: color.trim() || undefined,
        unit,
        quantity,
        minThreshold: minThreshold === '' ? undefined : Number(minThreshold),
        supplier: supplier.trim() || undefined,
        costPerUnit: costPerUnit === '' ? undefined : Number(costPerUnit),
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      const m = await res.json()
      onAdded(m)
    }
  }

  return (
    <form onSubmit={handleSubmit} class="rounded-2xl border border-[var(--color-primary)]/40 bg-[var(--color-surface)] p-4 md:p-5 mb-5 space-y-3">
      <h3 class="font-semibold text-base">Yeni Hammadde Ekle</h3>
      <div class="grid sm:grid-cols-2 gap-3">
        <Field label="Hammadde Adı *">
          <input type="text" value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} placeholder="örn: EVA Foam 1cm Bal Petek" class={inp} required />
        </Field>
        <Field label="Kategori *">
          <select value={category} onChange={(e) => setCategory((e.target as HTMLSelectElement).value as MaterialCategory)} class={inp}>
            {Object.entries(MATERIAL_CATEGORY_LABELS).map(([k, v]) => <option value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Renk / Varyant (opsiyonel)">
          <input type="text" value={color} onInput={(e) => setColor((e.target as HTMLInputElement).value)} placeholder="Siyah, Graphite, ..." class={inp} />
        </Field>
        <Field label="Birim *">
          <select value={unit} onChange={(e) => setUnit((e.target as HTMLSelectElement).value as MaterialUnit)} class={inp}>
            {Object.entries(MATERIAL_UNIT_LABELS).map(([k, v]) => <option value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Başlangıç Stoğu *">
          <input type="number" step="0.01" value={quantity} onInput={(e) => setQuantity(parseFloat((e.target as HTMLInputElement).value) || 0)} class={inp} required />
        </Field>
        <Field label="Düşük Stok Uyarı Eşiği (opsiyonel)">
          <input type="number" step="0.01" value={minThreshold} onInput={(e) => { const v = (e.target as HTMLInputElement).value; setMinThreshold(v === '' ? '' : parseFloat(v)) }} placeholder="örn: 10" class={inp} />
        </Field>
        <Field label="Tedarikçi (opsiyonel)">
          <input type="text" value={supplier} onInput={(e) => setSupplier((e.target as HTMLInputElement).value)} class={inp} />
        </Field>
        <Field label="Birim Maliyet ₺ (opsiyonel)">
          <input type="number" step="0.01" value={costPerUnit} onInput={(e) => { const v = (e.target as HTMLInputElement).value; setCostPerUnit(v === '' ? '' : parseFloat(v)) }} class={inp} />
        </Field>
      </div>
      <button type="submit" disabled={submitting || !name.trim()} class="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-black font-bold text-sm disabled:opacity-50">
        {submitting ? 'Ekleniyor…' : '+ Hammaddeyi Kaydet'}
      </button>
    </form>
  )
}

/* ---------------- Material Row ---------------- */

function MaterialRow({ material, onUpdate, onDelete }: { material: MaterialItem; onUpdate: (m: MaterialItem) => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const [movementOpen, setMovementOpen] = useState(false)
  const [movType, setMovType] = useState<'in' | 'out' | 'adjustment'>('in')
  const [movQty, setMovQty] = useState<number>(0)
  const [movReason, setMovReason] = useState('')

  const low = material.minThreshold != null && material.quantity <= material.minThreshold

  async function submitMovement() {
    if (!movReason.trim() || movQty <= 0) return
    const res = await fetch(`/api/admin/materials/${material.id}/movement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: movType, qty: movQty, reason: movReason.trim() }),
    })
    if (res.ok) {
      const updated = await res.json()
      onUpdate(updated)
      setMovQty(0)
      setMovReason('')
      setMovementOpen(false)
    }
  }

  return (
    <div class={[
      'rounded-2xl border bg-[var(--color-surface)] overflow-hidden',
      low ? 'border-red-500/40' : 'border-[var(--color-border)]/60',
    ].join(' ')}>
      <div class="p-3 md:p-4 flex items-center gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="font-semibold text-sm">{material.name}</h3>
            {material.color && <span class="text-[11px] text-[var(--color-text-muted)]">· {material.color}</span>}
            {low && <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold uppercase">DÜŞÜK STOK</span>}
          </div>
          <p class="text-[11px] text-[var(--color-text-muted)] mt-0.5">
            {MATERIAL_CATEGORY_LABELS[material.category]}
            {material.supplier && ` · ${material.supplier}`}
            {material.costPerUnit != null && ` · ${material.costPerUnit.toFixed(2)} ₺/${MATERIAL_UNIT_LABELS[material.unit]}`}
          </p>
        </div>
        <div class="text-right">
          <div class={['text-xl font-bold tabular-nums', low ? 'text-red-400' : 'text-[var(--color-text)]'].join(' ')}>
            {material.quantity.toFixed(2)}
          </div>
          <div class="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">{MATERIAL_UNIT_LABELS[material.unit]}</div>
        </div>
        <button type="button" onClick={() => setMovementOpen(!movementOpen)} class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[var(--color-surface-2)] hover:bg-[var(--color-border)]">
          {movementOpen ? '✕' : '↕ Hareket'}
        </button>
        <button type="button" onClick={() => setOpen(!open)} class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[var(--color-surface-2)] hover:bg-[var(--color-border)]">
          {open ? '−' : '+ Detay'}
        </button>
      </div>

      {movementOpen && (
        <div class="px-4 pb-4 border-t border-[var(--color-border)]/40 pt-3 bg-[var(--color-surface-2)]/30">
          <div class="grid sm:grid-cols-4 gap-2 mb-2">
            <select value={movType} onChange={(e) => setMovType((e.target as HTMLSelectElement).value as any)} class={inp}>
              <option value="in">↗ Giriş (satın alma)</option>
              <option value="out">↘ Çıkış (üretim/satış)</option>
              <option value="adjustment">⚖ Sayım Düzeltme</option>
            </select>
            <input type="number" step="0.01" value={movQty} onInput={(e) => setMovQty(parseFloat((e.target as HTMLInputElement).value) || 0)} placeholder="Miktar" class={inp} />
            <input type="text" value={movReason} onInput={(e) => setMovReason((e.target as HTMLInputElement).value)} placeholder="Sebep (zorunlu)" class={inp} />
            <button type="button" onClick={submitMovement} disabled={!movReason.trim() || movQty <= 0} class="px-3 py-2 rounded-lg bg-[var(--color-primary)] text-black font-semibold text-xs disabled:opacity-50">
              Kaydet
            </button>
          </div>
        </div>
      )}

      {open && (
        <div class="px-4 pb-4 border-t border-[var(--color-border)]/40 pt-3 space-y-2">
          {material.movements && material.movements.length > 0 && (
            <div>
              <h4 class="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-2">Hareket Geçmişi (son 10)</h4>
              <ul class="space-y-1 text-xs">
                {material.movements.slice().reverse().slice(0, 10).map((mov) => (
                  <li class="flex items-center gap-3 p-2 rounded-lg bg-[var(--color-surface-2)]/50">
                    <span class={[
                      'size-6 grid place-items-center rounded-full text-[10px] font-bold shrink-0',
                      mov.type === 'in' ? 'bg-emerald-500/20 text-emerald-400' :
                      mov.type === 'out' ? 'bg-red-500/20 text-red-400' :
                      'bg-amber-500/20 text-amber-400',
                    ].join(' ')}>
                      {mov.type === 'in' ? '↗' : mov.type === 'out' ? '↘' : '⚖'}
                    </span>
                    <span class="flex-1">
                      <strong class="tabular-nums">{mov.type === 'adjustment' ? '= ' : mov.type === 'in' ? '+ ' : '− '}{Math.abs(mov.qty).toFixed(2)} {MATERIAL_UNIT_LABELS[material.unit]}</strong>
                      <span class="text-[var(--color-text-muted)] ml-2">{mov.reason}</span>
                    </span>
                    <span class="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap">
                      {new Date(mov.at).toLocaleDateString('tr-TR')}
                      {mov.by && ` · ${mov.by}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div class="pt-2 flex justify-end">
            <button type="button" onClick={onDelete} class="text-[11px] text-red-400 hover:text-red-300">
              🗑 Hammaddeyi sil
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const inp = 'w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm'

function Field({ label, children }: { label: string; children: any }) {
  return (
    <label class="block">
      <div class="text-xs font-medium mb-1.5 text-[var(--color-text-soft)]">{label}</div>
      {children}
    </label>
  )
}
