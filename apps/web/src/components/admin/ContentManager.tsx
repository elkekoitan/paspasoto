/**
 * ContentManager — Admin /admin/icerik için override yönetimi.
 *
 * 2 tab: 'Ürünler' + 'Konfigüratör'
 *  - Ürünler: 24 basit ürün için inline edit (görsel URL, kısa açıklama, fiyat, stok)
 *  - Konfigüratör: 4 swatch tipi (mat/border/heel/logo) — her biri için imageUrl override
 */
import { useState } from 'preact/hooks'
import type { ContentDB, ProductOverride, SwatchType, SwatchOverride, CustomProduct } from '../../lib/content-types'
import type { SimpleProduct } from '../../lib/catalog-extra'
import { MAT_COLORS, BORDER_COLORS, HEEL_PADS, BRANDS } from '../../lib/catalog'
import { formatTRY } from '../../lib/format'
import ImageUploadField from './ImageUploadField'
import MultiImageUpload from './MultiImageUpload'

type Tab = 'site' | 'products' | 'custom' | 'swatches'
const CATEGORY_OPTIONS = [
  { value: 'screen-protector', label: 'Multimedya Ekran Koruyucu' },
  { value: 'perfume', label: 'Oto Parfüm' },
  { value: 'chemical', label: 'Oto Kimya' },
  { value: 'bag', label: 'Çanta / Organizer' },
] as const

interface Props {
  initialOverrides: ContentDB
  products: SimpleProduct[]
}

