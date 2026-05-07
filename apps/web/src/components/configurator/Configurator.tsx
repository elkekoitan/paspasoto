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
import ClientBrandLogo from '../ui/ClientBrandLogo'

type StepKey = 'brand' | 'model' | 'product' | 'mat' | 'border' | 'heel' | 'logo' | 'summary'
const STEPS: { key: StepKey; label: string }[] = [
  { key: 'brand', label: 'Marka' },
  { key: 'model', label: 'Model' },
  { key: 'product', label: 'Paspas Seti' },
  { key: 'mat', label: 'Zemin Rengi' },
  { key: 'border', label: 'Kenarlık' },
  { key: 'heel', label: 'Topukluk' },
  { key: 'logo', label: 'Marka Amblemi' },
  { key: 'summary', label: 'Sipariş Özeti' },
]

/**
 * Konfigüratör tasarımı localStorage'a kaydedilir — kullanıcı sayfayı kapatıp
 * tekrar açtığında kaldığı yerden devam eder. "Tasarımı sıfırla" butonu ile temizler.
 */
const STATE_KEY = 'carmat-config-draft-v2'

function loadDraft<T>(fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

type Draft = {
  brandSlug?: string | null
  modelSlug?: string | null
  productSlug?: string
  matSlug?: string
  borderSlug?: string
  heelSlug?: string
  heelPadPassenger?: boolean
  logoBrandSlug?: string | null
  logoChosen?: boolean
}

export default function Configurator() {
  // İlk render'da localStorage'dan draft oku
  const draft = loadDraft<Draft>({})

  const initialBrand = draft.brandSlug ? BRANDS.find((b) => b.slug === draft.brandSlug) ?? null : null
  const initialModel = draft.modelSlug && initialBrand
    ? VEHICLE_MODELS.find((m) => m.brandSlug === initialBrand.slug && m.slug === draft.modelSlug) ?? null
    : null

  const [step, setStep] = useState<StepKey>(initialBrand ? (initialModel ? 'summary' : 'model') : 'brand')
  const [brand, setBrand] = useState<Brand | null>(initialBrand)
  const [model, setModel] = useState<VehicleModel | null>(initialModel)
  const [product, setProduct] = useState<Product | null>(
    draft.productSlug ? PRODUCTS.find((p) => p.slug === draft.productSlug) ?? PRODUCTS[1]! : PRODUCTS[1]!,
  )
  const [matColor, setMatColor] = useState<MatColor | null>(
    draft.matSlug ? MAT_COLORS.find((c) => c.slug === draft.matSlug) ?? MAT_COLORS[0]! : MAT_COLORS[0]!,
  )
  const [borderColor, setBorderColor] = useState<BorderColor | null>(
    draft.borderSlug ? BORDER_COLORS.find((c) => c.slug === draft.borderSlug) ?? BORDER_COLORS[13]! : BORDER_COLORS[13]!,
  )
  const [heelPad, setHeelPad] = useState<HeelPad | null>(
    draft.heelSlug ? HEEL_PADS.find((h) => h.slug === draft.heelSlug) ?? HEEL_PADS[0]! : HEEL_PADS[0]!,
  )
  const [heelPadPassenger, setHeelPadPassenger] = useState<boolean>(!!draft.heelPadPassenger)
  const [logoAccessory, setLogoAccessory] = useState<LogoAccessory | null>(
    draft.logoBrandSlug !== undefined
      ? LOGO_ACCESSORIES.find((l) => l.brandSlug === draft.logoBrandSlug) ?? null
      : null,
  )
  const [search, setSearch] = useState('')
  // Kullanıcıya draft'tan devam ediyoruz uyarısı
  const [showRestoredHint, setShowRestoredHint] = useState(!!initialBrand)

  // Her değişimde draft kaydet
  useEffect(() => {
    if (typeof window === 'undefined') return
    const next: Draft = {
      brandSlug: brand?.slug ?? null,
      modelSlug: model?.slug ?? null,
      productSlug: product?.slug,
      matSlug: matColor?.slug,
      borderSlug: borderColor?.slug,
      heelSlug: heelPad?.slug,
      heelPadPassenger,
      logoBrandSlug: logoAccessory?.brandSlug ?? null,
      logoChosen: logoAccessory !== null,
    }
    try { localStorage.setItem(STATE_KEY, JSON.stringify(next)) } catch {}
  }, [brand, model, product, matColor, borderColor, heelPad, heelPadPassenger, logoAccessory])

  function resetDraft() {
    if (!confirm('Tüm seçimleriniz silinip baştan başlanacak. Emin misiniz?')) return
    try { localStorage.removeItem(STATE_KEY) } catch {}
    window.location.reload()
  }

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

  // Müşteri ön talep formu state'i (ad+telefon+adres)
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactCity, setContactCity] = useState('')
  const [contactDistrict, setContactDistrict] = useState('')
  const [contactAddress, setContactAddress] = useState('')
  const [submittingQuote, setSubmittingQuote] = useState(false)
  const [quoteResult, setQuoteResult] = useState<{ orderNo: string; accessToken: string } | null>(null)
  const [showContactForm, setShowContactForm] = useState(false)

  const TR_CITIES = [
    'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Konya', 'Adana', 'Gaziantep',
    'Kayseri', 'Mersin', 'Eskişehir', 'Diyarbakır', 'Samsun', 'Trabzon', 'Sakarya',
    'Manisa', 'Şanlıurfa', 'Denizli', 'Hatay', 'Balıkesir', 'Kahramanmaraş', 'Van',
    'Aydın', 'Tekirdağ', 'Muğla', 'Erzurum', 'Mardin', 'Malatya', 'Çorum', 'Ordu',
    'Afyonkarahisar', 'Sivas', 'Tokat', 'Zonguldak', 'Diğer',
  ]

  function handleAddToCart() {
    if (!brand || !model || !product || !matColor || !borderColor || !heelPad) {
      alert('Lütfen tüm adımları tamamlayın.')
      return
    }
    setShowContactForm(true)
  }

  async function submitQuote(e: Event) {
    e.preventDefault()
    if (!brand || !model || !product || !matColor || !borderColor || !heelPad) return
    if (!contactName.trim() || !contactPhone.trim() || !contactCity.trim() || !contactDistrict.trim() || !contactAddress.trim()) {
      alert('Lütfen tüm alanları doldurun.')
      return
    }
    setSubmittingQuote(true)
    try {
      const item = {
        brandSlug: brand.slug, brandName: brand.name,
        modelSlug: model.slug, modelName: model.name, modelChassis: model.chassisCode,
        productSlug: product.slug, productName: product.name, productParts: product.parts,
        matSlug: matColor.slug, matName: matColor.name, matSwatchUrl: matColor.swatchUrl,
        borderSlug: borderColor.slug, borderName: borderColor.name, borderSwatchUrl: borderColor.swatchUrl,
        heelSlug: heelPad.slug, heelName: heelPad.name, heelSwatchUrl: heelPad.swatchUrl,
        heelPadPassenger,
        logoBrandSlug: logoAccessory?.brandSlug ?? null,
        logoQty: logoAccessory && logoAccessory.brandSlug ? product.parts : 0,
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
        setQuoteResult(data)
        // Talep oluştuktan sonra draft'ı temizle — yeni tasarım için
        try { localStorage.removeItem(STATE_KEY) } catch {}
      } else {
        alert('Talebiniz iletilemedi. Lütfen tekrar deneyin veya WhatsApp\'tan bize ulaşın.')
      }
    } catch {
      alert('Bağlantı hatası. Lütfen tekrar deneyin.')
    } finally {
      setSubmittingQuote(false)
    }
  }

  return (
    <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-6 lg:gap-10">
      {/* Sol: Adım içerikleri */}
      <div class="order-2 lg:order-1">
        {showRestoredHint && (
          <div class="mb-4 p-3 rounded-xl bg-[var(--color-primary-soft)] border border-[var(--color-primary)]/30 flex items-center gap-3 text-sm">
            <span class="size-7 grid place-items-center rounded-full bg-[var(--color-primary)] text-[var(--color-bg)] shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4 M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            <div class="flex-1 text-[var(--color-text-soft)]">
              <span class="text-[var(--color-text)] font-medium">Önceki tasarımınız yüklendi.</span> Kaldığınız yerden devam edebilirsiniz.
            </div>
            <button onClick={() => setShowRestoredHint(false)} class="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Tamam</button>
          </div>
        )}
        <div class="flex items-center justify-between gap-3 mb-2">
          <div class="flex-1 min-w-0">
            <StepperBar step={step} onJump={(k) => setStep(k)} canJump={(k) => isStepReachable(k, { brand, model, product, matColor, borderColor, heelPad })} />
          </div>
          <button
            onClick={resetDraft}
            class="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-2)] transition-colors shrink-0"
            title="Tüm seçimleri sil ve baştan başla"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>
            Sıfırla
          </button>
        </div>

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
              onAddToCart={() => handleAddToCart()}
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
          onAddToCart={() => handleAddToCart()}
        />
      </aside>

      {/* Müşteri ad/telefon mini form — Teklif Al butonuna basınca açılır */}
      {showContactForm && (
        <div class="fixed inset-0 z-50 grid place-items-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowContactForm(false) }}>
          <div class="w-full max-w-md rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 shadow-2xl overflow-hidden">
            <div class="p-5 border-b border-[var(--color-border)]/60 flex items-start justify-between gap-3">
              <div>
                <h3 class="font-display text-lg font-semibold">Teklif İste</h3>
                <p class="mt-1 text-xs text-[var(--color-text-muted)] leading-snug">
                  Konfigürasyonunuz atölyemize iletilir. Fiyat onaylanınca size WhatsApp'tan teklifi gönderir, sipariş onayınızla üretime başlarız.
                </p>
              </div>
              <button type="button" onClick={() => setShowContactForm(false)} class="size-7 grid place-items-center rounded-lg hover:bg-[var(--color-surface-2)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            {quoteResult ? (
              <div class="p-6 space-y-4 text-center">
                <div class="size-16 rounded-full bg-emerald-500/15 grid place-items-center mx-auto">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <div>
                  <div class="font-display text-lg font-semibold">Talebiniz alındı!</div>
                  <p class="mt-1.5 text-sm text-[var(--color-text-soft)] leading-relaxed">
                    Atölye ekibimiz konfigürasyonunuzu inceleyip <span class="text-[var(--color-primary)] font-semibold">WhatsApp'tan tarafınıza teklifi iletecek</span>.
                  </p>
                  <p class="mt-3 text-xs text-[var(--color-text-muted)]">
                    Talep No: <span class="font-mono text-[var(--color-text)] font-semibold">{quoteResult.orderNo}</span>
                  </p>
                  <p class="mt-1 text-[10px] text-[var(--color-text-muted)]">
                    Bu numarayla <a href="/siparis-takip" class="text-[var(--color-primary)] hover:underline">sipariş takip</a> sayfasından ilerlemeyi izleyebilirsiniz.
                  </p>
                </div>
                <button onClick={() => { setShowContactForm(false); setQuoteResult(null); setContactName(''); setContactPhone(''); setContactCity(''); setContactDistrict(''); setContactAddress('') }} class="w-full px-4 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)]">
                  Tamam
                </button>
              </div>
            ) : (
              <form onSubmit={submitQuote} class="p-5 space-y-3 max-h-[80vh] overflow-y-auto">
                <p class="text-xs text-[var(--color-text-soft)] bg-[var(--color-surface-2)]/60 rounded-lg px-3 py-2 leading-relaxed">
                  Size özel teklifimizi hazırlayabilmemiz için lütfen bilgilerinizi tam olarak girin. Kargo bölgesine ve teslimat tipine göre net fiyat hesaplanır.
                </p>

                {/* Müşteri */}
                <div class="grid grid-cols-2 gap-2">
                  <div class="col-span-2">
                    <label class="block text-xs font-medium text-[var(--color-text-soft)] mb-1">Ad Soyad <span class="text-[var(--color-danger)]">*</span></label>
                    <input
                      type="text"
                      value={contactName}
                      onInput={(e) => setContactName((e.target as HTMLInputElement).value)}
                      required
                      placeholder="Mehmet Yılmaz"
                      class="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm"
                    />
                  </div>
                  <div class="col-span-2">
                    <label class="block text-xs font-medium text-[var(--color-text-soft)] mb-1">Telefon (WhatsApp olan) <span class="text-[var(--color-danger)]">*</span></label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onInput={(e) => setContactPhone((e.target as HTMLInputElement).value)}
                      required
                      placeholder="0532 123 45 67"
                      class="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Adres */}
                <div class="pt-3 border-t border-[var(--color-border)]/40">
                  <div class="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-2">Teslimat Adresi</div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-xs font-medium text-[var(--color-text-soft)] mb-1">İl <span class="text-[var(--color-danger)]">*</span></label>
                      <select
                        value={contactCity}
                        onChange={(e) => setContactCity((e.target as HTMLSelectElement).value)}
                        required
                        class="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm"
                      >
                        <option value="">Seçin...</option>
                        {TR_CITIES.map((c) => <option value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-[var(--color-text-soft)] mb-1">İlçe <span class="text-[var(--color-danger)]">*</span></label>
                      <input
                        type="text"
                        value={contactDistrict}
                        onInput={(e) => setContactDistrict((e.target as HTMLInputElement).value)}
                        required
                        placeholder="Selçuklu"
                        class="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm"
                      />
                    </div>
                    <div class="col-span-2">
                      <label class="block text-xs font-medium text-[var(--color-text-soft)] mb-1">Açık Adres <span class="text-[var(--color-danger)]">*</span></label>
                      <textarea
                        value={contactAddress}
                        onInput={(e) => setContactAddress((e.target as HTMLTextAreaElement).value)}
                        required
                        rows={2}
                        placeholder="Mahalle, cadde, sokak, bina no, daire no"
                        class="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm resize-none"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingQuote}
                  class="w-full mt-2 px-4 py-3 rounded-xl text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] transition-all disabled:opacity-60"
                >
                  {submittingQuote ? 'Gönderiliyor...' : 'Size Özel Teklifimizi Gönder →'}
                </button>
                <p class="text-[10px] text-[var(--color-text-muted)] text-center leading-snug">
                  Bilgileriniz atölyemize ulaşır. Net fiyatımızı WhatsApp'tan tarafınıza göndereceğiz.<br/>
                  Bilgileriniz sadece sipariş ve teslimat için kullanılır.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
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
          Listede yoksa <a href="https://wa.me/905545417561" class="text-[var(--color-primary)] underline-offset-2 hover:underline">WhatsApp'tan</a> iletin.
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
                'aspect-[4/3] rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 px-2 py-2.5',
                active
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-[var(--shadow-glow)] -translate-y-0.5'
                  : 'border-[var(--color-border)]/60 bg-[var(--color-surface-2)] hover:border-[var(--color-text-muted)] hover:-translate-y-0.5',
              ].join(' ')}
            >
              <ClientBrandLogo
                iconSlug={b.iconSlug}
                name={b.name}
                size={36}
                color={b.color}
              />
              <span class={['font-display font-semibold text-[11px] sm:text-xs leading-none truncate w-full text-center', active ? 'text-[var(--color-text)]' : 'text-[var(--color-text-soft)]'].join(' ')}>
                {b.name}
              </span>
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

/* -------------------- Generic Swatch Step (gerçek dokulu) -------------------- */
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
  colors: { id: number; name: string; hex: string; swatchUrl: string }[]
  selected: number | undefined
  onSelect: (c: { id: number; name: string; hex: string; swatchUrl: string }) => void
  big?: boolean
}) {
  return (
    <div>
      <header class="mb-5">
        <h2 class="font-display text-xl font-semibold">{title}</h2>
        {description && <p class="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>}
      </header>
      <div class={big ? 'grid grid-cols-2 sm:grid-cols-5 gap-3' : 'grid grid-cols-3 sm:grid-cols-5 gap-2.5'}>
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
                  'aspect-[4/3] w-full rounded-xl ring-2 transition-all relative overflow-hidden',
                  active
                    ? 'ring-[var(--color-primary)] scale-105 shadow-[var(--shadow-glow)]'
                    : 'ring-[var(--color-border)] hover:ring-[var(--color-text-muted)]',
                ].join(' ')}
              >
                <img src={c.swatchUrl} alt="" class="size-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                <div class="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/5 pointer-events-none" />
                {active && (
                  <span class="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="drop-shadow">
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

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                  'aspect-[4/3] w-full rounded-xl ring-2 transition-all relative overflow-hidden',
                  active
                    ? 'ring-[var(--color-primary)] scale-[1.03] shadow-[var(--shadow-glow)]'
                    : 'ring-[var(--color-border)] hover:ring-[var(--color-text-muted)]',
                ].join(' ')}
              >
                <img src={p.swatchUrl} alt="" class="size-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                <div class="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/5 pointer-events-none" />
                {p.isStandard && (
                  <span class="absolute top-1.5 right-1.5 px-2 py-0.5 text-[9px] rounded-full bg-[var(--color-success)]/90 text-white font-semibold uppercase tracking-wider">
                    Standart
                  </span>
                )}
                {!p.isStandard && p.pricePremium > 0 && (
                  <span class="absolute top-1.5 right-1.5 px-2 py-0.5 text-[9px] rounded-full bg-[var(--color-bg)]/80 backdrop-blur text-[var(--color-primary)] font-semibold">
                    +{formatTRY(p.pricePremium)}
                  </span>
                )}
                {active && (
                  <span class="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="drop-shadow">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
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
        <h2 class="font-display text-2xl font-semibold">Marka ambleminizi seçin</h2>
        <p class="mt-2 text-sm text-[var(--color-text-muted)]">
          Paspasın üst kısmına metal/plastik plaka olarak monte edilir.{' '}
          {brand && (
            <span class="text-[var(--color-text-soft)]">
              {brand.name} ambleminiz otomatik önerildi.
            </span>
          )}
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
                'group text-left p-5 rounded-2xl border transition-all flex items-center justify-between gap-3',
                active
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-[var(--shadow-glow)]'
                  : 'border-[var(--color-border)]/60 bg-[var(--color-surface-2)] hover:border-[var(--color-text-muted)] hover:-translate-y-0.5',
              ].join(' ')}
            >
              <div>
                <div class="font-semibold text-[var(--color-text)]">
                  {isDecline ? 'İstemiyorum' : `${brand?.name ?? a.name.split(' ')[0]} Logosu`}
                </div>
                <div class="mt-1 text-xs text-[var(--color-text-muted)]">
                  {isDecline ? 'Logosuz, sade görünüm' : 'Marka amblemi paspas üzerine sabitlenir'}
                </div>
                <div class={['mt-2 text-sm font-semibold', isDecline ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-primary)]'].join(' ')}>
                  {isDecline ? 'Ücretsiz' : `+${formatTRY(a.price)} / adet`}
                </div>
              </div>
              <div class={['size-12 grid place-items-center rounded-xl font-display font-bold text-lg shrink-0 transition-colors', isDecline ? 'bg-[var(--color-surface)] text-[var(--color-text-muted)]' : 'bg-[var(--color-bg)] text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-bg)]'].join(' ')}>
                {isDecline ? '—' : (brand?.name?.[0] ?? '⊕')}
              </div>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onContinue}
        class="mt-6 w-full px-5 py-3 rounded-xl text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] transition-all hover:shadow-[var(--shadow-glow)]"
      >
        Sipariş özetini gör →
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
  onAddToCart,
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
  onAddToCart: () => void
}) {
  return (
    <div>
      <header class="mb-5">
        <h2 class="font-display text-2xl font-semibold">Paspasınız hazır.</h2>
        <p class="mt-2 text-sm text-[var(--color-text-muted)]">
          Aşağıdaki kombinasyonu onayla, atölyemiz aynı gün üretime başlasın.
        </p>
      </header>

      <dl class="space-y-2 text-sm">
        <Row label="Araç" value={`${brand.name} ${model.name} (${model.chassisCode}, ${model.yearStart}-${model.yearEnd})`} />
        <Row label="Set" value={`${product.name} · ${product.parts} parça`} />
        <Row label="Paspas zemin" value={matColor.name} swatchUrl={matColor.swatchUrl} />
        <Row label="Kenarlık" value={borderColor.name} swatchUrl={borderColor.swatchUrl} />
        <Row
          label="Topukluk"
          value={
            heelPad.name +
            (heelPadPassenger ? ' · sürücü + yolcu' : ' · sadece sürücü')
          }
          swatchUrl={heelPad.swatchUrl}
        />
        <Row
          label="Amblem"
          value={
            logoAccessory && logoAccessory.brandSlug !== null
              ? `${brand.name} × ${product.parts}`
              : 'Eklenmedi'
          }
        />
      </dl>

      <div class="mt-6 pt-5 border-t border-[var(--color-border)]/60 flex items-center justify-between gap-4">
        <div>
          <div class="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] font-semibold">
            Toplam
          </div>
          <div class="font-display text-3xl md:text-4xl font-semibold text-[var(--color-primary)] tabular-nums leading-none mt-1">
            {formatTRY(total)}
          </div>
          <div class="text-xs text-[var(--color-text-muted)] mt-1.5">KDV dahil · Kargo ayrıca</div>
        </div>
        <button
          type="button"
          onClick={onAddToCart}
          class="px-6 py-3.5 rounded-xl text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] transition-all hover:shadow-[var(--shadow-glow)] whitespace-nowrap"
        >
          Teklif İste
        </button>
      </div>

      <p class="mt-4 text-[10px] text-[var(--color-text-muted)] text-center">
        ✓ Sipariş onayından sonra atölyemiz aynı gün üretime başlar · Ortalama 5-7 iş günü kapınızda
      </p>
    </div>
  )
}

