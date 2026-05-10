/**
 * Koltuk Kılıfı Configurator — kompakt single-page form.
 *
 * Akış: Set → Malzeme → Renk → Müşteri bilgileri → POST /api/quote
 * (Paspas configurator'ın 7-adımlı kompleks akışı yerine basit lineer form.)
 */
import { useEffect, useMemo, useState } from 'preact/hooks'
import {
  SEAT_SETS,
  SEAT_MATERIALS,
  SEAT_COLORS,
  computeSeatPrice,
  type SeatSet,
  type SeatMaterial,
  type SeatColor,
} from '../../lib/catalog-seat'
import { BRANDS, VEHICLE_MODELS, type Brand, type VehicleModel } from '../../lib/catalog'
import { formatTRY } from '../../lib/format'
import ClientBrandLogo from '../ui/ClientBrandLogo'
import SeatPreview from './preview/SeatPreview'

const STATE_KEY = 'carmat-seat-draft-v1'

type Draft = {
  brandSlug?: string | null
  modelSlug?: string | null
  setSlug?: string
  materialSlug?: string
  colorSlug?: string
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

export default function SeatCoverConfigurator() {
  const draft = loadDraft()

  const [brand, setBrand] = useState<Brand | null>(
    draft.brandSlug ? BRANDS.find((b) => b.slug === draft.brandSlug) ?? null : null,
  )
  const [model, setModel] = useState<VehicleModel | null>(
    draft.modelSlug && draft.brandSlug
      ? VEHICLE_MODELS.find((m) => m.brandSlug === draft.brandSlug && m.slug === draft.modelSlug) ?? null
      : null,
  )
  const [seatSet, setSeatSet] = useState<SeatSet>(
    draft.setSlug ? SEAT_SETS.find((s) => s.slug === draft.setSlug) ?? SEAT_SETS[2]! : SEAT_SETS[2]!,
  )
  const [material, setMaterial] = useState<SeatMaterial>(
    draft.materialSlug ? SEAT_MATERIALS.find((m) => m.slug === draft.materialSlug) ?? SEAT_MATERIALS[0]! : SEAT_MATERIALS[0]!,
  )
  const [color, setColor] = useState<SeatColor>(
    draft.colorSlug ? SEAT_COLORS.find((c) => c.slug === draft.colorSlug) ?? SEAT_COLORS[0]! : SEAT_COLORS[0]!,
  )
  const [search, setSearch] = useState('')

  // Customer fields (mini form)
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
    const next: Draft = {
      brandSlug: brand?.slug ?? null,
      modelSlug: model?.slug ?? null,
      setSlug: seatSet.slug,
      materialSlug: material.slug,
      colorSlug: color.slug,
    }
    try { localStorage.setItem(STATE_KEY, JSON.stringify(next)) } catch {}
  }, [brand, model, seatSet, material, color])

  const models = useMemo(
    () => VEHICLE_MODELS.filter((m) => m.brandSlug === brand?.slug),
    [brand?.slug],
  )
  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? BRANDS.filter((b) => b.name.toLowerCase().includes(q)) : BRANDS
  }, [search])

  const totalPrice = computeSeatPrice(seatSet.slug, material.slug)

  async function submit(e: Event) {
    e.preventDefault()
    if (!brand || !model) {
      setError('Lütfen marka ve model seçin')
      return
    }
    if (!contactName.trim() || !contactPhone.trim() || !contactCity.trim() || !contactDistrict.trim() || !contactAddress.trim()) {
      setError('Lütfen tüm bilgilerinizi doldurun')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const item = {
        category: 'seat-cover' as const,
        brandSlug: brand.slug, brandName: brand.name,
        modelSlug: model.slug, modelName: model.name, modelChassis: model.chassisCode,
        productSlug: seatSet.slug, productName: seatSet.name, productParts: seatSet.parts,
        // Mat-specific (placeholder for compat)
        matSlug: 'siyah', matName: 'Siyah', matSwatchUrl: '/assets/swatches/mat-siyah.webp',
        borderSlug: 'siyah', borderName: 'Siyah', borderSwatchUrl: '/assets/swatches/border-siyah.webp',
        heelSlug: 'standart', heelName: 'Standart', heelSwatchUrl: '/assets/heel-pads/heel-standart.webp',
        heelPadPassenger: false, logoBrandSlug: null, logoQty: 0,
        // Seat-specific
        seatMaterialSlug: material.slug,
        seatColorSlug: color.slug,
        seatFitmentBrand: seatSet.fitments === 'tailored' ? brand.slug : undefined,
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
          Atölyemiz konfigürasyonunuzu inceleyip <span class="text-[var(--color-primary)] font-semibold">WhatsApp'tan teklifi gönderecek</span>.
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
        {/* 1. Marka */}
        <Section number="1" title="Marka" subtitle="Aracınızın markasını seçin">
          <input
            type="search"
            placeholder="Marka ara..."
            value={search}
            onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
            class="w-full mb-3 px-4 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm"
          />
          <div class="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-[260px] overflow-y-auto">
            {filteredBrands.map((b) => {
              const active = brand?.slug === b.slug
              return (
                <button
                  key={b.slug}
                  type="button"
                  onClick={() => { setBrand(b); setModel(null) }}
                  class={[
                    'aspect-[5/4] rounded-lg border flex flex-col items-center justify-center gap-1 px-1 py-1.5 transition-all',
                    active
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] -translate-y-0.5 shadow-[var(--shadow-glow)]'
                      : 'border-[var(--color-border)]/60 bg-[var(--color-surface-2)] hover:border-[var(--color-text-muted)]',
                  ].join(' ')}
                >
                  <ClientBrandLogo iconSlug={b.iconSlug} name={b.name} size={28} color={b.color} />
                  <span class="text-[10px] truncate w-full text-center">{b.name}</span>
                </button>
              )
            })}
          </div>
        </Section>

        {/* 2. Model */}
        {brand && (
          <Section number="2" title="Model" subtitle={`${brand.name} model seçin`}>
            <select
              value={model?.slug ?? ''}
              onChange={(e) => setModel(models.find((m) => m.slug === (e.target as HTMLSelectElement).value) ?? null)}
              class="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm"
            >
              <option value="">Seçin...</option>
              {models.map((m) => <option value={m.slug}>{m.name} {m.chassisCode} ({m.yearStart}-{m.yearEnd})</option>)}
            </select>
          </Section>
        )}

        {/* 3. Set */}
        <Section number="3" title="Koltuk Seti" subtitle="Kaç parça istiyorsunuz?">
          <div class="grid sm:grid-cols-2 gap-2">
            {SEAT_SETS.map((s) => {
              const active = seatSet.slug === s.slug
              return (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => setSeatSet(s)}
                  class={[
                    'p-3 rounded-xl border text-left transition-all',
                    active
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                      : 'border-[var(--color-border)]/60 bg-[var(--color-surface-2)] hover:border-[var(--color-text-muted)]',
                  ].join(' ')}
                >
                  <div class="flex items-baseline justify-between">
                    <span class="font-semibold text-sm">{s.name}</span>
                    <span class="text-xs text-[var(--color-primary)] tabular-nums">{formatTRY(s.basePrice)}</span>
                  </div>
                  <div class="text-[10px] text-[var(--color-text-muted)] mt-0.5">{s.description}</div>
                  {s.fitments === 'tailored' && (
                    <span class="mt-1.5 inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-black">ARAÇ ÖZEL</span>
                  )}
                </button>
              )
            })}
          </div>
        </Section>

        {/* 4. Malzeme */}
        <Section number="4" title="Malzeme" subtitle="Kumaş tipi">
          <div class="grid sm:grid-cols-2 gap-2">
            {SEAT_MATERIALS.map((m) => {
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
                        <span class="text-[10px] text-[var(--color-primary)] tabular-nums">
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

        {/* 5. Renk */}
        <Section number="5" title="Renk" subtitle="Koltuk kılıfı rengi">
          <div class="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {SEAT_COLORS.map((c) => {
              const active = color.slug === c.slug
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setColor(c)}
                  title={c.name}
                  class={[
                    'group relative aspect-square rounded-lg ring-2 transition-all overflow-hidden',
                    active ? 'ring-[var(--color-primary)] scale-105' : 'ring-[var(--color-border)] hover:ring-[var(--color-text-muted)]',
                  ].join(' ')}
                >
                  <div class="size-full" style={`background-color: ${c.hex};`}></div>
                  {active && (
                    <span class="absolute inset-0 flex items-center justify-center bg-black/35">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div class="mt-2 text-[10px] text-[var(--color-text-muted)]">Seçili: <span class="text-[var(--color-text-soft)]">{color.name}</span></div>
        </Section>

        {/* 6. Müşteri */}
        <Section number="6" title="İletişim & Adres" subtitle="Net teklif için bilgileriniz">
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

      {/* Right sidebar — özet */}
      <aside class="lg:sticky lg:top-6 self-start">
        <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
          <h3 class="font-display text-base font-semibold mb-3">Sipariş Özeti</h3>

          {/* SVG Live Preview — Tesla/Audi configurator pattern (P1-B) */}
          <div class="mb-4">
            <SeatPreview set={seatSet} material={material} color={color} brand={brand} />
          </div>

          <dl class="space-y-2 text-xs">
            <Row label="Araç" value={brand && model ? `${brand.name} ${model.name} ${model.chassisCode}` : 'Seçin'} />
            <Row label="Set" value={`${seatSet.name} (${seatSet.parts} parça)`} />
            <Row label="Malzeme" value={material.name} />
            <Row label="Renk" value={color.name} />
            <Row label="Kalıp" value={seatSet.fitments === 'tailored' ? 'Araca özel ölçü' : 'Üniversal'} />
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
