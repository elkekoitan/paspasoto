import { useEffect, useMemo, useState } from 'preact/hooks'
import {
  BRANDS,
  VEHICLE_MODELS,
  MAT_COLORS,
  BORDER_COLORS,
  HEEL_PADS,
  LOGO_ACCESSORIES,
  PRODUCTS,
  type Brand,
  type VehicleModel,
  type MatColor,
  type BorderColor,
  type HeelPad,
  type LogoAccessory,
  type Product,
} from '../../lib/catalog'
import { formatTRY } from '../../lib/format'

type StepKey = 'brand' | 'model' | 'product' | 'mat' | 'border' | 'heel' | 'logo' | 'summary'
const STEPS: { key: StepKey; label: string }[] = [
  { key: 'brand', label: 'Marka' },
  { key: 'model', label: 'Model' },
  { key: 'product', label: 'Set' },
  { key: 'mat', label: 'Paspas' },
  { key: 'border', label: 'Kenarlık' },
  { key: 'heel', label: 'Topukluk' },
  { key: 'logo', label: 'Amblem' },
  { key: 'summary', label: 'Özet' },
]

export default function Configurator() {
  const [step, setStep] = useState<StepKey>('brand')
  const [brand, setBrand] = useState<Brand | null>(null)
  const [model, setModel] = useState<VehicleModel | null>(null)
  const [product, setProduct] = useState<Product | null>(PRODUCTS[1] ?? null) // 4'lü Set varsayılan
  const [matColor, setMatColor] = useState<MatColor | null>(MAT_COLORS[0] ?? null)
  const [borderColor, setBorderColor] = useState<BorderColor | null>(BORDER_COLORS[13] ?? null)
  const [heelPad, setHeelPad] = useState<HeelPad | null>(HEEL_PADS[0] ?? null)
  const [heelPadPassenger, setHeelPadPassenger] = useState(false)
  const [logoAccessory, setLogoAccessory] = useState<LogoAccessory | null>(null)
  const [search, setSearch] = useState('')

  // Marka değişince model + amblem otomatik öneri
  useEffect(() => {
    if (brand) {
      const suggested = LOGO_ACCESSORIES.find((l) => l.brandSlug === brand.slug)
      if (suggested) setLogoAccessory(suggested)
    }
  }, [brand?.slug])

  const models = useMemo(
    () => VEHICLE_MODELS.filter((m) => m.brandSlug === brand?.slug),
    [brand?.slug],
  )

  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return BRANDS
    return BRANDS.filter((b) => b.name.toLowerCase().includes(q))
  }, [search])

  const totalPrice = useMemo(() => {
    let total = product?.basePrice ?? 0
    total += heelPad?.pricePremium ?? 0
    if (heelPadPassenger) total += 100
    if (logoAccessory && logoAccessory.brandSlug !== null) {
      total += logoAccessory.price * (product?.parts ?? 0)
    }
    return total
  }, [product, heelPad, heelPadPassenger, logoAccessory])

  function next() {
    const i = STEPS.findIndex((s) => s.key === step)
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]!.key)
  }
  function prev() {
    const i = STEPS.findIndex((s) => s.key === step)
    if (i > 0) setStep(STEPS[i - 1]!.key)
  }

  const canNext =
    (step === 'brand' && !!brand) ||
    (step === 'model' && !!model) ||
    (step === 'product' && !!product) ||
    (step === 'mat' && !!matColor) ||
    (step === 'border' && !!borderColor) ||
    (step === 'heel' && !!heelPad) ||
    step === 'logo' ||
    step === 'summary'

  return (
    <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-6 lg:gap-10">
      {/* Sol: Adım içerikleri */}
      <div class="order-2 lg:order-1">
        <StepperBar step={step} onJump={(k) => setStep(k)} canJump={(k) => isStepReachable(k, { brand, model, product, matColor, borderColor, heelPad })} />

        <div class="mt-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5 md:p-7">
          {step === 'brand' && (
            <BrandStep
              brands={filteredBrands}
              selected={brand}
              onSelect={(b) => {
                setBrand(b)
                setModel(null)
                setStep('model')
              }}
              search={search}
              onSearchChange={setSearch}
            />
          )}

          {step === 'model' && brand && (
            <ModelStep
              brand={brand}
              models={models}
              selected={model}
              onSelect={(m) => {
                setModel(m)
                setStep('product')
              }}
              onBack={() => setStep('brand')}
            />
          )}

          {step === 'product' && (
            <ProductStep
              products={PRODUCTS}
              selected={product}
              onSelect={(p) => {
                setProduct(p)
                setStep('mat')
              }}
            />
          )}

          {step === 'mat' && (
            <SwatchStep
              title="Paspas Zemin Rengi"
              description="Paspasın havuzlu kısmının zemin rengi."
              colors={MAT_COLORS}
              selected={matColor?.id}
              onSelect={(c) => {
                setMatColor(c)
                setStep('border')
              }}
            />
          )}

          {step === 'border' && (
            <SwatchStep
              title="Kenarlık Rengi"
              description="Paspasın çevresini saran biye/kenarlık şeridi."
              colors={BORDER_COLORS}
              selected={borderColor?.id}
              onSelect={(c) => {
                setBorderColor(c)
                setStep('heel')
              }}
              big={false}
            />
          )}

          {step === 'heel' && (
            <HeelPadStep
              pads={HEEL_PADS}
              selected={heelPad}
              onSelect={setHeelPad}
              passenger={heelPadPassenger}
              onTogglePassenger={() => setHeelPadPassenger((v) => !v)}
              onContinue={() => setStep('logo')}
            />
          )}

          {step === 'logo' && (
            <LogoStep
              brand={brand}
              accessories={LOGO_ACCESSORIES.filter(
                (l) => l.brandSlug === brand?.slug || l.brandSlug === null,
              )}
              selected={logoAccessory}
              onSelect={setLogoAccessory}
              onContinue={() => setStep('summary')}
            />
          )}

          {step === 'summary' && (
            <SummaryStep
              brand={brand!}
              model={model!}
              product={product!}
              matColor={matColor!}
              borderColor={borderColor!}
              heelPad={heelPad!}
              heelPadPassenger={heelPadPassenger}
              logoAccessory={logoAccessory}
              total={totalPrice}
            />
          )}
        </div>

        {/* Footer nav */}
        {step !== 'summary' && (
          <div class="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={prev}
              disabled={step === 'brand'}
              class="px-4 py-2.5 rounded-lg text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-soft)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Geri
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!canNext}
              class="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Devam →
            </button>
          </div>
        )}
      </div>

      {/* Sağ: Sticky Preview */}
      <aside class="order-1 lg:order-2 lg:sticky lg:top-20 self-start">
        <Preview
          matColor={matColor}
          borderColor={borderColor}
          heelPad={heelPad}
          heelPadPassenger={heelPadPassenger}
          logoAccessory={logoAccessory}
          brand={brand}
          model={model}
          product={product}
          total={totalPrice}
          onAddToCart={() => alert('Sepete ekleme henüz aktif değil — Strapi entegrasyonu beklemede.')}
        />
      </aside>
    </div>
  )
}

