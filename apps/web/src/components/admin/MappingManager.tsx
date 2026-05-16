/**
 * MappingManager — Trendyol/HB ürün eşleştirme UI.
 */
import { useState } from 'preact/hooks'

interface Mapping {
  id: string
  platform: 'trendyol' | 'hepsiburada' | 'n11' | 'shopify' | 'woocommerce'
  externalCode: string
  brandSlug: string
  brandName: string
  modelName?: string
  productSlug: '4lu-set' | '5li-set' | 'bagaj-only'
  productName: string
  productParts: number
  matSlug: string
  matName: string
  borderSlug: string
  borderName: string
  heelSlug: string
  heelName: string
  hasLogo: boolean
  defaultPrice?: number
  createdAt: number
  updatedAt: number
}

interface Brand { slug: string; name: string }
interface Color { slug: string; name: string; hex?: string }
interface Product { slug: string; name: string; parts: number }

interface Props {
  initial: Mapping[]
  brands: Brand[]
  mats: Color[]
  borders: Color[]
  heels: Array<{ slug: string; name: string }>
  products: Product[]
}

export default function MappingManager({ initial, brands, mats, borders, heels, products }: Props) {
  const [mappings, setMappings] = useState<Mapping[]>(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<string>('')

  const filtered = filter
    ? mappings.filter((m) =>
        m.externalCode.toLowerCase().includes(filter.toLowerCase()) ||
        m.brandName.toLowerCase().includes(filter.toLowerCase()),
      )
    : mappings

  async function deleteMapping(id: string) {
    if (!confirm('Bu eşleştirmeyi silmek istediğinize emin misiniz?')) return
    const res = await fetch(`/api/admin/integrations/mappings?id=${id}`, { method: 'DELETE' })
    if (res.ok) setMappings((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div>
      <div class="mb-4 flex items-end gap-3 flex-wrap">
        <input
          type="text"
          value={filter}
          onInput={(e) => setFilter((e.target as HTMLInputElement).value)}
          placeholder="Barkod / marka ara"
          class="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm"
        />
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          class="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-black font-bold text-sm"
        >
          {showAdd ? '✕ Kapat' : '+ Yeni Eşleştirme'}
        </button>
      </div>

      {showAdd && (
        <AddMappingForm
          brands={brands}
          mats={mats}
          borders={borders}
          heels={heels}
          products={products}
          onAdded={(m) => { setMappings((prev) => [...prev, m]); setShowAdd(false) }}
        />
      )}

      {filtered.length === 0 ? (
        <div class="text-center py-16 text-[var(--color-text-muted)] rounded-2xl border-2 border-dashed border-[var(--color-border)]/40">
          {filter ? 'Bu filtreye uyan eşleştirme yok.' : 'Henüz eşleştirme yok. + Yeni Eşleştirme butonuyla başlayın.'}
        </div>
      ) : (
        <ul class="space-y-2">
          {filtered.map((m) => (
            <li class="rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-3 md:p-4 flex items-center gap-3 flex-wrap">
              <div class="shrink-0">
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 uppercase font-bold tracking-wider">
                  {m.platform}
                </span>
              </div>
              <div class="font-mono text-xs px-2 py-1 rounded bg-[var(--color-surface-2)] text-[var(--color-primary)]">
                {m.externalCode}
              </div>
              <div class="text-[var(--color-text-muted)] text-xs">→</div>
              <div class="flex-1 text-sm">
                <strong>{m.brandName}</strong> · {m.productName} · {m.matName} mat, {m.borderName} kenarlık
                {m.hasLogo && <span class="text-[10px] ml-1 text-[var(--color-primary)]">⭐ Logo</span>}
                {m.defaultPrice && <span class="text-[10px] ml-2 text-emerald-400">₺{m.defaultPrice}</span>}
              </div>
              <button
                type="button"
                onClick={() => deleteMapping(m.id)}
                class="px-2.5 py-1.5 rounded text-[11px] text-red-400 hover:bg-red-500/10"
              >
                🗑 Sil
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AddMappingForm({ brands, mats, borders, heels, products, onAdded }: any) {
  const [platform, setPlatform] = useState('trendyol')
  const [externalCode, setExternalCode] = useState('')
  const [brandSlug, setBrandSlug] = useState(brands[1]?.slug ?? 'bmw')
  const [modelName, setModelName] = useState('')
  const [productSlug, setProductSlug] = useState('4lu-set')
  const [matSlug, setMatSlug] = useState(mats[0]?.slug ?? 'siyah')
  const [borderSlug, setBorderSlug] = useState(borders[13]?.slug ?? 'siyah')
  const [heelSlug, setHeelSlug] = useState(heels[0]?.slug ?? 'standart')
  const [hasLogo, setHasLogo] = useState(false)
  const [defaultPrice, setDefaultPrice] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit() {
    if (!externalCode.trim()) { setErr('Barkod/SKU zorunlu'); return }
    const brand = brands.find((b: Brand) => b.slug === brandSlug)
    const mat = mats.find((c: Color) => c.slug === matSlug)
    const border = borders.find((c: Color) => c.slug === borderSlug)
    const heel = heels.find((h: { slug: string; name: string }) => h.slug === heelSlug)
    const product = products.find((p: Product) => p.slug === productSlug)
    if (!brand || !mat || !border || !heel || !product) {
      setErr('Eksik seçim'); return
    }
    setSubmitting(true)
    setErr(null)
    const res = await fetch('/api/admin/integrations/mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform,
        externalCode: externalCode.trim(),
        brandSlug,
        brandName: brand.name,
        modelName: modelName || undefined,
        productSlug,
        productName: product.name,
        productParts: product.parts,
        matSlug,
        matName: mat.name,
        borderSlug,
        borderName: border.name,
        heelSlug,
        heelName: heel.name,
        hasLogo,
        logoBrandSlug: hasLogo ? brandSlug : undefined,
        defaultPrice: defaultPrice === '' ? undefined : Number(defaultPrice),
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      const m = await res.json()
      onAdded(m)
      setExternalCode(''); setModelName(''); setDefaultPrice('')
    } else {
      const data = await res.json().catch(() => ({}))
      setErr(data?.error ?? 'Eklenemedi')
    }
  }

  return (
    <div class="mb-5 rounded-2xl border-2 border-dashed border-[var(--color-primary)]/40 bg-[var(--color-surface)] p-4 space-y-3">
      <h3 class="font-semibold">Yeni Eşleştirme</h3>
      <div class="grid sm:grid-cols-3 gap-3">
        <Field label="Marketplace">
          <select value={platform} onChange={(e) => setPlatform((e.target as HTMLSelectElement).value)} class={inp}>
            <option value="trendyol">Trendyol</option>
            <option value="hepsiburada">Hepsiburada</option>
            <option value="n11">n11</option>
            <option value="shopify">Shopify</option>
            <option value="woocommerce">WooCommerce</option>
          </select>
        </Field>
        <Field label="Barkod / SKU *" class="sm:col-span-2">
          <input
            type="text"
            value={externalCode}
            onInput={(e) => setExternalCode((e.target as HTMLInputElement).value)}
            placeholder="Marketplace'teki ürün kodunu yapıştırın"
            class={`${inp} font-mono`}
          />
        </Field>
        <Field label="Marka">
          <select value={brandSlug} onChange={(e) => setBrandSlug((e.target as HTMLSelectElement).value)} class={inp}>
            {brands.map((b: Brand) => <option value={b.slug}>{b.name}</option>)}
          </select>
        </Field>
        <Field label="Model (opsiyonel)">
          <input type="text" value={modelName} onInput={(e) => setModelName((e.target as HTMLInputElement).value)} placeholder="3 Serisi" class={inp} />
        </Field>
        <Field label="Set Tipi">
          <select value={productSlug} onChange={(e) => setProductSlug((e.target as HTMLSelectElement).value)} class={inp}>
            {products.map((p: Product) => <option value={p.slug}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Mat Rengi">
          <select value={matSlug} onChange={(e) => setMatSlug((e.target as HTMLSelectElement).value)} class={inp}>
            {mats.map((c: Color) => <option value={c.slug}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Kenarlık Rengi">
          <select value={borderSlug} onChange={(e) => setBorderSlug((e.target as HTMLSelectElement).value)} class={inp}>
            {borders.map((c: Color) => <option value={c.slug}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Topukluk">
          <select value={heelSlug} onChange={(e) => setHeelSlug((e.target as HTMLSelectElement).value)} class={inp}>
            {heels.map((h: { slug: string; name: string }) => <option value={h.slug}>{h.name}</option>)}
          </select>
        </Field>
        <Field label="Logo Var mı?">
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hasLogo} onChange={(e) => setHasLogo((e.target as HTMLInputElement).checked)} class="size-4 accent-[var(--color-primary)]" />
            <span>Marka logosu işlenecek</span>
          </label>
        </Field>
        <Field label="Varsayılan Fiyat (₺)">
          <input type="number" value={defaultPrice} onInput={(e) => { const v = (e.target as HTMLInputElement).value; setDefaultPrice(v === '' ? '' : Number(v)) }} placeholder="opsiyonel" class={inp} />
        </Field>
      </div>
      {err && <div class="text-xs text-red-400">{err}</div>}
      <button
        type="button"
        onClick={submit}
        disabled={submitting || !externalCode.trim()}
        class="w-full px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-black font-bold text-sm disabled:opacity-50"
      >
        {submitting ? 'Ekleniyor…' : '+ Eşleştirmeyi Kaydet'}
      </button>
    </div>
  )
}

const inp = 'w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm'

function Field({ label, class: cls, children }: { label: string; class?: string; children: any }) {
  return (
    <label class={cls ?? ''}>
      <div class="text-xs font-medium mb-1.5 text-[var(--color-text-soft)]">{label}</div>
      {children}
    </label>
  )
}
