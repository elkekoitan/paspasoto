/**
 * CleanConfigurator — Carmat paspas configurator (tertemiz, sadeleştirilmiş).
 *
 * Kullanıcının net direktifi: sadece paspas rengi + kenarlık rengi + layout seçimi.
 * Brand/model varsa URL parametresinden gelir, gelmiyorsa sade bir mini-selector görünür.
 *
 * Akış:
 *   1. Layout (paspas seti)
 *   2. Paspas rengi
 *   3. Kenarlık rengi
 *   4. Özet + müşteri formu + gönder
 *
 * State şeması: SADECE 4 alan + iletişim. Hiç logo/heel/trim/texture/preset yok.
 */
import { useState } from 'preact/hooks'
import type { Product, MatColor, BorderColor, Brand, VehicleModel } from '../../../lib/catalog'
import { PRODUCTS, MAT_COLORS, BORDER_COLORS, BRANDS, VEHICLE_MODELS } from '../../../lib/catalog'

import LayoutStep from './LayoutStep'
import MatColorStep from './MatColorStep'
import BorderColorStep from './BorderColorStep'
import MatPreview from './MatPreview'

type Step = 'layout' | 'mat' | 'border' | 'summary'

const STEPS: { key: Step; label: string }[] = [
  { key: 'layout', label: 'Set' },
  { key: 'mat', label: 'Paspas' },
  { key: 'border', label: 'Kenarlık' },
  { key: 'summary', label: 'Özet' },
]

type Props = {
  /** URL'den gelirse: brand+model önceden seçili olur */
  initialBrandSlug?: string
  initialModelSlug?: string
}