export default function ContentManager({ initialOverrides, products }: Props) {
  const [tab, setTab] = useState<Tab>('site')
  const [overrides, setOverrides] = useState<ContentDB>(initialOverrides)
  const [search, setSearch] = useState('')
  const [showAddCustom, setShowAddCustom] = useState(false)

  // Sadece statik (kod-içi) ürünleri "products" tab'de göster
  // Custom ürünler ayrı tab'de yönetilir
  const staticOnly = products.filter((p) => !p.id.toString().startsWith('cp-'))

  const filteredProducts = staticOnly.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      {/* Tabs */}
      <div class="flex gap-2 mb-6 border-b border-[var(--color-border)]/60 overflow-x-auto">
        {[
          { key: 'site', label: '🏠 Ana Sayfa', count: undefined },
          { key: 'products', label: '🛍 Hazır Ürünler', count: staticOnly.length },
          { key: 'custom', label: '➕ Eklediklerim', count: overrides.customProducts?.length ?? 0 },
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
            {t.label} {t.count !== undefined && <span class="text-[10px] opacity-60">({t.count})</span>}
          </button>
        ))}
      </div>

      {tab === 'site' && (
        <SiteTab initial={overrides.site ?? {}} onSaved={(site) => setOverrides((prev) => ({ ...prev, site }))} />
      )}

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

      {tab === 'custom' && (
        <CustomProductsTab
          customProducts={overrides.customProducts ?? []}
          showAdd={showAddCustom}
          onToggleAdd={() => setShowAddCustom(!showAddCustom)}
          onAdded={(p) => {
            setOverrides((prev) => ({ ...prev, customProducts: [...(prev.customProducts ?? []), p] }))
            setShowAddCustom(false)
          }}
          onUpdated={(p) => {
            setOverrides((prev) => ({
              ...prev,
              customProducts: (prev.customProducts ?? []).map((x) => x.id === p.id ? p : x),
            }))
          }}
          onDeleted={(id) => {
            setOverrides((prev) => ({
              ...prev,
              customProducts: (prev.customProducts ?? []).filter((x) => x.id !== id),
            }))
          }}
        />
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
  // images dizisi = [ana görsel, ...galeri]. İlk eleman product.image, kalanlar product.gallery
  const initialImages = [
    override?.image ?? product.image,
    ...((override?.gallery ?? product.gallery ?? []) as string[]),
  ].filter(Boolean)
  const [images, setImages] = useState<string[]>(initialImages)
  const [shortDescription, setShortDescription] = useState(override?.shortDescription ?? product.shortDescription)
  const [description, setDescription] = useState(override?.description ?? product.description)
  const [price, setPrice] = useState<number>(override?.price ?? product.price)
  const [stock, setStock] = useState<number>(override?.stock ?? product.stock)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  const isOverridden = !!override && Object.keys(override).length > 0

  async function handleSave() {
    setSaving(true)
    const ok = await onSave({
      image: images[0] ?? '',
      gallery: images.slice(1),
      shortDescription,
      description,
      price,
      stock,
    })
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
          {/* Ürün görselleri — max 7 */}
          <Field label="Ürün Görselleri (max 7 — ilk eleman ana görsel)">
            <MultiImageUpload
              images={images}
              max={7}
              onChange={setImages}
            />
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

/* ---------------- Site Tab (Hero) ---------------- */

function SiteTab({ initial, onSaved }: { initial: ContentDB['site']; onSaved: (s: NonNullable<ContentDB['site']>) => void }) {
  const [heroImage, setHeroImage] = useState(initial?.heroImage ?? '')
  const [heroTitle, setHeroTitle] = useState(initial?.heroTitle ?? '')
  const [heroSubtitle, setHeroSubtitle] = useState(initial?.heroSubtitle ?? '')
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  async function save() {
    setSaving(true)
    const res = await fetch('/api/admin/content/site', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        heroImage: heroImage || undefined,
        heroTitle: heroTitle || undefined,
        heroSubtitle: heroSubtitle || undefined,
      }),
    })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      onSaved(data)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1800)
    }
  }

  return (
    <div class="space-y-6 max-w-3xl">
      <section class="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-5 space-y-4">
        <div>
          <h2 class="font-display text-lg font-bold">Ana Sayfa Hero</h2>
          <p class="text-xs text-[var(--color-text-muted)] mt-0.5">Site açıldığında en üstte görünen büyük tanıtım alanı.</p>
        </div>

        <Field label="Hero Görseli (sağ kolon)">
          <ImageUploadField
            value={heroImage}
            onChange={setHeroImage}
            aspect="wide"
            previewSize={180}
            placeholder="Dosya yükleyin veya URL yapıştırın"
          />
        </Field>

        <Field label="Hero Başlık (boş bırakırsanız varsayılan kullanılır)">
          <input
            type="text"
            value={heroTitle}
            onInput={(e) => setHeroTitle((e.target as HTMLInputElement).value)}
            placeholder="Örn: Aracına özel EVA paspas. Premium kalite, atölye fiyatı."
            class={inp}
          />
        </Field>

        <Field label="Hero Alt Başlık">
          <textarea
            value={heroSubtitle}
            onInput={(e) => setHeroSubtitle((e.target as HTMLTextAreaElement).value)}
            placeholder="Markaya ve modele birebir kalıplanmış. 2-3 iş günü kapına."
            rows={2}
            class={`${inp} resize-none`}
          />
        </Field>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          class={[
            'w-full px-5 py-3 rounded-lg text-sm font-bold transition-colors',
            savedFlash ? 'bg-emerald-500 text-white' : 'bg-[var(--color-primary)] text-black hover:opacity-90',
            saving && 'opacity-50',
          ].join(' ')}
        >
          {savedFlash ? '✓ Kaydedildi (anasayfa anında yenilenir)' : saving ? 'Kaydediliyor…' : '💾 Hero\'yu Güncelle'}
        </button>
      </section>

      <p class="text-xs text-[var(--color-text-muted)] leading-relaxed">
        💡 İpucu: Burada yaptığınız değişiklik <a href="/" target="_blank" class="text-[var(--color-primary)] underline">ana sayfada</a> <strong>anında</strong> görünür (deploy beklenmez).
      </p>
    </div>
  )
}

/* ---------------- Custom Products Tab ---------------- */

interface CustomProductsTabProps {
  customProducts: CustomProduct[]
  showAdd: boolean
  onToggleAdd: () => void
  onAdded: (p: CustomProduct) => void
  onUpdated: (p: CustomProduct) => void
  onDeleted: (id: string) => void
}

