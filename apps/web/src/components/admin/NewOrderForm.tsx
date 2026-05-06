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
import ClientBrandLogo from '../ui/ClientBrandLogo'

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
  const [paymentMethod, setPaymentMethod] = useState<
    'elden-nakit' | 'elden-kart' | 'havale' | 'kapida' | 'sonra' | 'taksit'
  >('elden-nakit')
  const [paymentStatus, setPaymentStatus] = useState<'bekliyor' | 'tamamlandi' | 'kismi'>('bekliyor')
  const [paidAmount, setPaidAmount] = useState(0)
  const [customerNote, setCustomerNote] = useState('')
  const [internalNote, setInternalNote] = useState('')

  // Taksit planı (paymentMethod === 'taksit' ise)
  type Installment = { dueAt: string; amount: number; method: string; status: string }
  const [installments, setInstallments] = useState<Installment[]>([])
  function addInstallment() {
    const remaining = Math.max(0, total - installments.reduce((s, i) => s + (i.amount || 0), 0))
    const today = new Date()
    today.setMonth(today.getMonth() + installments.length + 1)
    setInstallments((arr) => [
      ...arr,
      {
        dueAt: today.toISOString().slice(0, 10),
        amount: Math.round(remaining / 2) || 0,
        method: 'havale',
        status: 'planlandi',
      },
    ])
  }
  function updateInstallment(idx: number, patch: Partial<Installment>) {
    setInstallments((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }
  function removeInstallment(idx: number) {
    setInstallments((arr) => arr.filter((_, i) => i !== idx))
  }

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Atölye fiyatlama — admin manuel override edebilir, indirim verebilir
  const [unitPriceOverride, setUnitPriceOverride] = useState<number | null>(null)
  const [discount, setDiscount] = useState(0)
  const [priceNote, setPriceNote] = useState('')

  // Teslimat: kargo / dükkandan teslim
  const [deliveryMethod, setDeliveryMethod] = useState<'cargo' | 'pickup'>('cargo')

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

  // Hesaplanan (rehber) birim fiyat
  const computedUnitPrice = useMemo(() => {
    let v = product.basePrice
    v += heelPad.pricePremium
    if (heelPassenger) v += 100
    if (logoAccessory) v += logoAccessory.price * product.parts
    return v
  }, [product, heelPad, heelPassenger, logoAccessory])

  // Manuel override varsa onu kullan, yoksa hesaplananı
  const unitPrice = unitPriceOverride ?? computedUnitPrice
  const subtotal = unitPrice * qty
  const total = Math.max(0, subtotal - discount)

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
      const finalInternalNote = [internalNote, priceNote && `[Fiyat notu] ${priceNote}`]
        .filter(Boolean)
        .join('\n') || undefined
      const body = {
        customer: { fullName, phone, email },
        shippingAddress: { fullName, phone, city, district, addressLine },
        items: [item],
        subtotal,
        shipping: 0,
        discount,
        total,
        paidAmount,
        paymentMethod,
        paymentStatus,
        paymentInstallments:
          paymentMethod === 'taksit' && installments.length
            ? installments.map((i, idx) => ({
                id: `${Date.now()}-${idx}`,
                dueAt: new Date(i.dueAt).getTime(),
                amount: Number(i.amount) || 0,
                method: i.method,
                status: i.status,
              }))
            : undefined,
        productionStatus: paymentStatus === 'tamamlandi' ? 'payment_confirmed' : 'received',
        deliveryMethod,
        customerNote: customerNote || undefined,
        internalNote: finalInternalNote,
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

        <Section title="Araç Seçimi">
          {/* Marka grid — logoyla */}
          <div class="mb-4">
            <div class="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-2">Marka</div>
            <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-1.5 max-h-[260px] overflow-y-auto pr-1">
              {BRANDS.map((b) => {
                const active = brandSlug === b.slug
                return (
                  <button
                    key={b.slug}
                    type="button"
                    onClick={() => { setBrandSlug(b.slug); setModelSlug('') }}
                    class={[
                      'aspect-[5/4] rounded-lg border flex flex-col items-center justify-center gap-1 px-1 py-1.5 transition-all',
                      active
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-[var(--shadow-glow)] -translate-y-0.5'
                        : 'border-[var(--color-border)]/60 bg-[var(--color-surface-2)] hover:border-[var(--color-text-muted)]',
                    ].join(' ')}
                    title={b.name}
                  >
                    <ClientBrandLogo iconSlug={b.iconSlug} name={b.name} size={26} color={b.color} />
                    <span class={['text-[10px] truncate w-full text-center leading-none', active ? 'text-[var(--color-text)] font-semibold' : 'text-[var(--color-text-soft)]'].join(' ')}>
                      {b.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Model + Set + Adet */}
          <div class="grid sm:grid-cols-3 gap-3">
            <Field label="Model (şasi · yıl)" required class="sm:col-span-2">
              <select value={modelSlug} onChange={(e) => setModelSlug((e.target as HTMLSelectElement).value)} required class={inp}>
                <option value="">Seçin...</option>
                {models.map((m) => (
                  <option value={m.slug}>{m.name} {m.chassisCode} ({m.yearStart}-{m.yearEnd})</option>
                ))}
              </select>
            </Field>
            <Field label="Adet" required>
              <input type="number" min="1" value={qty} onInput={(e) => setQty(parseInt((e.target as HTMLInputElement).value) || 1)} required class={inp} />
            </Field>
          </div>

          {/* Set tipi seçimi — kart */}
          <div class="mt-4">
            <div class="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-2">Set Tipi</div>
            <div class="grid sm:grid-cols-3 gap-2">
              {PRODUCTS.map((p) => {
                const active = productSlug === p.slug
                return (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => setProductSlug(p.slug)}
                    class={[
                      'p-3 rounded-lg border text-left transition-all',
                      active
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                        : 'border-[var(--color-border)]/60 bg-[var(--color-surface-2)] hover:border-[var(--color-text-muted)]',
                    ].join(' ')}
                  >
                    <div class="flex items-baseline justify-between">
                      <span class="font-semibold text-sm">{p.name}</span>
                      <span class="text-xs text-[var(--color-primary)] tabular-nums">{formatTRY(p.basePrice)}</span>
                    </div>
                    <div class="text-[10px] text-[var(--color-text-muted)] mt-0.5">{p.parts} parça {p.includesTrunk ? '· bagaj dahil' : ''}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </Section>

        <Section title="Renk & Aksesuar">
          {/* Mat Zemin — swatch grid */}
          <div class="mb-4">
            <div class="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-2">Paspas Zemini</div>
            <div class="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {MAT_COLORS.map((c) => {
                const active = matSlug === c.slug
                return (
                  <button key={c.slug} type="button" onClick={() => setMatSlug(c.slug)} title={c.name}
                    class={['group relative aspect-square rounded-lg overflow-hidden ring-2 transition-all',
                      active ? 'ring-[var(--color-primary)] scale-105' : 'ring-[var(--color-border)] hover:ring-[var(--color-text-muted)]'].join(' ')}>
                    <img src={c.swatchUrl} alt={c.name} class="size-full object-cover" loading="lazy" />
                    {active && (
                      <span class="absolute inset-0 flex items-center justify-center bg-black/35">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div class="text-[10px] text-[var(--color-text-muted)] mt-1.5">Seçili: <span class="text-[var(--color-text-soft)]">{matColor.name}</span></div>
          </div>

          {/* Border swatch grid */}
          <div class="mb-4">
            <div class="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-2">Kenarlık</div>
            <div class="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 gap-1.5">
              {BORDER_COLORS.map((c) => {
                const active = borderSlug === c.slug
                return (
                  <button key={c.slug} type="button" onClick={() => setBorderSlug(c.slug)} title={c.name}
                    class={['group relative aspect-square rounded-lg overflow-hidden ring-2 transition-all',
                      active ? 'ring-[var(--color-primary)] scale-105' : 'ring-[var(--color-border)] hover:ring-[var(--color-text-muted)]'].join(' ')}>
                    <img src={c.swatchUrl} alt={c.name} class="size-full object-cover" loading="lazy" />
                    {active && (
                      <span class="absolute inset-0 flex items-center justify-center bg-black/35">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div class="text-[10px] text-[var(--color-text-muted)] mt-1.5">Seçili: <span class="text-[var(--color-text-soft)]">{borderColor.name}</span></div>
          </div>

          {/* Heel pad swatch */}
          <div class="mb-4">
            <div class="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-2">Topukluk</div>
            <div class="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {HEEL_PADS.map((h) => {
                const active = heelSlug === h.slug
                return (
                  <button key={h.slug} type="button" onClick={() => setHeelSlug(h.slug)} title={h.name}
                    class={['relative aspect-square rounded-lg overflow-hidden ring-2 transition-all',
                      active ? 'ring-[var(--color-primary)] scale-105' : 'ring-[var(--color-border)] hover:ring-[var(--color-text-muted)]'].join(' ')}>
                    <img src={h.swatchUrl} alt={h.name} class="size-full object-cover" />
                    {h.pricePremium > 0 && (
                      <span class="absolute top-0.5 right-0.5 px-1 py-0.5 text-[8px] rounded bg-black/70 text-white font-semibold leading-none">
                        +{h.pricePremium}
                      </span>
                    )}
                    {active && (
                      <span class="absolute inset-0 flex items-center justify-center bg-black/35">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div class="text-[10px] text-[var(--color-text-muted)] mt-1.5">Seçili: <span class="text-[var(--color-text-soft)]">{heelPad.name}{heelPad.pricePremium > 0 ? ` (+${formatTRY(heelPad.pricePremium)})` : ''}</span></div>
          </div>

          <div class="grid sm:grid-cols-2 gap-3">
            <label class="flex items-center gap-2 text-sm cursor-pointer p-3 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-2)]/70 transition-colors">
              <input type="checkbox" checked={heelPassenger} onChange={(e) => setHeelPassenger((e.target as HTMLInputElement).checked)} class="size-4 accent-[var(--color-primary)]" />
              Yolcu topukluğu da olsun <span class="text-[var(--color-primary)] ml-auto">+{formatTRY(100)}</span>
            </label>
            <label class="flex items-center gap-2 text-sm cursor-pointer p-3 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-2)]/70 transition-colors">
              <input type="checkbox" checked={logoEnabled} onChange={(e) => setLogoEnabled((e.target as HTMLInputElement).checked)} class="size-4 accent-[var(--color-primary)]" />
              {brand.name} amblemi <span class="text-[var(--color-primary)] ml-auto">+{formatTRY(150)} × {product.parts}</span>
            </label>
          </div>
        </Section>

        <Section title="Teslimat Yöntemi">
          <div class="grid grid-cols-2 gap-3">
            {([
              { v: 'cargo', label: 'Kargo ile Gönder', icon: '📦', desc: 'Aras / Yurtiçi / MNG / PTT — kargo şirketiyle teslimat' },
              { v: 'pickup', label: 'Dükkandan Teslim', icon: '🏪', desc: 'Müşteri atölyeye gelip teslim alacak' },
            ] as const).map((opt) => {
              const active = deliveryMethod === opt.v
              return (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setDeliveryMethod(opt.v)}
                  class={[
                    'p-4 rounded-xl border text-left transition-all',
                    active
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-[var(--shadow-glow)]'
                      : 'border-[var(--color-border)]/60 bg-[var(--color-surface-2)] hover:border-[var(--color-text-muted)] hover:-translate-y-0.5',
                  ].join(' ')}
                >
                  <div class="flex items-start gap-3">
                    <span class="text-3xl leading-none">{opt.icon}</span>
                    <div class="flex-1">
                      <div class="font-semibold text-sm">{opt.label}</div>
                      <div class="text-[11px] text-[var(--color-text-muted)] mt-0.5 leading-snug">{opt.desc}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </Section>

        <Section title="Atölye Fiyatlama">
          <div class="grid sm:grid-cols-3 gap-3">
            <Field label="Hesaplanan Birim (rehber)">
              <input
                type="text"
                value={formatTRY(computedUnitPrice)}
                disabled
                class={`${inp} opacity-60 cursor-not-allowed`}
              />
            </Field>
            <Field label="Verilen Birim Fiyat (₺)">
              <input
                type="number"
                min="0"
                placeholder={String(computedUnitPrice)}
                value={unitPriceOverride ?? ''}
                onInput={(e) => {
                  const v = (e.target as HTMLInputElement).value
                  setUnitPriceOverride(v === '' ? null : parseFloat(v) || 0)
                }}
                class={inp}
              />
            </Field>
            <Field label="İndirim (₺)">
              <input
                type="number"
                min="0"
                value={discount}
                onInput={(e) => setDiscount(parseFloat((e.target as HTMLInputElement).value) || 0)}
                class={inp}
              />
            </Field>
            <Field label="Fiyat Notu (atölye içi — niye bu fiyat verildi?)" class="sm:col-span-3">
              <input
                type="text"
                value={priceNote}
                onInput={(e) => setPriceNote((e.target as HTMLInputElement).value)}
                placeholder="Eski müşteri 200₺ indirim · Tanıdık aracılığıyla geldi · Bu sezon kampanya..."
                class={inp}
              />
            </Field>
          </div>
          <div class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <Stat label="Birim" value={formatTRY(unitPrice)} />
            <Stat label="Adet" value={`× ${qty}`} />
            <Stat label="İndirim" value={discount > 0 ? `−${formatTRY(discount)}` : '—'} accent={discount > 0 ? 'warn' : 'mute'} />
            <Stat label="Toplam Tahsil Edilecek" value={formatTRY(total)} accent="primary" />
          </div>
        </Section>

        <Section title="Ödeme & Notlar">
          <div class="grid sm:grid-cols-2 gap-3">
            <Field label="Ödeme Yöntemi">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod((e.target as HTMLSelectElement).value as any)} class={inp}>
                <option value="elden-nakit">Elden — Nakit</option>
                <option value="elden-kart">Elden — Kredi Kartı (POS)</option>
                <option value="havale">Banka Havalesi / EFT</option>
                <option value="kapida">Kapıda Ödeme</option>
                <option value="sonra">Sonra Ödenecek</option>
                <option value="taksit">Parçalı / Taksit</option>
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
            {paymentMethod === 'taksit' && (
              <div class="sm:col-span-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]/60 p-3.5">
                <div class="flex items-center justify-between mb-3">
                  <div>
                    <h4 class="text-sm font-semibold">Taksit Planı</h4>
                    <p class="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                      Toplam {formatTRY(total)} · Planlanan: {formatTRY(installments.reduce((s, i) => s + (Number(i.amount) || 0), 0))}
                    </p>
                  </div>
                  <button type="button" onClick={addInstallment} class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-primary)] text-[var(--color-bg)] hover:bg-[var(--color-primary-hover)]">
                    + Taksit Ekle
                  </button>
                </div>
                {installments.length === 0 ? (
                  <p class="text-xs text-[var(--color-text-muted)] py-3 text-center">Henüz taksit eklenmedi.</p>
                ) : (
                  <div class="space-y-2">
                    {installments.map((it, idx) => (
                      <div key={idx} class="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center text-xs">
                        <input type="date" value={it.dueAt} onInput={(e) => updateInstallment(idx, { dueAt: (e.target as HTMLInputElement).value })} class={inp} />
                        <input type="number" min="0" value={it.amount} onInput={(e) => updateInstallment(idx, { amount: parseFloat((e.target as HTMLInputElement).value) || 0 })} class={inp} placeholder="Tutar" />
                        <select value={it.method} onChange={(e) => updateInstallment(idx, { method: (e.target as HTMLSelectElement).value })} class={inp}>
                          <option value="elden-nakit">Nakit</option>
                          <option value="elden-kart">POS</option>
                          <option value="havale">Havale</option>
                        </select>
                        <button type="button" onClick={() => removeInstallment(idx)} class="px-2 py-1.5 rounded-lg text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10" title="Sil">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
          <h3 class="font-display text-base font-semibold mb-3 flex items-center justify-between">
            Canlı Önizleme
            <span class="text-[10px] uppercase tracking-wider text-[var(--color-success)] font-medium flex items-center gap-1">
              <span class="size-1.5 rounded-full bg-[var(--color-success)] animate-pulse"></span>
              Anlık
            </span>
          </h3>

          {/* Araç içi paspas yerleşimi — top-down preview */}
          <div class="rounded-xl overflow-hidden ring-1 ring-[var(--color-border)] relative mb-4 aspect-[3/4]"
               style="background: radial-gradient(ellipse 80% 60% at 50% 30%, #1a1a22, #0b0b0f 85%);">
            {/* Araç gövdesi */}
            <svg viewBox="0 0 400 540" class="absolute inset-x-1 top-1 bottom-1 mx-auto h-[calc(100%-8px)]">
              <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#26262e" />
                  <stop offset="100%" stop-color="#1a1a22" />
                </linearGradient>
              </defs>
              <ellipse cx="200" cy="510" rx="170" ry="14" fill="rgba(0,0,0,0.55)" filter="blur(8px)" />
              <path d="M 110 30 C 110 18, 130 8, 200 8 C 270 8, 290 18, 290 30 L 305 100 L 320 200 L 325 320 L 320 440 L 305 500 C 280 520, 120 520, 95 500 L 80 440 L 75 320 L 80 200 L 95 100 Z"
                    fill="url(#bg)" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
              <path d="M 130 100 L 270 100 L 285 175 L 115 175 Z" fill="rgba(80,140,200,0.1)" stroke="rgba(255,255,255,0.05)" />
              <path d="M 130 360 L 270 360 L 275 430 L 125 430 Z" fill="rgba(80,140,200,0.08)" stroke="rgba(255,255,255,0.05)" />
              <rect x="120" y="440" width="160" height="55" rx="4" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.05)" />
              <rect x="68" y="120" width="14" height="40" rx="3" fill="#0a0a0d" />
              <rect x="318" y="120" width="14" height="40" rx="3" fill="#0a0a0d" />
              <rect x="68" y="380" width="14" height="40" rx="3" fill="#0a0a0d" />
              <rect x="318" y="380" width="14" height="40" rx="3" fill="#0a0a0d" />
              <rect x="146" y="195" width="48" height="50" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" />
              <rect x="206" y="195" width="48" height="50" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" />
              <rect x="146" y="305" width="108" height="38" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" />
            </svg>

            {/* Paspas slot'ları */}
            <div class="absolute inset-x-1 top-1 bottom-1 mx-auto pointer-events-none" style="aspect-ratio: 400/540;">
              <PreviewMat x="14.5%" y="42%" w="22%" h="11%" mat={matColor} border={borderColor} heel={heelPad} logoBrand={logoEnabled ? brand : null} label="SÜRÜCÜ" />
              <PreviewMat x="63.5%" y="42%" w="22%" h="11%" mat={matColor} border={borderColor} heel={heelPassenger ? heelPad : null} logoBrand={logoEnabled ? brand : null} label="YOLCU" />
              {product.parts >= 4 && (
                <>
                  <PreviewMat x="14.5%" y="65%" w="22%" h="10%" mat={matColor} border={borderColor} heel={null} logoBrand={logoEnabled ? brand : null} label="" />
                  <PreviewMat x="63.5%" y="65%" w="22%" h="10%" mat={matColor} border={borderColor} heel={null} logoBrand={logoEnabled ? brand : null} label="" />
                </>
              )}
              {product.includesTrunk && (
                <PreviewMat x="32%" y="83%" w="36%" h="11%" mat={matColor} border={borderColor} heel={null} logoBrand={null} label="BAGAJ" />
              )}
            </div>

            {/* Üst etiket */}
            <div class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur ring-1 ring-white/10 text-[9px] uppercase tracking-wider text-[var(--color-text-soft)] font-medium flex items-center gap-1">
              <ClientBrandLogo iconSlug={brand.iconSlug} name={brand.name} size={10} color={brand.color} />
              {brand.name} {model?.name ?? ''}
            </div>

            {/* Alt chip'ler */}
            <div class="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 justify-start">
              <PreviewChip swatch={matColor.swatchUrl} label={matColor.name} />
              <PreviewChip swatch={borderColor.swatchUrl} label={borderColor.name} />
              <PreviewChip icon="◆" label={`${product.parts} parça`} />
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
              <span class="tabular-nums">
                {formatTRY(unitPrice)}
                {unitPriceOverride !== null && unitPriceOverride !== computedUnitPrice && (
                  <span class="ml-1.5 text-[10px] text-[var(--color-text-muted)] line-through">{formatTRY(computedUnitPrice)}</span>
                )}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-[var(--color-text-muted)]">Adet</span>
              <span class="tabular-nums">× {qty}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[var(--color-text-muted)]">Ara Toplam</span>
              <span class="tabular-nums">{formatTRY(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div class="flex justify-between text-[var(--color-warning)]">
                <span>İndirim</span>
                <span class="tabular-nums">−{formatTRY(discount)}</span>
              </div>
            )}
            <div class="flex justify-between pt-2 border-t border-[var(--color-border)]/60 text-base font-semibold">
              <span>Tahsil Edilecek</span>
              <span class="text-[var(--color-primary)] tabular-nums">{formatTRY(total)}</span>
            </div>
            {paymentStatus === 'kismi' && paidAmount > 0 && (
              <div class="flex justify-between text-xs">
                <span class="text-[var(--color-text-muted)]">Şimdi tahsil</span>
                <span class="text-[var(--color-success)] tabular-nums">{formatTRY(paidAmount)}</span>
              </div>
            )}
            {paymentStatus !== 'tamamlandi' && (
              <div class="flex justify-between text-xs">
                <span class="text-[var(--color-text-muted)]">Bakiye</span>
                <span class="tabular-nums text-[var(--color-warning)]">{formatTRY(Math.max(0, total - paidAmount))}</span>
              </div>
            )}
          </div>

          {error && <p class="mt-3 text-xs text-[var(--color-danger)]">{error}</p>}

          <button
            type="submit"
            onClick={submit}
            disabled={submitting}
            class="mt-5 w-full px-5 py-3 rounded-xl text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] transition-all disabled:opacity-50"
          >
            {submitting ? 'Kaydediliyor...' : 'Teklif & Siparişi Oluştur'}
          </button>
          <p class="mt-2 text-[10px] text-[var(--color-text-muted)] text-center leading-snug">
            Sipariş kaydedildikten sonra detay sayfasından müşteriye <span class="text-[var(--color-text-soft)]">WhatsApp ile takip linki</span> gönderebilirsiniz.
          </p>
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

function PreviewMat({
  x, y, w, h, mat, border, heel, logoBrand, label,
}: {
  x: string; y: string; w: string; h: string
  mat: { swatchUrl: string; name: string }
  border: { swatchUrl: string; name: string }
  heel: { swatchUrl: string } | null
  logoBrand: { iconSlug?: string; name: string; color?: string } | null
  label: string
}) {
  return (
    <div
      class="absolute rounded-md overflow-hidden shadow-lg"
      style={`left: ${x}; top: ${y}; width: ${w}; height: ${h}; box-shadow: 0 6px 14px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);`}
    >
      <img src={border.swatchUrl} alt="" class="absolute inset-0 size-full object-cover" loading="eager" />
      <div class="absolute inset-[14%] rounded-sm overflow-hidden">
        <img src={mat.swatchUrl} alt="" class="size-full object-cover" loading="eager" />
        <div class="absolute inset-0" style="background: linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.25) 100%);"></div>
      </div>
      {heel && (
        <div class="absolute top-[18%] left-[18%] right-[58%] bottom-[55%] rounded-sm overflow-hidden ring-1 ring-white/10">
          <img src={heel.swatchUrl} alt="" class="size-full object-cover" loading="eager" />
        </div>
      )}
      {logoBrand && (
        <div class="absolute top-[20%] left-1/2 -translate-x-1/2 size-[18%] grid place-items-center rounded-full bg-black/65 backdrop-blur ring-1 ring-white/15">
          <ClientBrandLogo iconSlug={logoBrand.iconSlug} name={logoBrand.name} size={16} color="#ffffff" />
        </div>
      )}
      {label && (
        <span class="absolute bottom-[2px] left-1/2 -translate-x-1/2 text-[7px] font-semibold tracking-[0.15em] text-white/70 bg-black/40 px-1 rounded leading-none py-0.5">
          {label}
        </span>
      )}
    </div>
  )
}

function PreviewChip({ swatch, label, icon }: { swatch?: string; label: string; icon?: string }) {
  return (
    <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur ring-1 ring-white/10 text-[9px] text-[var(--color-text-soft)] font-medium">
      {swatch && <img src={swatch} alt="" class="size-2.5 rounded-full object-cover ring-1 ring-white/10" />}
      {icon && <span class="text-[var(--color-primary)]">{icon}</span>}
      {label}
    </span>
  )
}

function Stat({
  label,
  value,
  accent = 'default',
}: {
  label: string
  value: string
  accent?: 'default' | 'primary' | 'warn' | 'mute'
}) {
  const valColor =
    accent === 'primary'
      ? 'text-[var(--color-primary)] font-bold text-base'
      : accent === 'warn'
      ? 'text-[var(--color-warning)] font-semibold'
      : accent === 'mute'
      ? 'text-[var(--color-text-muted)]'
      : 'text-[var(--color-text)] font-semibold'
  return (
    <div class="px-3 py-2 rounded-lg bg-[var(--color-surface-2)]/60 border border-[var(--color-border)]/40">
      <div class="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">{label}</div>
      <div class={`mt-0.5 tabular-nums ${valColor}`}>{value}</div>
    </div>
  )
}
