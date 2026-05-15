/**
 * ContentManager — Admin /admin/icerik için override yönetimi.
 *
 * 2 tab: 'Ürünler' + 'Konfigüratör'
 *  - Ürünler: 24 basit ürün için inline edit (görsel URL, kısa açıklama, fiyat, stok)
 *  - Konfigüratör: 4 swatch tipi (mat/border/heel/logo) — her biri için imageUrl override
 */
import { useState } from 'preact/hooks'
import type { ContentDB, ProductOverride, SwatchType, SwatchOverride } from '../../lib/content-types'
import type { SimpleProduct } from '../../lib/catalog-extra'
import { MAT_COLORS, BORDER_COLORS, HEEL_PADS, BRANDS } from '../../lib/catalog'
import { formatTRY } from '../../lib/format'

type Tab = 'products' | 'swatches'

interface Props {
  initialOverrides: ContentDB
  products: SimpleProduct[]
}

export default function ContentManager({ initialOverrides, products }: Props) {
  const [tab, setTab] = useState<Tab>('products')
  const [overrides, setOverrides] = useState<ContentDB>(initialOverrides)
  const [search, setSearch] = useState('')

  const filteredProducts = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      {/* Tabs */}
      <div class="flex gap-2 mb-6 border-b border-[var(--color-border)]/60">
        {[
          { key: 'products', label: '🛍 Basit Ürünler', count: products.length },
          { key: 'swatches', label: '🎨 Konfigüratör Asseti', count: MAT_COLORS.length + BORDER_COLORS.length + HEEL_PADS.length },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key as Tab)}
            class={[
              'px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors',
              tab === t.key
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
            ].join(' ')}
          >
            {t.label} <span class="text-[10px] opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      {tab === 'products' && (
        <div class="mb-4">
          <input
            type="search"
            value={search}
            onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
            placeholder="Ürün ara (ad veya slug)"
            class="w-full md:w-80 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm"
          />
        </div>
      )}

      {tab === 'products' && (
        <div class="space-y-3">
          {filteredProducts.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              override={overrides.products[p.id]}
              onSave={async (patch) => {
                const res = await fetch(`/api/admin/content/product/${p.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(patch),
                })
                if (res.ok) {
                  const updated = await res.json()
                  setOverrides((prev) => ({ ...prev, products: { ...prev.products, [p.id]: updated } }))
                }
                return res.ok
              }}
              onReset={async () => {
                const res = await fetch(`/api/admin/content/product/${p.id}`, { method: 'DELETE' })
                if (res.ok) {
                  setOverrides((prev) => {
                    const next = { ...prev.products }
                    delete next[p.id]
                    return { ...prev, products: next }
                  })
                }
                return res.ok
              }}
            />
          ))}
        </div>
      )}

      {tab === 'swatches' && (
        <div class="space-y-8">
          <SwatchSection
            title="Paspas Zemin Rengi (Mat)"
            type="mat"
            items={MAT_COLORS.map((c) => ({ id: String(c.id), label: c.name, current: c.swatchUrl, hex: c.hex }))}
            overrides={overrides.swatches.mat}
            onChange={(id, patch) => updateSwatch('mat', id, patch, overrides, setOverrides)}
          />
          <SwatchSection
            title="Kenarlık Rengi"
            type="border"
            items={BORDER_COLORS.map((c) => ({ id: String(c.id), label: c.name, current: c.swatchUrl, hex: c.hex }))}
            overrides={overrides.swatches.border}
            onChange={(id, patch) => updateSwatch('border', id, patch, overrides, setOverrides)}
          />
          <SwatchSection
            title="Topukluk"
            type="heel"
            items={HEEL_PADS.map((h) => ({ id: String(h.id), label: h.name, current: h.swatchUrl, hex: h.textureHex }))}
            overrides={overrides.swatches.heel}
            onChange={(id, patch) => updateSwatch('heel', id, patch, overrides, setOverrides)}
          />
          <SwatchSection
            title="Marka Logoları (Plaka/Deri Tabanlı)"
            type="logo"
            items={BRANDS.slice(0, 30).map((b) => ({ id: b.slug, label: b.name, current: `/assets/brands/${b.iconSlug ?? b.slug}.svg`, hex: b.color }))}
            overrides={overrides.swatches.logo}
            onChange={(id, patch) => updateSwatch('logo', id, patch, overrides, setOverrides)}
          />
        </div>
      )}
    </div>
  )
}

async function updateSwatch(
  type: SwatchType,
  id: string,
  patch: SwatchOverride,
  current: ContentDB,
  setOverrides: (db: ContentDB) => void,
) {
  const res = await fetch(`/api/admin/content/swatch/${type}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (res.ok) {
    const updated = await res.json()
    setOverrides({
      ...current,
      swatches: {
        ...current.swatches,
        [type]: { ...current.swatches[type], [id]: updated },
      },
    })
  }
}

/* ---------------- Product Row ---------------- */

interface ProductRowProps {
  product: SimpleProduct
  override?: ProductOverride
  onSave: (patch: ProductOverride) => Promise<boolean>
  onReset: () => Promise<boolean>
}

function ProductRow({ product, override, onSave, onReset }: ProductRowProps) {
  const [open, setOpen] = useState(false)
  const [image, setImage] = useState(override?.image ?? product.image)
  const [shortDescription, setShortDescription] = useState(override?.shortDescription ?? product.shortDescription)
  const [description, setDescription] = useState(override?.description ?? product.description)
  const [price, setPrice] = useState<number>(override?.price ?? product.price)
  const [stock, setStock] = useState<number>(override?.stock ?? product.stock)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  const isOverridden = !!override && Object.keys(override).length > 0

  async function handleSave() {
    setSaving(true)
    const ok = await onSave({ image, shortDescription, description, price, stock })
    setSaving(false)
    if (ok) {
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2000)
    }
  }

  return (
    <div class="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        class="w-full p-3 md:p-4 flex items-center gap-3 hover:bg-[var(--color-surface-2)] transition-colors text-left"
      >
        <div class="size-14 rounded-lg overflow-hidden bg-[var(--color-surface-2)] shrink-0">
          <img src={image} alt="" class="size-full object-cover" loading="lazy" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h3 class="font-semibold text-sm truncate">{product.name}</h3>
            {isOverridden && (
              <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-bold uppercase tracking-wider">
                Düzenli
              </span>
            )}
          </div>
          <p class="text-[11px] text-[var(--color-text-muted)] truncate">{product.slug} · {formatTRY(price)} · {stock} adet</p>
        </div>
        <span class="text-xs text-[var(--color-text-muted)]">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div class="p-4 md:p-5 pt-2 space-y-3 border-t border-[var(--color-border)]/40 bg-[var(--color-surface-2)]/30">
          {/* Görsel preview + URL */}
          <Field label="Ana Görsel URL (Pexels, Unsplash, kendi sunucunuz vb.)">
            <div class="flex gap-3">
              <div class="size-20 rounded-lg overflow-hidden bg-[var(--color-bg)] shrink-0 ring-1 ring-[var(--color-border)]/60">
                <img src={image} alt="" class="size-full object-cover" />
              </div>
              <input
                type="url"
                value={image}
                onInput={(e) => setImage((e.target as HTMLInputElement).value)}
                placeholder="https://images.pexels.com/photos/..."
                class={inp}
              />
            </div>
          </Field>

          <Field label="Kısa Açıklama (1-2 cümle, kart ve detay üst kısmında)">
            <textarea
              value={shortDescription}
              onInput={(e) => setShortDescription((e.target as HTMLTextAreaElement).value)}
              rows={2}
              class={`${inp} resize-none`}
            />
          </Field>

          <Field label="Tam Açıklama (Markdown — **kalın**, - liste)">
            <textarea
              value={description}
              onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
              rows={8}
              class={`${inp} resize-y font-mono text-xs`}
            />
          </Field>

          <div class="grid grid-cols-2 gap-3">
            <Field label="Fiyat (₺)">
              <input
                type="number"
                value={price}
                onInput={(e) => setPrice(parseFloat((e.target as HTMLInputElement).value) || 0)}
                class={inp}
              />
            </Field>
            <Field label="Stok (adet)">
              <input
                type="number"
                value={stock}
                onInput={(e) => setStock(parseInt((e.target as HTMLInputElement).value) || 0)}
                class={inp}
              />
            </Field>
          </div>

          <div class="flex items-center justify-between gap-3 pt-2">
            {isOverridden && (
              <button
                type="button"
                onClick={onReset}
                class="text-xs text-[var(--color-text-muted)] hover:text-red-400"
              >
                ↻ Override'ı sil (kataloğa dön)
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              class={[
                'ml-auto px-5 py-2.5 rounded-lg text-sm font-bold transition-colors',
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

/* ---------------- Swatch Section ---------------- */

interface SwatchSectionProps {
  title: string
  type: SwatchType
  items: Array<{ id: string; label: string; current: string; hex?: string }>
  overrides: Record<string, SwatchOverride>
  onChange: (id: string, patch: SwatchOverride) => Promise<void>
}

function SwatchSection({ title, type, items, overrides, onChange }: SwatchSectionProps) {
  return (
    <section>
      <h2 class="font-display text-lg font-bold mb-3">{title} <span class="text-xs font-normal text-[var(--color-text-muted)]">({items.length} adet)</span></h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((it) => (
          <SwatchCard key={it.id} item={it} override={overrides[it.id]} onChange={(p) => onChange(it.id, p)} />
        ))}
      </div>
    </section>
  )
}

function SwatchCard({ item, override, onChange }: { item: any; override?: SwatchOverride; onChange: (p: SwatchOverride) => Promise<void> }) {
  const [url, setUrl] = useState(override?.imageUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  const effective = override?.imageUrl || item.current

  async function save() {
    setSaving(true)
    await onChange({ imageUrl: url || undefined })
    setSaving(false)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1800)
  }

  return (
    <div class="rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-3">
      <div class="flex items-center gap-2.5 mb-2.5">
        <div class="size-12 rounded-lg overflow-hidden shrink-0 ring-1 ring-[var(--color-border)]/60" style={item.hex ? `background-color: ${item.hex}` : ''}>
          <img src={effective} alt="" class="size-full object-cover" onError={(e: any) => { e.currentTarget.style.opacity = '0' }} />
        </div>
        <div class="min-w-0">
          <div class="text-[13px] font-semibold truncate">{item.label}</div>
          {override?.imageUrl && (
            <div class="text-[9px] text-[var(--color-primary)] font-bold uppercase">● Override</div>
          )}
        </div>
      </div>
      <input
        type="url"
        value={url}
        onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
        placeholder="https://… (foto URL)"
        class="w-full px-2 py-1.5 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[11px]"
      />
      <button
        type="button"
        onClick={save}
        disabled={saving}
        class={[
          'mt-2 w-full px-2 py-1.5 rounded-md text-[11px] font-semibold transition-colors',
          savedFlash ? 'bg-emerald-500 text-white' : 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/30',
          saving && 'opacity-50',
        ].join(' ')}
      >
        {savedFlash ? '✓ Kaydedildi' : saving ? '...' : 'Kaydet'}
      </button>
    </div>
  )
}

/* ---------------- helpers ---------------- */

const inp = 'w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm'

function Field({ label, children }: { label: string; children: any }) {
  return (
    <label class="block">
      <div class="text-xs font-medium mb-1.5 text-[var(--color-text-soft)]">{label}</div>
      {children}
    </label>
  )
}