function Row({ label, value, swatchUrl }: { label: string; value: string; swatchUrl?: string }) {
  return (
    <div class="flex items-center justify-between gap-4 p-3 rounded-lg bg-[var(--color-surface-2)]">
      <dt class="text-[var(--color-text-muted)] text-xs uppercase tracking-wider font-semibold">{label}</dt>
      <dd class="flex items-center gap-2 text-right text-sm">
        {swatchUrl && (
          <img
            src={swatchUrl}
            alt=""
            class="size-5 rounded-full object-cover ring-1 ring-[var(--color-border)]"
            aria-hidden="true"
          />
        )}
        <span class="text-[var(--color-text)]">{value}</span>
      </dd>
    </div>
  )
}

/* -------------------- Car Body Live Preview -------------------- */
/**
 * Üst görünüm araç gövdesi içine yerleştirilmiş paspas slot'ları:
 *   - Sürücü + Yolcu (ön)
 *   - Sol arka + Sağ arka
 *   - Bagaj (varsa)
 * Her paspas slot'u: kenarlık dokusu + zemin doku + topukluk + amblem
 */
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
  const showTrunk = product?.includesTrunk ?? false
  const showRear = (product?.parts ?? 0) >= 4
  const showLogo = logoAccessory && logoAccessory.brandSlug !== null

  return (
    <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 overflow-hidden shadow-2xl shadow-black/40">
      <div class="relative aspect-[3/4] overflow-hidden">
        {/* Zemin sahne */}
        <div
          class="absolute inset-0"
          style="background:
            radial-gradient(ellipse 80% 60% at 50% 30%, #1a1a22, #0b0b0f 85%);"
        />
        {/* Grain */}
        <div
          class="absolute inset-0 opacity-25 mix-blend-overlay"
          style="background-image: url(&quot;data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>&quot;);"
        />

        {/* Araç gövdesi (üstten görünüm) — daha doğru oran, koltuk ve direksiyon detayı */}
        <svg
          viewBox="0 0 400 600"
          class="absolute inset-x-2 top-2 bottom-2 mx-auto h-[calc(100%-16px)]"
          aria-label="Araç içi paspas yerleşimi"
        >
          <defs>
            {/* Karoser gradyanı */}
            <linearGradient id="bodyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stop-color="#2a2a32" />
              <stop offset="50%" stop-color="#222229" />
              <stop offset="100%" stop-color="#15151b" />
            </linearGradient>
            {/* Cam yüzeyi */}
            <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="rgba(120,160,200,0.18)" />
              <stop offset="50%" stop-color="rgba(60,90,130,0.12)" />
              <stop offset="100%" stop-color="rgba(120,160,200,0.18)" />
            </linearGradient>
            {/* Koltuk dolgusu */}
            <linearGradient id="seatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="rgba(255,255,255,0.06)" />
              <stop offset="100%" stop-color="rgba(255,255,255,0.02)" />
            </linearGradient>
            {/* Sweep ışık efekti — paspas önizlemesini hafifçe parlatır */}
            <linearGradient id="sweep" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="rgba(255,255,255,0)" />
              <stop offset="50%" stop-color="rgba(255,255,255,0.08)" />
              <stop offset="100%" stop-color="rgba(255,255,255,0)" />
            </linearGradient>
            <radialGradient id="hotspot" cx="50%" cy="0%" r="60%">
              <stop offset="0%" stop-color="rgba(255,210,140,0.18)" />
              <stop offset="100%" stop-color="rgba(255,210,140,0)" />
            </radialGradient>
          </defs>

          {/* Üst spot (atölye ışığı) */}
          <rect x="0" y="0" width="400" height="200" fill="url(#hotspot)" />

          {/* Zemin gölgesi */}
          <ellipse cx="200" cy="572" rx="180" ry="16" fill="rgba(0,0,0,0.5)" filter="blur(10px)" />

          {/* Karoser — daha modern coupe/sedan oranları */}
          <path
            d="M 200 18
               C 132 18, 96 60, 90 110
               L 80 220
               L 75 360
               L 82 480
               L 95 540
               C 110 565, 290 565, 305 540
               L 318 480
               L 325 360
               L 320 220
               L 310 110
               C 304 60, 268 18, 200 18 Z"
            fill="url(#bodyGrad)"
            stroke="rgba(255,255,255,0.10)"
            stroke-width="1.2"
          />

          {/* Highlight şerit — gövde üst kenarı parlak yansıma */}
          <path d="M 110 110 C 130 75, 270 75, 290 110" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="0.8" />

          {/* Hood — motor kapağı */}
          <path d="M 120 80 L 280 80 L 290 130 L 110 130 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" />
          <path d="M 200 80 L 200 130" stroke="rgba(255,255,255,0.05)" stroke-width="0.5" />

          {/* Windshield — ön cam */}
          <path d="M 120 145 L 280 145 L 295 215 L 105 215 Z" fill="url(#glassGrad)" stroke="rgba(255,255,255,0.06)" />
          {/* Wiper çizgileri */}
          <path d="M 145 213 Q 175 195 205 213" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="0.8" />
          <path d="M 215 213 Q 245 195 275 213" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="0.8" />

          {/* Tavan + iç hat */}
          <path d="M 125 225 L 275 225 L 285 405 L 115 405 Z" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.04)" />

          {/* Arka cam */}
          <path d="M 120 415 L 280 415 L 290 485 L 110 485 Z" fill="url(#glassGrad)" stroke="rgba(255,255,255,0.05)" />
          <path d="M 130 480 L 270 480" stroke="rgba(220,80,80,0.45)" stroke-width="0.6" />

          {/* Bagaj kapağı */}
          <rect x="110" y="490" width="180" height="55" rx="5" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" />
          {/* Marka logo placeholder bagajda */}
          <circle cx="200" cy="518" r="9" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />

          {/* Yan aynalar */}
          <ellipse cx="78" cy="190" rx="8" ry="13" fill="#15151b" stroke="rgba(255,255,255,0.08)" />
          <ellipse cx="322" cy="190" rx="8" ry="13" fill="#15151b" stroke="rgba(255,255,255,0.08)" />

          {/* Ön/arka tekerlekler — daha gerçekçi pozisyon */}
          <rect x="64" y="155" width="14" height="46" rx="3" fill="#0a0a0d" />
          <rect x="322" y="155" width="14" height="46" rx="3" fill="#0a0a0d" />
          <rect x="64" y="425" width="14" height="46" rx="3" fill="#0a0a0d" />
          <rect x="322" y="425" width="14" height="46" rx="3" fill="#0a0a0d" />

          {/* Far ışıkları (önde) */}
          <rect x="115" y="32" width="32" height="14" rx="6" fill="rgba(255,250,220,0.18)" stroke="rgba(255,250,220,0.3)" stroke-width="0.5" />
          <rect x="253" y="32" width="32" height="14" rx="6" fill="rgba(255,250,220,0.18)" stroke="rgba(255,250,220,0.3)" stroke-width="0.5" />
          {/* Stop lambaları (arkada) */}
          <rect x="115" y="555" width="32" height="10" rx="4" fill="rgba(220,40,40,0.5)" />
          <rect x="253" y="555" width="32" height="10" rx="4" fill="rgba(220,40,40,0.5)" />

          {/* Direksiyon */}
          <g transform="translate(170, 235)">
            <circle cx="0" cy="0" r="14" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2.5" />
            <line x1="-14" y1="0" x2="14" y2="0" stroke="rgba(255,255,255,0.10)" stroke-width="1.5" />
            <circle cx="0" cy="0" r="3" fill="rgba(255,255,255,0.10)" />
          </g>

          {/* Koltuklar — daha 3D */}
          {/* Sürücü */}
          <g>
            <rect x="148" y="250" width="48" height="60" rx="10" fill="url(#seatGrad)" stroke="rgba(255,255,255,0.07)" />
            <rect x="153" y="282" width="38" height="22" rx="7" fill="rgba(0,0,0,0.18)" />
            <rect x="155" y="244" width="34" height="10" rx="4" fill="rgba(255,255,255,0.04)" />
          </g>
          {/* Yolcu */}
          <g>
            <rect x="204" y="250" width="48" height="60" rx="10" fill="url(#seatGrad)" stroke="rgba(255,255,255,0.07)" />
            <rect x="209" y="282" width="38" height="22" rx="7" fill="rgba(0,0,0,0.18)" />
            <rect x="211" y="244" width="34" height="10" rx="4" fill="rgba(255,255,255,0.04)" />
          </g>
          {/* Arka koltuk sırası */}
          <g>
            <rect x="148" y="345" width="104" height="44" rx="10" fill="url(#seatGrad)" stroke="rgba(255,255,255,0.06)" />
            <rect x="155" y="370" width="42" height="16" rx="5" fill="rgba(0,0,0,0.15)" />
            <rect x="203" y="370" width="42" height="16" rx="5" fill="rgba(0,0,0,0.15)" />
          </g>

          {/* Vites kolu */}
          <rect x="194" y="318" width="12" height="22" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" />

          {/* Sweep ışık animasyonu */}
          <rect x="0" y="0" width="80" height="600" fill="url(#sweep)" opacity="0.6">
            <animateTransform attributeName="transform" type="translate" from="-100 0" to="500 0" dur="6s" repeatCount="indefinite" />
          </rect>
        </svg>

        {/* Paspas slot'ları — viewBox 0..600 ile birebir orantılı */}
        <div class="absolute inset-x-2 top-2 bottom-2 mx-auto pointer-events-none">
          <div class="relative h-full w-full" style="aspect-ratio: 400/600;">
            {/* Sürücü ön — koltuğun ayak ucu */}
            <MatSlot
              x="14%" y="53%" w="22%" h="10%" rotate="0deg"
              matColor={matColor} borderColor={borderColor}
              heelPad={heelPad}
              showLogo={!!showLogo}
              brand={brand}
              label="SÜRÜCÜ"
            />
            {/* Yolcu ön */}
            <MatSlot
              x="64%" y="53%" w="22%" h="10%" rotate="0deg"
              matColor={matColor} borderColor={borderColor}
              heelPad={heelPadPassenger ? heelPad : null}
              showLogo={!!showLogo}
              brand={brand}
              label="YOLCU"
            />
            {/* Sol arka */}
            {showRear && (
              <MatSlot
                x="14%" y="67%" w="22%" h="9%" rotate="0deg"
                matColor={matColor} borderColor={borderColor}
                heelPad={null}
                showLogo={!!showLogo}
                brand={brand}
                label=""
              />
            )}
            {/* Sağ arka */}
            {showRear && (
              <MatSlot
                x="64%" y="67%" w="22%" h="9%" rotate="0deg"
                matColor={matColor} borderColor={borderColor}
                heelPad={null}
                showLogo={!!showLogo}
                brand={brand}
                label=""
              />
            )}
            {showRear && (
              <div class="absolute" style="left: 50%; top: 71%; transform: translate(-50%, -50%);">
                <span class="text-[8px] font-semibold tracking-[0.3em] text-[var(--color-text-muted)] bg-[var(--color-bg)]/70 px-2 py-0.5 rounded">
                  ARKA SIRA
                </span>
              </div>
            )}
            {/* Bagaj */}
            {showTrunk && (
              <MatSlot
                x="29%" y="83%" w="42%" h="9%" rotate="0deg"
                matColor={matColor} borderColor={borderColor}
                heelPad={null}
                showLogo={false}
                brand={brand}
                label="BAGAJ"
              />
            )}
          </div>
        </div>

        {/* Üst rozetler */}
        <div class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[var(--color-bg)]/70 backdrop-blur-md ring-1 ring-white/10 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] font-semibold flex items-center gap-1.5">
          <span class="size-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
          Canlı Önizleme
        </div>
        <div class="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[var(--color-bg)]/70 backdrop-blur-md ring-1 ring-white/10 text-[10px] tracking-wider text-[var(--color-text-soft)] font-medium">
          {brand && model ? `${brand.name} ${model.name} ${model.chassisCode}` : 'Aracını seç'}
        </div>

        {/* Alt kombinasyon chip'leri */}
        <div class="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 justify-start">
          {matColor && (
            <ChipPreview swatch={matColor.swatchUrl} label={matColor.name} />
          )}
          {borderColor && (
            <ChipPreview swatch={borderColor.swatchUrl} label={borderColor.name} />
          )}
          {product && (
            <ChipPreview icon="◆" label={`${product.parts} parça`} />
          )}
        </div>
      </div>

      {/* Özet alt panel */}
      <div class="p-5 border-t border-[var(--color-border)]/60 space-y-3">
        <dl class="grid grid-cols-[80px_1fr] gap-y-2 gap-x-4 text-xs">
          <dt class="text-[var(--color-text-muted)]">Araç</dt>
          <dd class="text-right text-[var(--color-text)] font-medium">
            {brand && model ? `${brand.name} ${model.name} ${model.chassisCode}` : '—'}
          </dd>
          <dt class="text-[var(--color-text-muted)]">Set</dt>
          <dd class="text-right text-[var(--color-text)] font-medium">{product?.name ?? '—'}</dd>
          <dt class="text-[var(--color-text-muted)]">Topukluk</dt>
          <dd class="text-right text-[var(--color-text)] font-medium">
            {heelPad?.name ?? '—'}
            {heelPadPassenger && heelPad ? ' (sürücü+yolcu)' : ''}
          </dd>
          <dt class="text-[var(--color-text-muted)]">Amblem</dt>
          <dd class="text-right text-[var(--color-text)] font-medium">
            {showLogo ? `${brand?.name} × ${product?.parts ?? 0}` : 'Eklenmedi'}
          </dd>
        </dl>

        <div class="flex items-end justify-between pt-3 border-t border-[var(--color-border)]/60">
          <div>
            <div class="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] font-semibold">
              Toplam
            </div>
            <div class="text-3xl font-display font-semibold text-[var(--color-primary)] tabular-nums leading-none mt-1">
              {formatTRY(total)}
            </div>
            <div class="text-[10px] text-[var(--color-text-muted)] mt-1.5">KDV dahil · Kargo ayrıca</div>
          </div>
          <button
            type="button"
            onClick={onAddToCart}
            class="px-5 py-3 rounded-xl text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] transition-all hover:shadow-[var(--shadow-glow)] whitespace-nowrap"
          >
            Teklif İste
          </button>
        </div>
      </div>
    </div>
  )
}

