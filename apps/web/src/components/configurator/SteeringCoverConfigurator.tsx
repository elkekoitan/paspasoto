/**
 * Direksiyon Kılıfı Configurator — kompakt single-page form.
 * Akış: Boyut → Desen → Malzeme → Müşteri bilgileri → POST /api/quote
 */
import { useEffect, useState } from 'preact/hooks'
import {
  STEERING_SIZES,
  STEERING_PATTERNS,
  STEERING_MATERIALS,
  computeSteeringPrice,
  type SteeringSize,
  type SteeringPattern,
  type SteeringMaterial,
} from '../../lib/catalog-steering'
import { formatTRY } from '../../lib/format'
import SteeringPreview from './preview/SteeringPreview'

const STATE_KEY = 'carmat-steering-draft-v1'

type Draft = {
  sizeSlug?: 'S' | 'M' | 'L'
  patternSlug?: string
  materialSlug?: string
}

const TR_CITIES = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Konya', 'Adana', 'Gaziantep',
  'Kayseri', 'Mersin', 'Eskişehir', 'Diyarbakır', 'Samsun', 'Trabzon', 'Sakarya',
  'Manisa', 'Şanlıurfa', 'Denizli', 'Hatay', 'Balıkesir', 'Diğer',
]

function loadDraft(): Draft {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(STATE_KEY) || '{}') } catch { return {} }
}

