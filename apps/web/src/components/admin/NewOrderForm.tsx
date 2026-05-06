import { useMemo, useState } from 'preact/hooks'
import {
  BRANDS,
  VEHICLE_MODELS,
  MAT_COLORS,
  BORDER_COLORS,
  HEEL_PADS,
  LOGO_ACCESSORIES,
  PRODUCTS,
} from '../../lib/catalog'
import { formatTRY } from '../../lib/format'

const CITIES = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Konya', 'Adana', 'Gaziantep',
  'Kayseri', 'Mersin', 'Eskişehir', 'Diyarbakır', 'Samsun', 'Trabzon', 'Sakarya',
  'Manisa', 'Şanlıurfa', 'Denizli', 'Hatay', 'Balıkesir',
]

export default function NewOrderForm() {
  // Müşteri
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('Konya')
  const [district, setDistrict] = useState('')
  const [addressLine, setAddressLine] = useState('')

  // Konfigürasyon
  const [brandSlug, setBrandSlug] = useState(BRANDS[1].slug) // BMW default
  const [modelSlug, setModelSlug] = useState('')
  const [productSlug, setProductSlug] = useState(PRODUCTS[1].slug)
  const [matSlug, setMatSlug] = useState(MAT_COLORS[0].slug)
  const [borderSlug, setBorderSlug] = useState(BORDER_COLORS[13].slug)
  const [heelSlug, setHeelSlug] = useState(HEEL_PADS[0].slug)
  const [heelPassenger, setHeelPassenger] = useState(false)
  const [logoEnabled, setLogoEnabled] = useState(true)
  const [qty, setQty] = useState(1)

  // Sipariş
  const [paymentMethod, setPaymentMethod] = useState<'havale' | 'kapida' | 'nakit'>('havale')
  const [paymentStatus, setPaymentStatus] = useState<'bekliyor' | 'tamamlandi' | 'kismi'>('bekliyor')
  const [paidAmount, setPaidAmount] = useState(0)
  const [customerNote, setCustomerNote] = useState('')
  const [internalNote, setInternalNote] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const brand = BRANDS.find((b) => b.slug === brandSlug)!
  const models = useMemo(() => VEHICLE_MODELS.filter((m) => m.brandSlug === brandSlug), [brandSlug])
  const model = models.find((m) => m.slug === modelSlug) ?? models[0]
  const product = PRODUCTS.find((p) => p.slug === productSlug)!
  const matColor = MAT_COLORS.find((c) => c.slug === matSlug)!
  const borderColor = BORDER_COLORS.find((c) => c.slug === borderSlug)!
  const heelPad = HEEL_PADS.find((h) => h.slug === heelSlug)!
  const logoAccessory = logoEnabled
    ? LOGO_ACCESSORIES.find((l) => l.brandSlug === brandSlug) ?? null
    : null

  const unitPrice = useMemo(() => {
    let total = product.basePrice
    total += heelPad.pricePremium
    if (heelPassenger) total += 100
    if (logoAccessory) total += logoAccessory.price * product.parts
    return total
  }, [product, heelPad, heelPassenger, logoAccessory])

  const total = unitPrice * qty

  async function submit(e: Event) {
    e.preventDefault()
    if (!model) {
      setError('Lütfen bir model seçin')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const item = {
        brandSlug: brand.slug,
        brandName: brand.name,
        modelSlug: model.slug,
        modelName: model.name,
        modelChassis: model.chassisCode,
        productSlug: product.slug,
        productName: product.name,
        productParts: product.parts,
        matSlug: matColor.slug,
        matName: matColor.name,
        matSwatchUrl: matColor.swatchUrl,
        borderSlug: borderColor.slug,
        borderName: borderColor.name,
        borderSwatchUrl: borderColor.swatchUrl,
        heelSlug: heelPad.slug,
        heelName: heelPad.name,
        heelSwatchUrl: heelPad.swatchUrl,
        heelPadPassenger: heelPassenger,
        logoBrandSlug: logoAccessory?.brandSlug ?? null,
        logoQty: logoAccessory ? product.parts : 0,
        qty,
        unitPrice,
      }
      const body = {
        customer: { fullName, phone, email },
        shippingAddress: { fullName, phone, city, district, addressLine },
        items: [item],
        subtotal: total,
        shipping: 0,
        total,
        paidAmount,
        paymentMethod,
        paymentStatus,
        productionStatus: paymentStatus === 'tamamlandi' ? 'payment_confirmed' : 'received',
        customerNote: customerNote || undefined,
        internalNote: internalNote || undefined,
      }
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      const order = await res.json()
      window.location.href = `/admin/orders/${order.orderNo}`
    } catch (e: any) {
      setError(e.message ?? 'Bir hata oluştu')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-6">
      <div class="space-y-6">
        <Section title="Müşteri Bilgileri">
          <div class="grid sm:grid-cols-2 gap-3">
            <Field label="Ad Soyad" required>
              <input value={fullName} onInput={(e) => setFullName((e.target as HTMLInputElement).value)} required class={inp} />
            </Field>
            <Field label="GSM" required>
              <input value={phone} onInput={(e) => setPhone((e.target as HTMLInputElement).value)} required placeholder="0532 123 45 67" class={inp} />
            </Field>
            <Field label="E-posta" class="sm:col-span-2">
              <input value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} type="email" class={inp} />
            </Field>
          </div>
        </Section>

        <Section title="Teslimat Adresi">
          <div class="grid sm:grid-cols-2 gap-3">
            <Field label="İl" required>
              <select value={city} onChange={(e) => setCity((e.target as HTMLSelectElement).value)} required class={inp}>
                {CITIES.map((c) => (
                  <option value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="İlçe" required>
              <input value={district} onInput={(e) => setDistrict((e.target as HTMLInputElement).value)} required class={inp} />
            </Field>
            <Field label="Açık Adres" required class="sm:col-span-2">
              <textarea value={addressLine} onInput={(e) => setAddressLine((e.target as HTMLTextAreaElement).value)} required rows={2} class={`${inp} resize-none`}></textarea>
            </Field>
          </div>
        </Section>

        <Section title="Paspas Konfigürasyonu">
          <div class="grid sm:grid-cols-2 gap-3">
            <Field label="Marka" required>
              <select value={brandSlug} onChange={(e) => { setBrandSlug((e.target as HTMLSelectElement).value); setModelSlug('') }} required class={inp}>
                {BRANDS.map((b) => <option value={b.slug}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="Model" required>
              <select value={modelSlug} onChange={(e) => setModelSlug((e.target as HTMLSelectElement).value)} required class={inp}>
                <option value="">Seçin...</option>
                {models.map((m) => (
                  <option value={m.slug}>{m.name} {m.chassisCode} ({m.yearStart}-{m.yearEnd})</option>
                ))}
              </select>
            </Field>
            <Field label="Set Tipi" required>
              <select value={productSlug} onChange={(e) => setProductSlug((e.target as HTMLSelectElement).value)} required class={inp}>
                {PRODUCTS.map((p) => <option value={p.slug}>{p.name} ({p.parts} parça)</option>)}
              </select>
            </Field>
            <Field label="Adet" required>
              <input type="number" min="1" value={qty} onInput={(e) => setQty(parseInt((e.target as HTMLInputElement).value) || 1)} required class={inp} />
            </Field>
            <Field label="Paspas Zemini">
              <select value={matSlug} onChange={(e) => setMatSlug((e.target as HTMLSelectElement).value)} class={inp}>
                {MAT_COLORS.map((c) => <option value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Kenarlık">
              <select value={borderSlug} onChange={(e) => setBorderSlug((e.target as HTMLSelectElement).value)} class={inp}>
                {BORDER_COLORS.map((c) => <option value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Topukluk">
              <select value={heelSlug} onChange={(e) => setHeelSlug((e.target as HTMLSelectElement).value)} class={inp}>
                {HEEL_PADS.map((h) => <option value={h.slug}>{h.name}{h.pricePremium > 0 ? ` (+${h.pricePremium}₺)` : ''}</option>)}
              </select>
            </Field>
            <div class="flex items-end gap-3">
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={heelPassenger} onChange={(e) => setHeelPassenger((e.target as HTMLInputElement).checked)} class="size-4 accent-[var(--color-primary)]" />
                Yolcu topukluk +100₺
              </label>
            </div>
            <label class="flex items-center gap-2 text-sm cursor-pointer sm:col-span-2 p-3 rounded-lg bg-[var(--color-surface-2)]">
              <input type="checkbox" checked={logoEnabled} onChange={(e) => setLogoEnabled((e.target as HTMLInputElement).checked)} class="size-4 accent-[var(--color-primary)]" />
              {brand.name} amblemi paspasa eklensin (+{formatTRY(150)} × {product.parts})
            </label>
          </div>
        </Section>

        <Section title="Ödeme & Notlar">
          <div class="grid sm:grid-cols-2 gap-3">
            <Field label="Ödeme Yöntemi">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod((e.target as HTMLSelectElement).value as any)} class={inp}>
                <option value="havale">Banka Havalesi / EFT</option>
                <option value="kapida">Kapıda Ödeme</option>
                <option value="nakit">Nakit</option>
              </select>
            </Field>
            <Field label="Ödeme Durumu">
              <select value={paymentStatus} onChange={(e) => setPaymentStatus((e.target as HTMLSelectElement).value as any)} class={inp}>
                <option value="bekliyor">Beklemede</option>
                <option value="kismi">Kısmi</option>
                <option value="tamamlandi">Tamamlandı</option>
              </select>
            </Field>
            <Field label="Tahsil Edilen Tutar (₺)">
              <input type="number" min="0" value={paidAmount} onInput={(e) => setPaidAmount(parseFloat((e.target as HTMLInputElement).value) || 0)} class={inp} />
            </Field>
            <div></div>
            <Field label="Müşteri Notu" class="sm:col-span-2">
              <textarea value={customerNote} onInput={(e) => setCustomerNote((e.target as HTMLTextAreaElement).value)} rows={2} class={`${inp} resize-none`}></textarea>
            </Field>
            <Field label="Atölye İç Notu (müşteri görmez)" class="sm:col-span-2">
              <textarea value={internalNote} onInput={(e) => setInternalNote((e.target as HTMLTextAreaElement).value)} rows={2} class={`${inp} resize-none`}></textarea>
            </Field>
          </div>
        </Section>
      </div>

      <aside class="lg:sticky lg:top-6 self-start">
        <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
          <h3 class="font-display text-base font-semibold mb-4">Sipariş Özeti</h3>

          <div class="rounded-xl overflow-hidden ring-1 ring-[var(--color-border)] aspect-[4/3] relative mb-4">
            <img src={borderColor.swatchUrl} alt="" class="absolute inset-0 size-full object-cover" />
            <div class="absolute inset-[12%] rounded-md overflow-hidden">
              <img src={matColor.swatchUrl} alt="" class="size-full object-cover" />
            </div>
          </div>

          <dl class="space-y-2 text-xs">
            <Row label="Araç" value={model ? `${brand.name} ${model.name} ${model.chassisCode}` : '—'} />
            <Row label="Set" value={`${product.name} · ${product.parts} parça`} />
            <Row label="Zemin" value={matColor.name} />
            <Row label="Kenarlık" value={borderColor.name} />
            <Row label="Topukluk" value={heelPad.name + (heelPassenger ? ' (+yolcu)' : '')} />
            <Row label="Amblem" value={logoAccessory ? `${brand.name} × ${product.parts}` : 'Yok'} />
          </dl>

          <div class="mt-4 pt-4 border-t border-[var(--color-border)]/60 space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-[var(--color-text-muted)]">Birim</span>
              <span class="tabular-nums">{formatTRY(unitPrice)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[var(--color-text-muted)]">Adet</span>
              <span class="tabular-nums">{qty}</span>
            </div>
            <div class="flex justify-between pt-2 border-t border-[var(--color-border)]/60 text-base font-semibold">
              <span>Toplam</span>
              <span class="text-[var(--color-primary)] tabular-nums">{formatTRY(total)}</span>
            </div>
          </div>

          {error && <p class="mt-3 text-xs text-[var(--color-danger)]">{error}</p>}

          <button
            type="submit"
            onClick={submit}
            disabled={submitting}
            class="mt-5 w-full px-5 py-3 rounded-xl text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] transition-all disabled:opacity-50"
          >
            {submitting ? 'Kaydediliyor...' : 'Siparişi Oluştur'}
          </button>
        </div>
      </aside>
    </form>
  )
}

const inp =
  'w-full px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm'

function Section({ title, children }: { title: string; children: any }) {
  return (
    <section class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
      <h2 class="font-display text-base font-semibold mb-4">{title}</h2>
      {children}
    </section>
  )
}

function Field({
  label,
  required,
  class: cls,
  children,
}: { label: string; required?: boolean; class?: string; children: any }) {
  return (
    <label class={cls ?? ''}>
      <div class="text-xs font-medium mb-1 text-[var(--color-text-soft)]">
        {label} {required && <span class="text-[var(--color-danger)]">*</span>}
      </div>
      {children}
    </label>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div class="flex justify-between gap-2">
      <dt class="text-[var(--color-text-muted)]">{label}</dt>
      <dd class="text-right text-[var(--color-text)]">{value}</dd>
    </div>
  )
}