/* MatSlot — araç içi paspas yerleştirme */
function MatSlot({
  x,
  y,
  w,
  h,
  rotate,
  matColor,
  borderColor,
  heelPad,
  showLogo,
  brand,
  label,
}: {
  x: string
  y: string
  w: string
  h: string
  rotate: string
  matColor: MatColor | null
  borderColor: BorderColor | null
  heelPad: HeelPad | null
  showLogo: boolean
  brand: Brand | null
  label: string
}) {
  return (
    <div
      class="absolute rounded-md overflow-hidden shadow-lg"
      style={`left: ${x}; top: ${y}; width: ${w}; height: ${h}; transform: rotate(${rotate}); box-shadow: 0 6px 14px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);`}
    >
      {/* Kenarlık */}
      {borderColor && (
        <img
          src={borderColor.swatchUrl}
          alt=""
          class="absolute inset-0 size-full object-cover"
          loading="eager"
        />
      )}
      {/* Zemin */}
      <div class="absolute inset-[14%] rounded-sm overflow-hidden">
        {matColor && (
          <img
            src={matColor.swatchUrl}
            alt=""
            class="size-full object-cover"
            loading="eager"
          />
        )}
        <div
          class="absolute inset-0"
          style="background: linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.25) 100%);"
        />
      </div>
      {/* Topukluk */}
      {heelPad && (
        <div class="absolute top-[18%] left-[18%] right-[58%] bottom-[55%] rounded-sm overflow-hidden ring-1 ring-white/10">
          <img src={heelPad.swatchUrl} alt="" class="size-full object-cover" loading="eager" />
        </div>
      )}
      {/* Amblem (gerçek marka logosu) */}
      {showLogo && brand && (
        <div class="absolute top-[20%] left-1/2 -translate-x-1/2 size-[18%] grid place-items-center rounded-full bg-black/65 backdrop-blur ring-1 ring-white/15 shadow-md">
          <ClientBrandLogo
            iconSlug={brand.iconSlug}
            name={brand.name}
            size={20}
            color="#ffffff"
          />
        </div>
      )}
      {/* Etiket */}
      {label && (
        <span class="absolute bottom-[2px] left-1/2 -translate-x-1/2 text-[7px] font-semibold tracking-[0.15em] text-white/70 bg-black/40 px-1 rounded leading-none py-0.5">
          {label}
        </span>
      )}
    </div>
  )
}

function ChipPreview({ swatch, label, icon }: { swatch?: string; label: string; icon?: string }) {
  return (
    <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--color-bg)]/70 backdrop-blur-md ring-1 ring-white/10 text-[10px] text-[var(--color-text-soft)] font-medium">
      {swatch && (
        <img src={swatch} alt="" class="size-3 rounded-full object-cover ring-1 ring-white/10" />
      )}
      {icon && <span class="text-[var(--color-primary)]">{icon}</span>}
      {label}
    </span>
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