export default function SteeringCoverConfigurator() {
  const draft = loadDraft()

  const [size, setSize] = useState<SteeringSize>(
    draft.sizeSlug ? STEERING_SIZES.find((s) => s.slug === draft.sizeSlug) ?? STEERING_SIZES[1]! : STEERING_SIZES[1]!,
  )
  const [pattern, setPattern] = useState<SteeringPattern>(
    draft.patternSlug ? STEERING_PATTERNS.find((p) => p.slug === draft.patternSlug) ?? STEERING_PATTERNS[0]! : STEERING_PATTERNS[0]!,
  )
  const [material, setMaterial] = useState<SteeringMaterial>(
    draft.materialSlug ? STEERING_MATERIALS.find((m) => m.slug === draft.materialSlug) ?? STEERING_MATERIALS[0]! : STEERING_MATERIALS[0]!,
  )

  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactCity, setContactCity] = useState('')
  const [contactDistrict, setContactDistrict] = useState('')
  const [contactAddress, setContactAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ orderNo: string } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const next: Draft = { sizeSlug: size.slug, patternSlug: pattern.slug, materialSlug: material.slug }
    try { localStorage.setItem(STATE_KEY, JSON.stringify(next)) } catch {}
  }, [size, pattern, material])

  const totalPrice = computeSteeringPrice(size.slug, pattern.slug, material.slug)

  async function submit(e: Event) {
    e.preventDefault()
    if (!contactName.trim() || !contactPhone.trim() || !contactCity.trim() || !contactDistrict.trim() || !contactAddress.trim()) {
      setError('Lütfen tüm bilgilerinizi doldurun')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const item = {
        category: 'steering-cover' as const,
        // Mat-compat placeholder (admin/track UI ortak)
        brandSlug: 'universal', brandName: 'Universal',
        modelSlug: 'universal', modelName: 'Direksiyon', modelChassis: '',
        productSlug: `steering-${size.slug.toLowerCase()}`, productName: `Direksiyon Kılıfı ${size.name}`, productParts: 1,
        matSlug: 'siyah', matName: 'Siyah', matSwatchUrl: '/assets/swatches/mat-siyah.webp',
        borderSlug: 'siyah', borderName: 'Siyah', borderSwatchUrl: '/assets/swatches/border-siyah.webp',
        heelSlug: 'standart', heelName: 'Standart', heelSwatchUrl: '/assets/heel-pads/heel-standart.webp',
        heelPadPassenger: false, logoBrandSlug: null, logoQty: 0,
        // Steering-specific
        steeringSize: size.slug,
        steeringPatternSlug: pattern.slug,
        steeringMaterialSlug: material.slug,
        qty: 1, unitPrice: totalPrice,
      }
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { fullName: contactName.trim(), phone: contactPhone.trim() },
          shippingAddress: {
            fullName: contactName.trim(),
            phone: contactPhone.trim(),
            city: contactCity.trim(),
            district: contactDistrict.trim(),
            addressLine: contactAddress.trim(),
          },
          items: [item],
          subtotal: totalPrice,
          total: totalPrice,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setResult(data)
        try { localStorage.removeItem(STATE_KEY) } catch {}
      } else {
        setError('Talebiniz iletilemedi. Tekrar deneyin.')
      }
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div class="max-w-md mx-auto text-center p-8 rounded-2xl bg-[var(--color-surface)] border border-emerald-500/30">
        <div class="size-16 rounded-full bg-emerald-500/15 grid place-items-center mx-auto">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <h2 class="mt-4 font-display text-xl font-semibold">Talebiniz alındı!</h2>
        <p class="mt-2 text-sm text-[var(--color-text-soft)]">
          Atölyemiz size <span class="text-[var(--color-primary)] font-semibold">WhatsApp'tan teklifi</span> iletecek.
        </p>
        <p class="mt-4 text-xs text-[var(--color-text-muted)]">
          Talep No: <span class="font-mono text-[var(--color-text)] font-semibold">{result.orderNo}</span>
        </p>
        <a href="/" class="mt-5 inline-block px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)]">Anasayfaya dön</a>
      </div>
    )
  }

  return (
    <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-6 lg:gap-10">
      <div class="space-y-6">
        {/* 1. Boyut */}
        <Section number="1" title="Direksiyon Boyutu" subtitle="Aracınızın direksiyon çapı">
          <div class="grid grid-cols-3 gap-2">
            {STEERING_SIZES.map((s) => {
              const active = size.slug === s.slug
              return (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => setSize(s)}
                  class={[
                    'p-3 rounded-xl border text-center transition-all',
                    active
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-[var(--shadow-glow)]'
                      : 'border-[var(--color-border)]/60 bg-[var(--color-surface-2)] hover:border-[var(--color-text-muted)]',
                  ].join(' ')}
                >
                  <div class="text-2xl font-display font-bold text-[var(--color-primary)]">{s.slug}</div>
                  <div class="text-[10px] text-[var(--color-text-muted)] mt-1">{s.diameterCm}</div>
                  <div class="text-[10px] text-[var(--color-text-soft)] mt-2 leading-snug">{s.description}</div>
                  <div class="mt-2 text-xs font-semibold tabular-nums">{formatTRY(s.basePrice)}</div>
                </button>
              )
            })}
          </div>
          <p class="mt-2 text-[10px] text-[var(--color-text-muted)]">
            Direksiyon çapını ölçmek için: bir uçtan diğer uca düz cetvel.
          </p>
        </Section>

        {/* 2. Desen */}
        <Section number="2" title="Desen" subtitle="Yüzey deseni / dikiş tipi">
          <div class="grid sm:grid-cols-2 gap-2">
            {STEERING_PATTERNS.map((p) => {
              const active = pattern.slug === p.slug
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => setPattern(p)}
                  class={[
                    'p-3 rounded-xl border text-left transition-all',
                    active
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                      : 'border-[var(--color-border)]/60 bg-[var(--color-surface-2)] hover:border-[var(--color-text-muted)]',
                  ].join(' ')}
                >
                  <div class="flex items-baseline justify-between">
                    <span class="font-semibold text-sm">{p.name}</span>
                    {p.pricePremium > 0 && (
                      <span class="text-[10px] text-[var(--color-primary)]">+{formatTRY(p.pricePremium)}</span>
                    )}
                  </div>
                  <div class="text-[10px] text-[var(--color-text-muted)] mt-0.5 leading-snug">{p.description}</div>
                </button>
              )
            })}
          </div>
        </Section>

        {/* 3. Malzeme */}
        <Section number="3" title="Malzeme" subtitle="Kavrama hissi">
          <div class="grid sm:grid-cols-2 gap-2">
            {STEERING_MATERIALS.map((m) => {
              const active = material.slug === m.slug
              return (
                <button
                  key={m.slug}
                  type="button"
                  onClick={() => setMaterial(m)}
                  class={[
                    'p-3 rounded-xl border text-left transition-all flex items-start gap-3',
                    active
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                      : 'border-[var(--color-border)]/60 bg-[var(--color-surface-2)] hover:border-[var(--color-text-muted)]',
                  ].join(' ')}
                >
                  <div class="size-10 rounded-md shrink-0" style={`background-color: ${m.textureHex};`}></div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline justify-between">
                      <span class="font-semibold text-sm">{m.name}</span>
                      {m.pricePremium !== 0 && (
                        <span class={['text-[10px] tabular-nums', m.pricePremium > 0 ? 'text-[var(--color-primary)]' : 'text-emerald-400'].join(' ')}>
                          {m.pricePremium > 0 ? '+' : ''}{formatTRY(m.pricePremium)}
                        </span>
                      )}
                    </div>
                    <div class="text-[10px] text-[var(--color-text-muted)] mt-0.5 leading-snug">{m.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </Section>

        {/* 4. Müşteri */}
        <Section number="4" title="İletişim & Adres" subtitle="Net teklif için bilgileriniz">
          <div class="grid grid-cols-2 gap-2.5">
            <input value={contactName} onInput={(e) => setContactName((e.target as HTMLInputElement).value)} placeholder="Ad Soyad *" required class="col-span-2 px-3 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm" />
            <input type="tel" value={contactPhone} onInput={(e) => setContactPhone((e.target as HTMLInputElement).value)} placeholder="0532 123 45 67 *" required class="col-span-2 px-3 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm font-mono" />
            <select value={contactCity} onChange={(e) => setContactCity((e.target as HTMLSelectElement).value)} required class="px-3 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm">
              <option value="">İl *</option>
              {TR_CITIES.map((c) => <option value={c}>{c}</option>)}
            </select>
            <input value={contactDistrict} onInput={(e) => setContactDistrict((e.target as HTMLInputElement).value)} placeholder="İlçe *" required class="px-3 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm" />
            <textarea value={contactAddress} onInput={(e) => setContactAddress((e.target as HTMLTextAreaElement).value)} placeholder="Açık adres *" rows={2} required class="col-span-2 px-3 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm resize-none"></textarea>
          </div>
        </Section>
      </div>

      <aside class="lg:sticky lg:top-6 self-start">
        <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
          <h3 class="font-display text-base font-semibold mb-3">Sipariş Özeti</h3>

          {/* SVG Live Preview (P1-C) — 3-spoke direksiyon + materyal/desen overlay */}
          <div class="mb-4">
            <SteeringPreview size={size} pattern={pattern} material={material} />
          </div>

          <dl class="space-y-2 text-xs">
            <Row label="Boyut" value={`${size.name} (${size.diameterCm})`} />
            <Row label="Desen" value={pattern.name} />
            <Row label="Malzeme" value={material.name} />
          </dl>

          <div class="mt-4 pt-4 border-t border-[var(--color-border)]/60 flex items-end justify-between">
            <div>
              <div class="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] font-semibold">Tahmini</div>
              <div class="font-display text-2xl font-semibold tabular-nums text-[var(--color-primary)] mt-1">{formatTRY(totalPrice)}</div>
            </div>
          </div>

          {error && <p class="mt-3 text-xs text-[var(--color-danger)]">{error}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            class="mt-4 w-full px-5 py-3 rounded-xl text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] transition-all disabled:opacity-50"
          >
            {submitting ? 'Gönderiliyor...' : 'Teklif İste'}
          </button>
          <p class="mt-2 text-[10px] text-[var(--color-text-muted)] text-center leading-snug">
            Atölyemiz size WhatsApp'tan net fiyatı gönderir.
          </p>
        </div>
      </aside>
    </div>
  )
}

function Section({ number, title, subtitle, children }: { number: string; title: string; subtitle: string; children: any }) {
  return (
    <section class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
      <header class="mb-4 flex items-center gap-3">
        <span class="size-8 grid place-items-center rounded-full bg-[var(--color-primary)] text-[var(--color-bg)] text-xs font-bold">{number}</span>
        <div>
          <h2 class="font-display font-semibold">{title}</h2>
          <p class="text-[11px] text-[var(--color-text-muted)]">{subtitle}</p>
        </div>
      </header>
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div class="flex justify-between gap-2">
      <dt class="text-[var(--color-text-muted)]">{label}</dt>
      <dd class="text-right text-[var(--color-text)] truncate max-w-[60%]">{value}</dd>
    </div>
  )
}