export default function CleanConfigurator({ initialBrandSlug, initialModelSlug }: Props) {
  // ─── ARAÇ ────────────────────────────────────────────────
  const initialBrand = initialBrandSlug ? BRANDS.find((b) => b.slug === initialBrandSlug) ?? null : null
  const initialModel =
    initialBrand && initialModelSlug
      ? VEHICLE_MODELS.find((m) => m.brandSlug === initialBrand.slug && m.slug === initialModelSlug) ?? null
      : null

  const [brand, setBrand] = useState<Brand | null>(initialBrand)
  const [model, setModel] = useState<VehicleModel | null>(initialModel)

  // ─── KONFİG (sadece 3 alan) ──────────────────────────────
  const [product, setProduct] = useState<Product>(PRODUCTS[1]) // 4'lü default
  const [matColor, setMatColor] = useState<MatColor>(MAT_COLORS[0]) // siyah
  const [borderColor, setBorderColor] = useState<BorderColor>(BORDER_COLORS[13]) // füme

  // ─── WIZARD ──────────────────────────────────────────────
  const [step, setStep] = useState<Step>('layout')

  // ─── İLETİŞİM ────────────────────────────────────────────
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ orderNo: string; accessToken: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const total = product.basePrice

  async function submit(e: Event) {
    e.preventDefault()
    if (!name || !phone) {
      setError('Ad ve telefon zorunlu')
      return
    }
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { fullName: name, phone },
          shippingAddress: {
            fullName: name,
            phone,
            city: city || 'Belirtilmedi',
            district: '-',
            addressLine: '-',
          },
          items: [
            {
              category: 'mat',
              brandSlug: brand?.slug ?? 'unknown',
              brandName: brand?.name ?? 'Belirtilmedi',
              modelSlug: model?.slug ?? 'unknown',
              modelName: model?.name ?? 'Belirtilmedi',
              modelChassis: model?.chassisCode ?? '',
              productSlug: product.slug,
              productName: product.name,
              productParts: product.parts,
              matSlug: matColor.slug,
              matName: matColor.name,
              matSwatchUrl: matColor.swatchUrl,
              borderSlug: borderColor.slug,
              borderName: borderColor.name,
              borderSwatchUrl: borderColor.swatchUrl,
              // Sade akış — heel ve logo yok
              heelSlug: 'standart',
              heelName: 'Standart',
              heelSwatchUrl: '/assets/heel-pads/heel-standart.webp',
              heelPosition: 'driver-only',
              heelPadPassenger: false,
              logoBrandSlug: null,
              logoQty: 0,
              logos: [],
              qty: 1,
              unitPrice: total,
            },
          ],
          subtotal: total,
          total,
        }),
      })
      if (!res.ok) throw new Error('Sunucu hatası')
      const data = await res.json()
      setResult({ orderNo: data.orderNo, accessToken: data.accessToken })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  // ─── BAŞARI EKRANI ─────────────────────────────────────
  if (result) {
    return (
      <div class="min-h-screen bg-stone-950 text-stone-100 grid place-items-center px-4">
        <div class="max-w-md w-full text-center space-y-6">
          <div class="mx-auto size-20 rounded-full bg-amber-500/15 grid place-items-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5L20 7" stroke="#d4923a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-semibold">Talebiniz Alındı</h1>
            <p class="text-stone-400 mt-2">Atölyemiz birazdan WhatsApp'tan iletişime geçecek.</p>
          </div>
          <div class="rounded-xl bg-stone-900 ring-1 ring-stone-800 p-5 text-left space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-stone-500">Sipariş No</span>
              <span class="font-mono font-bold text-amber-400">{result.orderNo}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-stone-500">Toplam</span>
              <span class="font-semibold">{total.toLocaleString('tr-TR')}₺</span>
            </div>
          </div>
          <a
            href={`/siparis-takip/detay?o=${result.orderNo}&t=${result.accessToken}`}
            class="block w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold py-3 transition-colors"
          >
            Siparişimi Takip Et
          </a>
        </div>
      </div>
    )
  }

  // ─── ANA UI ─────────────────────────────────────────────
  return (
    <div class="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <header class="sticky top-0 z-10 bg-stone-950/85 backdrop-blur-md border-b border-stone-800">
        <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" class="flex items-center gap-2 text-amber-400 font-bold">
            <span class="text-lg tracking-tight">CARMAT</span>
            <span class="text-[10px] text-stone-500 uppercase tracking-widest">Konfigüratör</span>
          </a>
          <div class="text-right">
            <div class="text-[11px] text-stone-500 uppercase tracking-wider">Toplam</div>
            <div class="text-lg font-bold text-amber-400 tabular-nums">{total.toLocaleString('tr-TR')}₺</div>
          </div>
        </div>

        {/* Stepper */}
        <div class="max-w-6xl mx-auto px-4 pb-3">
          <div class="flex items-center gap-1.5">
            {STEPS.map((s, i) => {
              const active = s.key === step
              const done = STEPS.findIndex((x) => x.key === step) > i
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStep(s.key)}
                  class={
                    'flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ' +
                    (active
                      ? 'bg-amber-500 text-stone-950'
                      : done
                      ? 'bg-stone-800 text-amber-400'
                      : 'bg-stone-900 text-stone-500')
                  }
                >
                  {i + 1}. {s.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* İçerik */}
      <main class="max-w-6xl mx-auto px-4 py-6">
        <div class="grid lg:grid-cols-[1fr_420px] gap-8">
          {/* SOL: önizleme (mobile'da üstte) */}
          <div class="lg:order-2">
            <div class="lg:sticky lg:top-32">
              <MatPreview product={product} matColor={matColor} borderColor={borderColor} />
              {brand && model && (
                <div class="mt-3 text-center text-sm text-stone-400">
                  {brand.name} {model.name}
                  {model.chassisCode ? ` · ${model.chassisCode}` : ''}
                </div>
              )}
            </div>
          </div>

          {/* SAĞ (lg) / ALT (sm): adım içeriği */}
          <div class="lg:order-1 min-h-[420px]">
            {step === 'layout' && (
              <LayoutStep value={product} onChange={setProduct} />
            )}
            {step === 'mat' && (
              <MatColorStep value={matColor} onChange={setMatColor} />
            )}
            {step === 'border' && (
              <BorderColorStep value={borderColor} onChange={setBorderColor} />
            )}
            {step === 'summary' && (
              <SummaryStep
                product={product}
                matColor={matColor}
                borderColor={borderColor}
                brand={brand}
                model={model}
                name={name}
                phone={phone}
                city={city}
                onNameChange={setName}
                onPhoneChange={setPhone}
                onCityChange={setCity}
                onSubmit={submit}
                submitting={submitting}
                error={error}
                total={total}
              />
            )}
          </div>
        </div>

        {/* Alt nav */}
        {step !== 'summary' && (
          <div class="mt-8 flex items-center justify-between gap-3 pt-6 border-t border-stone-800">
            <button
              type="button"
              onClick={() => {
                const i = STEPS.findIndex((s) => s.key === step)
                if (i > 0) setStep(STEPS[i - 1].key)
              }}
              disabled={step === 'layout'}
              class="px-5 py-2.5 rounded-lg text-sm font-medium text-stone-300 disabled:opacity-30 hover:bg-stone-900 transition-colors"
            >
              ← Geri
            </button>
            <button
              type="button"
              onClick={() => {
                const i = STEPS.findIndex((s) => s.key === step)
                if (i < STEPS.length - 1) setStep(STEPS[i + 1].key)
              }}
              class="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-bold transition-colors"
            >
              Devam Et →
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

// ─── SUMMARY ───────────────────────────────────────────────
function SummaryStep({
  product,
  matColor,
  borderColor,
  brand,
  model,
  name,
  phone,
  city,
  onNameChange,
  onPhoneChange,
  onCityChange,
  onSubmit,
  submitting,
  error,
  total,
}: {
  product: Product
  matColor: MatColor
  borderColor: BorderColor
  brand: Brand | null
  model: VehicleModel | null
  name: string
  phone: string
  city: string
  onNameChange: (v: string) => void
  onPhoneChange: (v: string) => void
  onCityChange: (v: string) => void
  onSubmit: (e: Event) => void
  submitting: boolean
  error: string | null
  total: number
}) {
  return (
    <div class="space-y-6">
      <div class="space-y-1.5">
        <h2 class="text-2xl font-semibold tracking-tight">Özet ve İletişim</h2>
        <p class="text-sm text-stone-400">Bilgilerinizi bırakın, atölyemiz size ulaşsın</p>
      </div>

      {/* Seçim özeti */}
      <div class="rounded-xl bg-stone-900 ring-1 ring-stone-800 p-5 space-y-3 text-sm">
        {brand && model && (
          <Row label="Araç" value={`${brand.name} ${model.name}${model.chassisCode ? ` · ${model.chassisCode}` : ''}`} />
        )}
        <Row label="Set" value={`${product.name} · ${product.parts} parça`} />
        <Row label="Paspas" value={matColor.name} swatchHex={matColor.hex} />
        <Row label="Kenarlık" value={borderColor.name} swatchHex={borderColor.hex} />
        <div class="border-t border-stone-800 pt-3 flex items-center justify-between">
          <span class="text-stone-400">Toplam</span>
          <span class="text-xl font-bold text-amber-400 tabular-nums">{total.toLocaleString('tr-TR')}₺</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} class="space-y-3">
        <Field label="Adınız Soyadınız" value={name} onChange={onNameChange} required />
        <Field label="Telefon" value={phone} onChange={onPhoneChange} type="tel" required placeholder="05XX XXX XX XX" />
        <Field label="Şehir (opsiyonel)" value={city} onChange={onCityChange} />

        {error && (
          <div class="rounded-lg bg-red-500/10 ring-1 ring-red-500/30 px-3 py-2 text-sm text-red-300">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          class="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-3.5 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Gönderiliyor...' : 'Teklif İste'}
        </button>
      </form>
    </div>
  )
}

function Row({ label, value, swatchHex }: { label: string; value: string; swatchHex?: string }) {
  return (
    <div class="flex items-center justify-between gap-3">
      <span class="text-stone-500">{label}</span>
      <span class="flex items-center gap-2">
        {swatchHex && (
          <span class="size-4 rounded-full ring-1 ring-stone-700" style={{ background: swatchHex }} />
        )}
        <span class="text-stone-100 font-medium text-right">{value}</span>
      </span>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <label class="block">
      <span class="text-xs text-stone-400 mb-1.5 block">
        {label}
        {required && <span class="text-amber-400 ml-0.5">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        required={required}
        placeholder={placeholder}
        class="w-full rounded-lg bg-stone-900 ring-1 ring-stone-700 focus:ring-2 focus:ring-amber-400 focus:outline-none px-3 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 transition-all"
      />
    </label>
  )
}