function isStepReachable(
  k: StepKey,
  state: {
    brand: Brand | null
    model: VehicleModel | null
    product: Product | null
    matColor: MatColor | null
    borderColor: BorderColor | null
    heelPad: HeelPad | null
  },
) {
  if (k === 'brand') return true
  if (k === 'model') return !!state.brand
  if (k === 'product') return !!state.brand && !!state.model
  if (k === 'mat') return !!state.product
  if (k === 'border') return !!state.matColor
  if (k === 'heel') return !!state.borderColor
  if (k === 'logo') return !!state.heelPad
  if (k === 'summary') return !!state.heelPad
  return false
}

/* -------------------- StepperBar -------------------- */
function StepperBar({
  step,
  onJump,
  canJump,
}: {
  step: StepKey
  onJump: (k: StepKey) => void
  canJump: (k: StepKey) => boolean
}) {
  const currentIdx = STEPS.findIndex((s) => s.key === step)
  return (
    <div class="flex items-center gap-1 overflow-x-auto pb-2 -mx-1 px-1">
      {STEPS.map((s, i) => {
        const active = s.key === step
        const passed = i < currentIdx
        const reachable = canJump(s.key)
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => reachable && onJump(s.key)}
            disabled={!reachable}
            class={[
              'shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              active && 'bg-[var(--color-primary)] text-[var(--color-bg)]',
              !active && passed && 'bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-[var(--color-border)]',
              !active && !passed && 'bg-[var(--color-surface)] text-[var(--color-text-muted)]',
              !reachable && 'opacity-40 cursor-not-allowed',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span class="size-5 grid place-items-center rounded-full bg-[var(--color-bg)]/20 text-[10px] font-semibold">
              {i + 1}
            </span>
            <span class="hidden sm:inline">{s.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/* -------------------- Brand step -------------------- */
function BrandStep({
  brands,
  selected,
  onSelect,
  search,
  onSearchChange,
}: {
  brands: Brand[]
  selected: Brand | null
  onSelect: (b: Brand) => void
  search: string
  onSearchChange: (s: string) => void
}) {
  return (
    <div>
      <header class="mb-5">
        <h2 class="font-display text-xl font-semibold">Aracının markası</h2>
        <p class="mt-1 text-sm text-[var(--color-text-muted)]">
          Listede yoksa <a href="https://wa.me/905550000000" class="text-[var(--color-primary)] underline-offset-2 hover:underline">WhatsApp'tan</a> iletin.
        </p>
      </header>

      <input
        type="search"
        placeholder="Marka ara..."
        value={search}
        onInput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
        class="w-full mb-5 px-4 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm"
      />

      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
        {brands.map((b) => {
          const active = selected?.id === b.id
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelect(b)}
              class={[
                'aspect-[4/3] rounded-xl border transition-all flex items-center justify-center font-display font-semibold text-sm md:text-base',
                active
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-text)]'
                  : 'border-[var(--color-border)]/60 bg-[var(--color-surface-2)] text-[var(--color-text-soft)] hover:border-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              ].join(' ')}
            >
              {b.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* -------------------- Model step -------------------- */
function ModelStep({
  brand,
  models,
  selected,
  onSelect,
  onBack: _onBack,
}: {
  brand: Brand
  models: VehicleModel[]
  selected: VehicleModel | null
  onSelect: (m: VehicleModel) => void
  onBack: () => void
}) {
  return (
    <div>
      <header class="mb-5">
        <h2 class="font-display text-xl font-semibold">{brand.name} model</h2>
        <p class="mt-1 text-sm text-[var(--color-text-muted)]">
          Aracının kasa kodu ve yıl aralığını seç. Modelin yoksa bizimle iletişime geçin.
        </p>
      </header>
      {models.length === 0 ? (
        <div class="p-6 rounded-lg bg-[var(--color-surface-2)] text-sm text-[var(--color-text-muted)] text-center">
          Bu marka için henüz model verisi yüklenmemiş — gerçek katalog Strapi'den gelecek.
        </div>
      ) : (
        <div class="grid sm:grid-cols-2 gap-2.5">
          {models.map((m) => {
            const active = selected?.id === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelect(m)}
                class={[
                  'text-left p-4 rounded-xl border transition-all',
                  active
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                    : 'border-[var(--color-border)]/60 bg-[var(--color-surface-2)] hover:border-[var(--color-text-muted)]',
                ].join(' ')}
              >
                <div class="font-semibold">{m.name}</div>
                <div class="mt-1 text-xs text-[var(--color-text-muted)]">
                  {m.chassisCode} · {m.yearStart}-{m.yearEnd}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* -------------------- Product step -------------------- */
function ProductStep({
  products,
  selected,
  onSelect,
}: {
  products: Product[]
  selected: Product | null
  onSelect: (p: Product) => void
}) {
  return (
    <div>
      <header class="mb-5">
        <h2 class="font-display text-xl font-semibold">Paspas seti</h2>
        <p class="mt-1 text-sm text-[var(--color-text-muted)]">
          Aracında kaç paspas istediğine göre seç.
        </p>
      </header>
      <div class="grid sm:grid-cols-3 gap-3">
        {products.map((p) => {
          const active = selected?.id === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              class={[
                'text-left p-5 rounded-xl border transition-all',
                active
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                  : 'border-[var(--color-border)]/60 bg-[var(--color-surface-2)] hover:border-[var(--color-text-muted)]',
              ].join(' ')}
            >
              <div class="text-2xl font-display font-bold text-[var(--color-primary)]">
                {p.parts}
              </div>
              <div class="mt-1 font-semibold">{p.name}</div>
              {p.includesTrunk && (
                <div class="mt-1 text-xs text-[var(--color-text-muted)]">
                  Bagaj havuzu dahil
                </div>
              )}
              <div class="mt-3 text-sm font-semibold text-[var(--color-text)]">
                {formatTRY(p.basePrice)}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* -------------------- Generic Swatch Step -------------------- */
function SwatchStep({
  title,
  description,
  colors,
  selected,
  onSelect,
  big = true,
}: {
  title: string
  description?: string
  colors: { id: number; name: string; hex: string }[]
  selected: number | undefined
  onSelect: (c: { id: number; name: string; hex: string }) => void
  big?: boolean
}) {
  return (
    <div>
      <header class="mb-5">
        <h2 class="font-display text-xl font-semibold">{title}</h2>
        {description && <p class="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>}
      </header>
      <div class={big ? 'grid grid-cols-5 sm:grid-cols-5 gap-3' : 'grid grid-cols-6 sm:grid-cols-9 gap-2'}>
        {colors.map((c) => {
          const active = selected === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c)}
              class="group flex flex-col items-center gap-1.5"
              aria-label={c.name}
            >
              <div
                class={[
                  'aspect-square w-full rounded-lg ring-2 transition-all relative overflow-hidden',
                  active
                    ? 'ring-[var(--color-primary)] scale-105 shadow-[var(--shadow-glow)]'
                    : 'ring-[var(--color-border)] hover:ring-[var(--color-text-muted)]',
                ].join(' ')}
                style={`background: ${c.hex};`}
              >
                <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_60%)]" />
                {active && (
                  <span class="absolute inset-0 flex items-center justify-center text-white drop-shadow">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                )}
              </div>
              <span class={['text-[11px] truncate w-full text-center', active ? 'text-[var(--color-text)] font-medium' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-soft)]'].join(' ')}>
                {c.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* -------------------- Heel Pad Step -------------------- */
function HeelPadStep({
  pads,
  selected,
  onSelect,
  passenger,
  onTogglePassenger,
  onContinue,
}: {
  pads: HeelPad[]
  selected: HeelPad | null
  onSelect: (p: HeelPad) => void
  passenger: boolean
  onTogglePassenger: () => void
  onContinue: () => void
}) {
  return (
    <div>
      <header class="mb-5">
        <h2 class="font-display text-xl font-semibold">Topukluk</h2>
        <p class="mt-1 text-sm text-[var(--color-text-muted)]">
          Sürücü topuk bölgesindeki aşınmayı önler, premium görünüm katar.
        </p>
      </header>

      <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {pads.map((p) => {
          const active = selected?.id === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              class="group flex flex-col gap-1.5"
              aria-label={p.name}
            >
              <div
                class={[
                  'aspect-[4/3] w-full rounded-lg ring-2 transition-all relative overflow-hidden',
                  active
                    ? 'ring-[var(--color-primary)] scale-[1.03] shadow-[var(--shadow-glow)]'
                    : 'ring-[var(--color-border)] hover:ring-[var(--color-text-muted)]',
                ].join(' ')}
                style={`background: ${p.textureHex};`}
              >
                <div
                  class="absolute inset-0 opacity-50"
                  style="background-image: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.18) 1px, transparent 2px), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.12) 1px, transparent 2px); background-size: 8px 8px, 12px 12px;"
                />
                {p.isStandard && (
                  <span class="absolute top-1 right-1 px-1.5 py-0.5 text-[9px] rounded-full bg-[var(--color-success)]/30 text-[var(--color-success)] font-medium">
                    Standart
                  </span>
                )}
                {!p.isStandard && p.pricePremium > 0 && (
                  <span class="absolute top-1 right-1 px-1.5 py-0.5 text-[9px] rounded-full bg-[var(--color-bg)]/70 text-[var(--color-primary)] font-medium">
                    +{formatTRY(p.pricePremium)}
                  </span>
                )}
              </div>
              <span class={['text-[11px] truncate text-center w-full', active ? 'text-[var(--color-text)] font-medium' : 'text-[var(--color-text-muted)]'].join(' ')}>
                {p.name}
              </span>
            </button>
          )
        })}
      </div>

      <label class="mt-6 flex items-center gap-3 p-4 rounded-xl border border-[var(--color-border)]/60 hover:border-[var(--color-text-muted)] cursor-pointer transition-colors">
        <input
          type="checkbox"
          checked={passenger}
          onChange={onTogglePassenger}
          class="size-5 accent-[var(--color-primary)]"
        />
        <div class="flex-1">
          <div class="text-sm font-medium">Yolcu paspasına da topukluk ekle</div>
          <div class="text-xs text-[var(--color-text-muted)]">+{formatTRY(100)}</div>
        </div>
      </label>

      <button
        type="button"
        onClick={onContinue}
        disabled={!selected}
        class="mt-5 w-full px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] disabled:opacity-30 transition-colors"
      >
        Devam et →
      </button>
    </div>
  )
}

/* -------------------- Logo step -------------------- */
function LogoStep({
  brand,
  accessories,
  selected,
  onSelect,
  onContinue,
}: {
  brand: Brand | null
  accessories: LogoAccessory[]
  selected: LogoAccessory | null
  onSelect: (l: LogoAccessory | null) => void
  onContinue: () => void
}) {
  return (
    <div>
      <header class="mb-5">
        <h2 class="font-display text-xl font-semibold">Marka amblemi</h2>
        <p class="mt-1 text-sm text-[var(--color-text-muted)]">
          Paspasın üst kısmına monte edilen metal/plastik amblem. {brand && `${brand.name} amblemi otomatik önerildi.`}
        </p>
      </header>

      <div class="grid sm:grid-cols-2 gap-3">
        {accessories.map((a) => {
          const active = selected?.id === a.id
          const isDecline = a.brandSlug === null
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a)}
              class={[
                'text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-3',
                active
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                  : 'border-[var(--color-border)]/60 bg-[var(--color-surface-2)] hover:border-[var(--color-text-muted)]',
              ].join(' ')}
            >
              <div>
                <div class="font-semibold">{a.name}</div>
                <div class="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {isDecline ? 'Amblem eklenmesin' : `${formatTRY(a.price)} / parça`}
                </div>
              </div>
              <div class={['size-10 grid place-items-center rounded-lg font-display font-bold', isDecline ? 'bg-[var(--color-surface)] text-[var(--color-text-muted)]' : 'bg-[var(--color-bg)] text-[var(--color-primary)]'].join(' ')}>
                {isDecline ? '✕' : (brand?.name?.[0] ?? 'A')}
              </div>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onContinue}
        class="mt-5 w-full px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] transition-colors"
      >
        Özete git →
      </button>
    </div>
  )
}

/* -------------------- Summary step -------------------- */
function SummaryStep({
  brand,
  model,
  product,
  matColor,
  borderColor,
  heelPad,
  heelPadPassenger,
  logoAccessory,
  total,
}: {
  brand: Brand
  model: VehicleModel
  product: Product
  matColor: MatColor
  borderColor: BorderColor
  heelPad: HeelPad
  heelPadPassenger: boolean
  logoAccessory: LogoAccessory | null
  total: number
}) {
  return (
    <div>
      <header class="mb-5">
        <h2 class="font-display text-xl font-semibold">Konfigürasyon Özeti</h2>
        <p class="mt-1 text-sm text-[var(--color-text-muted)]">
          Aşağıdaki kombinasyonu sepete ekle, ardından sipariş bilgilerini gir.
        </p>
      </header>

      <dl class="space-y-3 text-sm">
        <Row label="Araç" value={`${brand.name} ${model.name} (${model.chassisCode}, ${model.yearStart}-${model.yearEnd})`} />
        <Row label="Set" value={`${product.name} · ${product.parts} parça`} />
        <Row label="Paspas zemin" value={matColor.name} swatch={matColor.hex} />
        <Row label="Kenarlık" value={borderColor.name} swatch={borderColor.hex} />
        <Row
          label="Topukluk"
          value={
            heelPad.name +
            (heelPadPassenger ? ' (sürücü + yolcu)' : ' (sadece sürücü)')
          }
          swatch={heelPad.textureHex}
        />
        <Row
          label="Amblem"
          value={
            logoAccessory && logoAccessory.brandSlug !== null
              ? `${logoAccessory.name} × ${product.parts}`
              : 'Eklenmedi'
          }
        />
      </dl>

      <div class="mt-6 pt-5 border-t border-[var(--color-border)]/60 flex items-center justify-between">
        <div>
          <div class="text-xs text-[var(--color-text-muted)]">Toplam</div>
          <div class="font-display text-3xl font-semibold text-[var(--color-text)]">
            {formatTRY(total)}
          </div>
          <div class="text-xs text-[var(--color-text-muted)] mt-0.5">KDV dahil · Kargo ayrıca</div>
        </div>
        <button
          type="button"
          class="px-6 py-3 rounded-xl text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] transition-colors"
        >
          Sepete Ekle
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, swatch }: { label: string; value: string; swatch?: string }) {
  return (
    <div class="flex items-center justify-between gap-4 p-3 rounded-lg bg-[var(--color-surface-2)]">
      <dt class="text-[var(--color-text-muted)] text-xs uppercase tracking-wider font-semibold">{label}</dt>
      <dd class="flex items-center gap-2 text-right">
        {swatch && (
          <span
            class="size-4 rounded-full ring-1 ring-[var(--color-border)]"
            style={`background: ${swatch};`}
            aria-hidden="true"
          />
        )}
        <span>{value}</span>
      </dd>
    </div>
  )
}

/* -------------------- Live Preview -------------------- */
function Preview({
  matColor,
  borderColor,
  heelPad,
  heelPadPassenger,
  logoAccessory,
  brand,
  model,
  product,
  total,
  onAddToCart,
}: {
  matColor: MatColor | null
  borderColor: BorderColor | null
  heelPad: HeelPad | null
  heelPadPassenger: boolean
  logoAccessory: LogoAccessory | null
  brand: Brand | null
  model: VehicleModel | null
  product: Product | null
  total: number
  onAddToCart: () => void
}) {
  return (
    <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 overflow-hidden">
      {/* Görsel */}
      <div
        class="relative aspect-[4/3] grid place-items-center overflow-hidden"
        style={`background: linear-gradient(135deg, ${matColor?.hex ?? '#1f1f26'} 0%, ${shade(matColor?.hex ?? '#1f1f26', -10)} 100%);`}
      >
        {/* Paspas mockup SVG */}
        <svg
          viewBox="0 0 400 280"
          class="w-[80%] drop-shadow-2xl"
          aria-label="Paspas önizleme"
        >
          <defs>
            <pattern id="dots" patternUnits="userSpaceOnUse" width="14" height="14">
              <circle cx="3" cy="3" r="2" fill={shade(matColor?.hex ?? '#1f1f26', 25)} opacity="0.7" />
              <ellipse cx="10" cy="10" rx="3" ry="1.5" fill={shade(matColor?.hex ?? '#1f1f26', 25)} opacity="0.5" />
            </pattern>
          </defs>
          {/* Kenarlık */}
          <rect
            x="10"
            y="10"
            width="380"
            height="260"
            rx="32"
            ry="32"
            fill={borderColor?.hex ?? '#0f0f12'}
          />
          {/* Zemin */}
          <rect
            x="26"
            y="26"
            width="348"
            height="228"
            rx="22"
            ry="22"
            fill={matColor?.hex ?? '#1f1f26'}
          />
          {/* Doku */}
          <rect
            x="26"
            y="26"
            width="348"
            height="228"
            rx="22"
            ry="22"
            fill="url(#dots)"
          />
          {/* Topukluk (sürücü = sol üst) */}
          {heelPad && (
            <g>
              <rect
                x="56"
                y="46"
                width="100"
                height="56"
                rx="6"
                fill={heelPad.textureHex}
                opacity="0.95"
              />
              <pattern id="heel" patternUnits="userSpaceOnUse" width="6" height="6">
                <circle cx="2" cy="2" r="0.8" fill="rgba(255,255,255,0.25)" />
              </pattern>
              <rect x="56" y="46" width="100" height="56" rx="6" fill="url(#heel)" />
            </g>
          )}
          {/* Amblem */}
          {logoAccessory && logoAccessory.brandSlug && (
            <g>
              <rect
                x="170"
                y="60"
                width="60"
                height="22"
                rx="4"
                fill="rgba(20,20,24,0.95)"
                stroke="rgba(255,255,255,0.1)"
              />
              <text
                x="200"
                y="75"
                text-anchor="middle"
                font-family="Inter, sans-serif"
                font-size="11"
                font-weight="700"
                fill="#f4ede0"
              >
                {brand?.name?.toUpperCase() ?? 'BRAND'}
              </text>
            </g>
          )}
          {/* Yolcu topukluk (sağ üst) */}
          {heelPad && heelPadPassenger && (
            <g>
              <rect
                x="244"
                y="46"
                width="100"
                height="56"
                rx="6"
                fill={heelPad.textureHex}
                opacity="0.95"
              />
              <rect x="244" y="46" width="100" height="56" rx="6" fill="url(#heel)" />
            </g>
          )}
        </svg>

        <div class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[var(--color-bg)]/70 backdrop-blur text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">
          Canlı Önizleme
        </div>
      </div>

      {/* Detay */}
      <div class="p-5">
        <div class="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">
          {brand && model ? `${brand.name} ${model.name}` : 'Aracını seç'}
        </div>
        <div class="mt-1 text-sm text-[var(--color-text)]">
          {product?.name ?? '4\'lü Set'}
        </div>

        <div class="mt-4 flex items-center justify-between">
          <div class="text-2xl font-display font-semibold text-[var(--color-text)]">
            {formatTRY(total)}
          </div>
          <button
            type="button"
            onClick={onAddToCart}
            class="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] transition-colors"
          >
            Sepete Ekle
          </button>
        </div>
      </div>
    </div>
  )
}

function shade(hex: string, percent: number): string {
  const f = parseInt(hex.slice(1), 16)
  const t = percent < 0 ? 0 : 255
  const p = Math.abs(percent) / 100
  const R = f >> 16
  const G = (f >> 8) & 0x00ff
  const B = f & 0x0000ff
  return (
    '#' +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  )
}