function CustomProductsTab({ customProducts, showAdd, onToggleAdd, onAdded, onUpdated, onDeleted }: CustomProductsTabProps) {
  return (
    <div>
      <div class="mb-4 flex items-end justify-between gap-3 flex-wrap">
        <div class="text-sm text-[var(--color-text-soft)] max-w-2xl">
          Kod dokunmadan yeni ürün ekleyebilirsiniz. Eklenen ürünler hemen
          tüm site genelinde (ürün listeleri, carousel, kategori sayfası,
          ürün detayı) gözükür.
        </div>
        <button
          type="button"
          onClick={onToggleAdd}
          class="px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-black font-bold text-sm hover:opacity-90 whitespace-nowrap"
        >
          {showAdd ? '✕ Formu Kapat' : '+ Yeni Ürün Ekle'}
        </button>
      </div>

      {showAdd && <CustomProductForm onAdded={onAdded} />}

      {customProducts.length === 0 ? (
        <div class="text-center py-16 text-[var(--color-text-muted)] rounded-2xl border-2 border-dashed border-[var(--color-border)]/40">
          Henüz manuel eklenmiş ürün yok.<br />
          "+ Yeni Ürün Ekle" ile başlayın.
        </div>
      ) : (
        <ul class="space-y-3">
          {customProducts.map((p) => (
            <CustomProductRow
              key={p.id}
              product={p}
              onUpdate={async (patch) => {
                const res = await fetch(`/api/admin/content/custom-products/${p.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(patch),
                })
                if (res.ok) {
                  const updated = await res.json()
                  onUpdated(updated)
                  return true
                }
                return false
              }}
              onDelete={async () => {
                if (!confirm(`"${p.name}" ürününü silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz. Site genelinden hemen kalkar.`)) return
                const res = await fetch(`/api/admin/content/custom-products/${p.id}`, { method: 'DELETE' })
                if (res.ok) onDeleted(p.id)
              }}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function CustomProductForm({ onAdded }: { onAdded: (p: CustomProduct) => void }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState<CustomProduct['category']>('perfume')
  const [price, setPrice] = useState<number>(0)
  const [oldPrice, setOldPrice] = useState<number | ''>('')
  const [images, setImages] = useState<string[]>([])
  const [shortDescription, setShortDescription] = useState('')
  const [description, setDescription] = useState('')
  const [stock, setStock] = useState<number>(10)
  const [badges, setBadges] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function autoSlug(s: string) {
    return s
      .toLowerCase()
      .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
      .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50)
  }

  async function handleSubmit(e: Event) {
    e.preventDefault()
    setErr(null)
    if (!name.trim() || !category) {
      setErr('Ad ve kategori zorunlu')
      return
    }
    const finalSlug = slug.trim() || autoSlug(name)
    setSubmitting(true)
    const res = await fetch('/api/admin/content/custom-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: finalSlug,
        category,
        name: name.trim(),
        price,
        oldPrice: oldPrice === '' ? undefined : Number(oldPrice),
        image: images[0] ?? '',
        gallery: images.slice(1),
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        stock,
        badges: Array.from(badges),
        active: true,
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      const product = await res.json()
      onAdded(product)
      // Reset
      setName(''); setSlug(''); setPrice(0); setOldPrice(''); setImages([])
      setShortDescription(''); setDescription(''); setStock(10); setBadges(new Set())
    } else {
      const data = await res.json().catch(() => ({}))
      setErr(data?.error ?? 'Eklenemedi')
    }
  }

  function toggleBadge(b: string) {
    setBadges((prev) => {
      const next = new Set(prev)
      if (next.has(b)) next.delete(b)
      else next.add(b)
      return next
    })
  }

  return (
    <form onSubmit={handleSubmit} class="rounded-2xl border-2 border-dashed border-[var(--color-primary)]/40 bg-[var(--color-surface)] p-4 md:p-5 mb-5 space-y-3">
      <h3 class="font-semibold text-base">Yeni Ürün Bilgileri</h3>

      <div class="grid sm:grid-cols-2 gap-3">
        <Field label="Ürün Adı *">
          <input type="text" value={name} onInput={(e) => { setName((e.target as HTMLInputElement).value); if (!slug) setSlug(autoSlug((e.target as HTMLInputElement).value)) }} placeholder="örn: Vanilla Premium Parfüm" class={inp} required />
        </Field>
        <Field label="Kategori *">
          <select value={category} onChange={(e) => setCategory((e.target as HTMLSelectElement).value as any)} class={inp}>
            {CATEGORY_OPTIONS.map((c) => <option value={c.value}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Slug (URL anahtarı, otomatik üretilir)">
          <input type="text" value={slug} onInput={(e) => setSlug((e.target as HTMLInputElement).value)} placeholder="vanilla-premium" class={inp} />
        </Field>
        <Field label="Fiyat (₺) *">
          <input type="number" step="0.01" value={price} onInput={(e) => setPrice(parseFloat((e.target as HTMLInputElement).value) || 0)} class={inp} required />
        </Field>
        <Field label="İndirim Öncesi Fiyat (opsiyonel — gösterimde üstü çizilir)">
          <input type="number" step="0.01" value={oldPrice} onInput={(e) => { const v = (e.target as HTMLInputElement).value; setOldPrice(v === '' ? '' : parseFloat(v)) }} class={inp} />
        </Field>
        <Field label="Stok (adet) *">
          <input type="number" value={stock} onInput={(e) => setStock(parseInt((e.target as HTMLInputElement).value) || 0)} class={inp} required />
        </Field>
      </div>

      <Field label="Ürün Görselleri (max 7 — ilk eleman ana görsel)">
        <MultiImageUpload images={images} max={7} onChange={setImages} />
      </Field>

      <Field label="Kısa Açıklama (1-2 cümle, kart üzerinde)">
        <textarea value={shortDescription} onInput={(e) => setShortDescription((e.target as HTMLTextAreaElement).value)} rows={2} class={`${inp} resize-none`} />
      </Field>

      <Field label="Tam Açıklama (Markdown — **kalın**, - liste, yeni paragraf için boş satır)">
        <textarea value={description} onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)} rows={6} class={`${inp} resize-y font-mono text-xs`} />
      </Field>

      <div>
        <div class="text-xs font-medium mb-2 text-[var(--color-text-soft)]">Rozetler (opsiyonel)</div>
        <div class="flex flex-wrap gap-2">
          {[
            { v: 'new', label: '✨ Yeni' },
            { v: 'best-seller', label: '⭐ Çok Satan' },
            { v: 'discount', label: '🏷 İndirim' },
            { v: 'limited', label: 'Sınırlı' },
            { v: 'premium', label: '👑 Premium' },
          ].map((b) => (
            <button
              key={b.v}
              type="button"
              onClick={() => toggleBadge(b.v)}
              class={[
                'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                badges.has(b.v)
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-soft)] hover:text-[var(--color-text)]',
              ].join(' ')}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {err && <div class="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">{err}</div>}

      <button type="submit" disabled={submitting || !name.trim()} class="w-full px-5 py-3 rounded-lg bg-[var(--color-primary)] text-black font-bold text-sm disabled:opacity-50">
        {submitting ? 'Ekleniyor…' : '+ Ürünü Kaydet'}
      </button>
    </form>
  )
}

function CustomProductRow({ product, onUpdate, onDelete }: { product: CustomProduct; onUpdate: (patch: Partial<CustomProduct>) => Promise<boolean>; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(product.name)
  const [price, setPrice] = useState(product.price)
  const [stock, setStock] = useState(product.stock)
  const [images, setImages] = useState<string[]>([product.image, ...(product.gallery ?? [])].filter(Boolean))
  const [shortDescription, setShortDescription] = useState(product.shortDescription)
  const [description, setDescription] = useState(product.description)
  const [active, setActive] = useState(product.active)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  async function save() {
    setSaving(true)
    const ok = await onUpdate({
      name,
      price,
      stock,
      image: images[0] ?? '',
      gallery: images.slice(1),
      shortDescription,
      description,
      active,
    })
    setSaving(false)
    if (ok) {
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1800)
    }
  }

  return (
    <li class="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        class="w-full p-3 md:p-4 flex items-center gap-3 hover:bg-[var(--color-surface-2)] transition-colors text-left"
      >
        <div class="size-14 rounded-lg overflow-hidden bg-[var(--color-surface-2)] shrink-0 relative">
          {images[0] && <img src={images[0]} alt="" class="size-full object-cover" loading="lazy" />}
          {images.length > 1 && (
            <span class="absolute bottom-0.5 right-0.5 px-1 py-0 rounded text-[9px] font-bold bg-black/70 text-white">
              +{images.length - 1}
            </span>
          )}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h3 class="font-semibold text-sm truncate">{product.name}</h3>
            {!product.active && <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 font-bold uppercase">PASİF</span>}
          </div>
          <p class="text-[11px] text-[var(--color-text-muted)] truncate">
            {product.category} · {product.slug} · {formatTRY(product.price)} · {product.stock} adet
          </p>
        </div>
        <span class="text-xs text-[var(--color-text-muted)]">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div class="p-4 md:p-5 pt-2 space-y-3 border-t border-[var(--color-border)]/40 bg-[var(--color-surface-2)]/30">
          <Field label="Ürün Adı">
            <input type="text" value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} class={inp} />
          </Field>
          <Field label="Ürün Görselleri (max 7)">
            <MultiImageUpload images={images} max={7} onChange={setImages} />
          </Field>
          <Field label="Kısa Açıklama">
            <textarea value={shortDescription} onInput={(e) => setShortDescription((e.target as HTMLTextAreaElement).value)} rows={2} class={`${inp} resize-none`} />
          </Field>
          <Field label="Tam Açıklama (Markdown)">
            <textarea value={description} onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)} rows={6} class={`${inp} resize-y font-mono text-xs`} />
          </Field>
          <div class="grid grid-cols-2 gap-3">
            <Field label="Fiyat (₺)">
              <input type="number" step="0.01" value={price} onInput={(e) => setPrice(parseFloat((e.target as HTMLInputElement).value) || 0)} class={inp} />
            </Field>
            <Field label="Stok">
              <input type="number" value={stock} onInput={(e) => setStock(parseInt((e.target as HTMLInputElement).value) || 0)} class={inp} />
            </Field>
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive((e.target as HTMLInputElement).checked)} class="accent-[var(--color-primary)]" />
            <span>Site genelinde görünür (aktif)</span>
          </label>
          <div class="flex items-center justify-between gap-3 pt-2">
            <button type="button" onClick={onDelete} class="text-xs text-red-400 hover:text-red-300">
              🗑 Ürünü Tamamen Sil
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              class={[
                'px-5 py-2.5 rounded-lg text-sm font-bold transition-colors',
                savedFlash ? 'bg-emerald-500 text-white' : 'bg-[var(--color-primary)] text-black hover:opacity-90',
                saving && 'opacity-50',
              ].join(' ')}
            >
              {savedFlash ? '✓ Kaydedildi' : saving ? 'Kaydediliyor…' : '💾 Kaydet'}
            </button>
          </div>
        </div>
      )}
    </li>
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
  const [savedFlash, setSavedFlash] = useState(false)

  const effective = override?.imageUrl || item.current

  async function saveUrl(newUrl: string) {
    setUrl(newUrl)
    await onChange({ imageUrl: newUrl || undefined })
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
          {savedFlash && (
            <div class="text-[9px] text-emerald-400 font-bold uppercase">✓ Kaydedildi</div>
          )}
        </div>
      </div>
      <ImageUploadField
        value={url}
        onChange={saveUrl}
        aspect="square"
        previewSize={64}
      />
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
