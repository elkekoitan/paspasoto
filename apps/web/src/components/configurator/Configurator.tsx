import { useEffect, useMemo, useState } from 'preact/hooks'
import {
  BRANDS,
  VEHICLE_MODELS,
  MAT_COLORS,
  BORDER_COLORS,
  HEEL_PADS,
  LOGO_ACCESSORIES,
  PRODUCTS,
  BODY_LABEL,
  type Brand,
  type BodyType,
  type VehicleModel,
  type VehicleTrim,
  type MatColor,
  type BorderColor,
  type HeelPad,
  type LogoAccessory,
  type Product,
} from '../../lib/catalog'
import { getTrimsForModel, FUEL_LABEL, TRANSMISSION_LABEL } from '../../lib/catalog-trims'
import { formatTRY } from '../../lib/format'
import ClientBrandLogo from '../ui/ClientBrandLogo'
import VirtualShowroom from './VirtualShowroom'

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
const STATE_KEY = 'carmat-config-draft-v3'

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

/** Paspas pozisyonu — araç içinde hangi paspas */
export type MatPosition = 'driver' | 'passenger' | 'leftRear' | 'rightRear' | 'trunk'
/** Logo'nun paspas üzerindeki yerleşimi */
export type LogoPlacement = 'top' | 'middle' | 'bottom'
/** Topukluk konum tercihi */
export type HeelPosition = 'driver-only' | 'passenger-only' | 'both' | 'none'

/** Bir paspas pozisyonu için logo konfigürasyonu */
export type MatLogoConfig = {
  position: MatPosition
  brandSlug: string | null   // null = bu paspasta logo yok
  placement: LogoPlacement
}

type Draft = {
  brandSlug?: string | null
  modelSlug?: string | null
  productSlug?: string
  matSlug?: string
  borderSlug?: string
  heelSlug?: string
  heelPosition?: HeelPosition
  logos?: MatLogoConfig[]
}

/** Set parts → o set için pozisyon listesi */
function positionsFor(parts: number, includesTrunk: boolean): MatPosition[] {
  const out: MatPosition[] = ['driver', 'passenger']
  if (parts >= 4) out.push('leftRear', 'rightRear')
  if (includesTrunk) out.push('trunk')
  return out
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
  const [trim, setTrim] = useState<VehicleTrim | null>(null)
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
  // Topukluk konumu: sürücü / yolcu / her ikisi / yok
  const [heelPosition, setHeelPosition] = useState<HeelPosition>(
    (draft.heelPosition as HeelPosition) ?? 'driver-only',
  )
  // Per-mat logos: 5 pozisyon için ayrı seçim + placement
  const initialLogos: MatLogoConfig[] =
    draft.logos && Array.isArray(draft.logos)
      ? draft.logos
      : (['driver', 'passenger', 'leftRear', 'rightRear', 'trunk'] as MatPosition[]).map((p) => ({
          position: p,
          brandSlug: null,
          placement: 'top',
        }))
  const [logos, setLogos] = useState<MatLogoConfig[]>(initialLogos)

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
      heelPosition,
      logos,
    }
    try { localStorage.setItem(STATE_KEY, JSON.stringify(next)) } catch {}
  }, [brand, model, product, matColor, borderColor, heelPad, heelPosition, logos])

  function resetDraft() {
    if (!confirm('Tüm seçimleriniz silinip baştan başlanacak. Emin misiniz?')) return
    try { localStorage.removeItem(STATE_KEY) } catch {}
    window.location.reload()
  }

  // Marka değişince — daha önce hiç logo seçilmemişse tüm paspaslar için
  // o markayı otomatik öner (sürücü+yolcu için, arka+bagaj için boş bırak)
  useEffect(() => {
    if (!brand) return
    const hasAnyLogo = logos.some((l) => l.brandSlug !== null)
    if (hasAnyLogo) return
    setLogos((prev) =>
      prev.map((l) =>
        l.position === 'driver' || l.position === 'passenger'
          ? { ...l, brandSlug: brand.slug }
          : l,
      ),
    )
  }, [brand?.slug])

  // Helpers
  const setLogoFor = (position: MatPosition, brandSlug: string | null) =>
    setLogos((prev) => prev.map((l) => (l.position === position ? { ...l, brandSlug } : l)))
  const setPlacementFor = (position: MatPosition, placement: LogoPlacement) =>
    setLogos((prev) => prev.map((l) => (l.position === position ? { ...l, placement } : l)))
  const applyLogoToAll = (brandSlug: string | null) =>
    setLogos((prev) => prev.map((l) => ({ ...l, brandSlug })))

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
    // Topukluk: 'both' = +100₺ (yolcu paspasına ek), 'passenger-only' = +0 (yer değişimi)
    if (heelPosition === 'both') total += 100
    // Logo: her aktif (brandSlug != null) pozisyon için +150₺
    const activePositions = positionsFor(product?.parts ?? 0, !!product?.includesTrunk)
    const logoCount = logos.filter(
      (l) => l.brandSlug !== null && activePositions.includes(l.position),
    ).length
    total += logoCount * 150
    return total
  }, [product, heelPad, heelPosition, logos])

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
      // Aktif paspas pozisyonları için logo'ları filtrele
      const activePositions = positionsFor(product.parts, product.includesTrunk)
      const activeLogos = logos.filter((l) => activePositions.includes(l.position))
      const logoQty = activeLogos.filter((l) => l.brandSlug !== null).length
      // Geriye dönük uyumluluk: logoBrandSlug ilk dolu logo'yu yansıtır
      const firstLogoBrand = activeLogos.find((l) => l.brandSlug !== null)?.brandSlug ?? null
      const heelPassengerLegacy = heelPosition === 'both' || heelPosition === 'passenger-only'

      const item = {
        brandSlug: brand.slug, brandName: brand.name,
        modelSlug: model.slug, modelName: model.name, modelChassis: model.chassisCode,
        productSlug: product.slug, productName: product.name, productParts: product.parts,
        matSlug: matColor.slug, matName: matColor.name, matSwatchUrl: matColor.swatchUrl,
        borderSlug: borderColor.slug, borderName: borderColor.name, borderSwatchUrl: borderColor.swatchUrl,
        heelSlug: heelPad.slug, heelName: heelPad.name, heelSwatchUrl: heelPad.swatchUrl,
        // Yeni şema:
        heelPosition,
        logos: activeLogos,
        // Geriye dönük uyumluluk (eski tracker/admin parser'ları için):
        heelPadPassenger: heelPassengerLegacy,
        logoBrandSlug: firstLogoBrand,
        logoQty,
        category: 'mat' as const,
        qty: 1, unitPrice: totalPrice,
        // Trim/versiyon (opsiyonel — kullanıcı sahibinden seviyesi seçim yaptıysa)
        ...(trim ? {
          trimId: trim.id,
          trimName: trim.name,
          trimEngine: trim.engine,
          trimFuel: trim.fuel,
          trimTransmission: trim.transmission,
          trimPackage: trim.package,
        } : {}),
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

  const bgImage = matColor?.showroomUrl || '/images/showroom_black_red_1778185224584.png'

  return (
    <div class="absolute inset-0 w-full h-full text-white overflow-hidden bg-[#0b0b0f] font-sans">
      {/* 3D WebGL Showroom Environment */}
      <VirtualShowroom imageUrl={bgImage} />

      {/* Gradients for UI readability */}
      <div class="absolute inset-0 z-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none"></div>
      <div class="absolute inset-0 z-0 bg-gradient-to-r from-black/80 via-black/10 to-transparent pointer-events-none"></div>

      {/* Floating HUD UI */}
      <div class="absolute inset-0 z-10 flex flex-col md:flex-row p-4 md:p-8 pointer-events-none">
        
        {/* Left Side: Configuration Steps */}
        <div class="w-full md:w-[460px] h-full flex flex-col justify-end md:justify-center pointer-events-auto mt-16 md:mt-0">
           {/* Glassmorphic Panel */}
           <div class="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col max-h-[85vh]">
              <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
              
              <div class="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar relative z-10">
                {showRestoredHint && (
                  <div class="mb-5 p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center gap-3 text-sm backdrop-blur-md">
                    <span class="size-7 grid place-items-center rounded-full bg-amber-500 text-black shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4 M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                    <div class="flex-1 text-white/80 text-xs">
                      <span class="text-white font-medium">Tasarımınız yüklendi.</span> Kaldığınız yerden devam edebilirsiniz.
                    </div>
                    <button onClick={() => setShowRestoredHint(false)} class="text-[10px] text-white/50 hover:text-white">Kapat</button>
                  </div>
                )}
                
                <div class="flex items-center justify-between gap-3 mb-4">
                  <div class="flex-1 min-w-0">
                    <StepperBar step={step} onJump={(k) => setStep(k)} canJump={(k) => isStepReachable(k, { brand, model, product, matColor, borderColor, heelPad })} />
                  </div>
                  <button
                    onClick={resetDraft}
                    class="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white/50 hover:text-red-400 hover:bg-white/10 transition-colors shrink-0"
                    title="Tüm seçimleri sil ve baştan başla"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>
                    Sıfırla
                  </button>
                </div>

                <div class="animate-in slide-in-from-left-4 fade-in duration-500">
                  {step === 'brand' && <BrandStep brands={filteredBrands} selected={brand} onSelect={(b) => { setBrand(b); setModel(null); setStep('model'); }} search={search} onSearchChange={setSearch} />}
                  {step === 'model' && brand && <ModelStep brand={brand} models={models} selected={model} selectedTrim={trim} onSelect={(m, t) => { setModel(m); setTrim(t ?? null); setStep('product'); }} onBack={() => setStep('brand')} />}
                  {step === 'product' && <ProductStep products={PRODUCTS} selected={product} onSelect={(p) => { setProduct(p); setStep('mat'); }} />}
                  {step === 'mat' && <SwatchStep title="Paspas Zemin Rengi" description="Paspasın havuzlu kısmının zemin rengi." colors={MAT_COLORS} selected={matColor?.id} onSelect={(c) => { setMatColor(c); setStep('border'); }} />}
                  {step === 'border' && <SwatchStep title="Kenarlık Rengi" description="Paspasın çevresini saran biye/kenarlık şeridi." colors={BORDER_COLORS} selected={borderColor?.id} onSelect={(c) => { setBorderColor(c); setStep('heel'); }} big={false} />}
                  {step === 'heel' && <HeelPadStep pads={HEEL_PADS} selected={heelPad} onSelect={setHeelPad} heelPosition={heelPosition} onPositionChange={setHeelPosition} onContinue={() => setStep('logo')} />}
                  {step === 'logo' && (
                    <LogoStep
                      brand={brand}
                      product={product!}
                      matColor={matColor!}
                      borderColor={borderColor!}
                      logos={logos}
                      onSetLogo={setLogoFor}
                      onSetPlacement={setPlacementFor}
                      onApplyAll={applyLogoToAll}
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
                      heelPosition={heelPosition}
                      logos={logos}
                      total={totalPrice}
                      onAddToCart={() => handleAddToCart()}
                    />
                  )}
                </div>
              </div>

              {/* Footer nav inside the panel */}
              {step !== 'summary' && (
                <div class="mt-auto p-6 border-t border-white/10 bg-black/20 flex items-center justify-between relative z-10">
                  <button type="button" onClick={prev} disabled={step === 'brand'} class="px-5 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors backdrop-blur-md">
                    ← Geri
                  </button>
                  <button type="button" onClick={next} disabled={!canNext} class="px-6 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:bg-white/90 disabled:opacity-30 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                    Devam →
                  </button>
                </div>
              )}
           </div>
        </div>

        {/* Right Side: Live Preview + Price HUD */}
        <div class="hidden md:flex flex-col justify-between items-end flex-1 py-8 pointer-events-auto gap-6">
           {/* Canlı paspas önizlemesi — mat color seçildiyse görünür */}
           {matColor && borderColor && heelPad && product && (
             <div class="w-full max-w-[360px] animate-in slide-in-from-right-8 fade-in duration-700">
               <Preview
                 matColor={matColor}
                 borderColor={borderColor}
                 heelPad={heelPad}
                 heelPadPassenger={heelPosition === 'both' || heelPosition === 'passenger-only'}
                 logoAccessory={logos.some((l) => l.brandSlug !== null) ? { id: 0, brandSlug: brand?.slug ?? null, name: brand?.name ?? '', price: 0 } : null}
                 brand={brand}
                 model={model}
                 product={product}
                 total={totalPrice}
                 onAddToCart={() => setStep('summary')}
               />
             </div>
           )}

           <div class="text-right animate-in slide-in-from-right-8 fade-in duration-1000 delay-300">
             <div class="text-[11px] uppercase tracking-[0.4em] text-white/50 font-bold mb-2 drop-shadow-md">Canlı Konfigürasyon</div>
             <div class="text-7xl font-display font-semibold tabular-nums tracking-tighter drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] text-white">{formatTRY(totalPrice)}</div>
             <div class="flex items-center justify-end gap-3 mt-5 flex-wrap max-w-lg">
               {logos.some((l) => l.brandSlug !== null) && brand && (
                 <div class="size-11 rounded-full bg-black/40 backdrop-blur-md grid place-items-center ring-1 ring-white/20 shadow-xl">
                   <ClientBrandLogo iconSlug={brand.iconSlug} logoUrl={brand.logoUrl} name={brand.name} size={24} color="#fff" />
                 </div>
               )}
               {brand && model && (
                 <div class="px-4 py-2 rounded-full bg-black/40 backdrop-blur-md text-xs font-semibold ring-1 ring-white/20 shadow-xl text-white/90">
                   {brand.name} {model.name}
                 </div>
               )}
               {matColor && (
                 <div class="px-4 py-2 rounded-full bg-black/40 backdrop-blur-md text-xs font-semibold ring-1 ring-white/20 shadow-xl text-white/90 flex items-center gap-2">
                   <span class="size-3 rounded-full" style={`background-color: ${matColor.hex};`}></span>
                   {matColor.name} + {borderColor?.name} Kenarlık
                 </div>
               )}
             </div>
           </div>
        </div>
      </div>

      {/* Müşteri ad/telefon mini form — Teklif Al butonuna basınca açılır */}
      {showContactForm && (
        <div class="fixed inset-0 z-[100] grid place-items-center p-4 bg-black/80 backdrop-blur-md pointer-events-auto" onClick={(e) => { if (e.target === e.currentTarget) setShowContactForm(false) }}>
          <div class="w-full max-w-md rounded-3xl bg-[var(--color-surface)] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
            <div class="p-6 border-b border-white/5 flex items-start justify-between gap-3">
              <div>
                <h3 class="font-display text-xl font-semibold text-white">Teklif İste</h3>
                <p class="mt-1.5 text-xs text-white/60 leading-snug">
                  Konfigürasyonunuz atölyemize iletilir. Fiyat onaylanınca size WhatsApp'tan teklifi gönderir, sipariş onayınızla üretime başlarız.
                </p>
              </div>
              <button type="button" onClick={() => setShowContactForm(false)} class="size-8 grid place-items-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            {quoteResult ? (
              <div class="p-8 space-y-5 text-center">
                <div class="size-20 rounded-full bg-emerald-500/20 grid place-items-center mx-auto ring-1 ring-emerald-500/50">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <div>
                  <div class="font-display text-2xl font-semibold text-white">Talebiniz Alındı!</div>
                  <p class="mt-2 text-sm text-white/70 leading-relaxed">
                    Atölye ekibimiz konfigürasyonunuzu inceleyip <span class="text-white font-semibold">WhatsApp'tan tarafınıza teklifi iletecek</span>.
                  </p>
                  <div class="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 inline-block">
                    <p class="text-xs text-white/50 mb-1">Talep No</p>
                    <p class="font-mono text-white text-lg font-semibold">{quoteResult.orderNo}</p>
                  </div>
                </div>
                <button onClick={() => { setShowContactForm(false); setQuoteResult(null); setContactName(''); setContactPhone(''); setContactCity(''); setContactDistrict(''); setContactAddress(''); resetDraft(); }} class="w-full px-5 py-3.5 rounded-xl text-sm font-semibold bg-white hover:bg-white/90 text-black transition-all">
                  Kapat ve Yeni Tasarıma Başla
                </button>
              </div>
            ) : (
              <form onSubmit={submitQuote} class="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* Müşteri */}
                <div class="grid grid-cols-2 gap-3">
                  <div class="col-span-2">
                    <label class="block text-xs font-medium text-white/70 mb-1.5">Ad Soyad</label>
                    <input type="text" value={contactName} onInput={(e) => setContactName((e.target as HTMLInputElement).value)} required placeholder="Örn: Mehmet Yılmaz" class="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-white/30 text-white placeholder:text-white/30 outline-none text-sm transition-colors" />
                  </div>
                  <div class="col-span-2">
                    <label class="block text-xs font-medium text-white/70 mb-1.5">Telefon (WhatsApp olan)</label>
                    <input type="tel" value={contactPhone} onInput={(e) => setContactPhone((e.target as HTMLInputElement).value)} required placeholder="Örn: 0532 123 45 67" class="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-white/30 text-white placeholder:text-white/30 outline-none text-sm font-mono transition-colors" />
                  </div>
                </div>

                {/* Adres */}
                <div class="pt-4 border-t border-white/10">
                  <div class="text-[10px] uppercase tracking-wider text-white/50 font-bold mb-3">Teslimat Adresi</div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-medium text-white/70 mb-1.5">İl</label>
                      <select value={contactCity} onChange={(e) => setContactCity((e.target as HTMLSelectElement).value)} required class="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-white/30 text-white outline-none text-sm appearance-none transition-colors">
                        <option value="" class="bg-gray-900">Seçin...</option>
                        {TR_CITIES.map((c) => <option value={c} class="bg-gray-900">{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-white/70 mb-1.5">İlçe</label>
                      <input type="text" value={contactDistrict} onInput={(e) => setContactDistrict((e.target as HTMLInputElement).value)} required placeholder="Örn: Selçuklu" class="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-white/30 text-white placeholder:text-white/30 outline-none text-sm transition-colors" />
                    </div>
                    <div class="col-span-2">
                      <label class="block text-xs font-medium text-white/70 mb-1.5">Açık Adres</label>
                      <textarea value={contactAddress} onInput={(e) => setContactAddress((e.target as HTMLTextAreaElement).value)} required rows={2} placeholder="Mahalle, cadde, sokak, bina vb." class="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-white/30 text-white placeholder:text-white/30 outline-none text-sm resize-none custom-scrollbar transition-colors"></textarea>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={submittingQuote} class="w-full mt-4 px-5 py-3.5 rounded-xl text-sm font-bold bg-white hover:bg-white/90 text-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 flex items-center justify-center gap-2">
                  {submittingQuote ? 'Gönderiliyor...' : 'Teklifimi Hazırla ve Gönder'}
                  {!submittingQuote && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
                </button>
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
                logoUrl={b.logoUrl}
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
  selectedTrim,
  onSelect,
  onBack: _onBack,
}: {
  brand: Brand
  models: VehicleModel[]
  selected: VehicleModel | null
  selectedTrim: VehicleTrim | null
  onSelect: (m: VehicleModel, trim?: VehicleTrim) => void
  onBack: () => void
}) {
  // Cascade state — sahibinden.com tarzı 2 aşamalı seçim
  const [bodyFilter, setBodyFilter] = useState<BodyType | 'all'>('all')
  const [pickedName, setPickedName] = useState<string | null>(selected?.name ?? null)

  // Filtre uygulanmış model listesi
  const filtered = useMemo(
    () => models.filter((m) => bodyFilter === 'all' || m.bodyType === bodyFilter),
    [models, bodyFilter],
  )

  // Body type chip listesi (sadece markada mevcut olanlar)
  const availableBodies = useMemo(() => {
    const set = new Set<BodyType>()
    for (const m of models) if (m.bodyType) set.add(m.bodyType)
    return Array.from(set)
  }, [models])

  // Eşsiz model isimleri — grupla (BMW 3 Serisi tek kart, F30 + G20 ayrı satır)
  const uniqueModels = useMemo(() => {
    const map = new Map<string, VehicleModel[]>()
    for (const m of filtered) {
      const list = map.get(m.name) ?? []
      list.push(m)
      map.set(m.name, list)
    }
    return Array.from(map.entries())
      .map(([name, gens]) => ({
        name,
        bodyType: gens[0]?.bodyType,
        generations: gens.sort((a, b) => a.yearStart - b.yearStart),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
  }, [filtered])

  // Seçili model adının jenerasyonları — yıl picker için
  const pickedGenerations = useMemo(
    () => (pickedName ? models.filter((m) => m.name === pickedName).sort((a, b) => a.yearStart - b.yearStart) : []),
    [models, pickedName],
  )

  // Yıl listesi — min/max aralığında
  const yearOptions = useMemo(() => {
    if (!pickedGenerations.length) return []
    const min = Math.min(...pickedGenerations.map((g) => g.yearStart))
    const max = Math.max(...pickedGenerations.map((g) => g.yearEnd))
    const years: number[] = []
    for (let y = max; y >= min; y--) years.push(y)
    return years
  }, [pickedGenerations])

  function pickModelName(name: string) {
    const gens = models.filter((m) => m.name === name)
    if (gens.length === 1) {
      // Tek jenerasyon → yıl picker'a gerek yok
      onSelect(gens[0])
    } else {
      setPickedName(name)
    }
  }

  // Trim seçimi için: önce yıl picker pickedModel'i set eder; trim'i varsa
  // trim picker görünür, yoksa direkt onSelect çağrılır.
  const [pickedModel, setPickedModel] = useState<VehicleModel | null>(selected ?? null)
  const trimsForPicked = useMemo(() => (pickedModel ? getTrimsForModel(pickedModel.id) : []), [pickedModel])
  const [chosenTrim, setChosenTrim] = useState<VehicleTrim | null>(selectedTrim)

  function pickYear(year: number) {
    const gen = pickedGenerations.find((g) => year >= g.yearStart && year <= g.yearEnd)
    if (!gen) return
    const trims = getTrimsForModel(gen.id)
    if (trims.length === 0) {
      onSelect(gen)  // trim yok → direkt advance
    } else {
      setPickedModel(gen)  // trim picker'a geç
    }
  }

  // Tek jenerasyon durumunda da pickModelName trim flow'unu tetiklemeli
  function pickModelNameWithTrim(name: string) {
    const gens = models.filter((m) => m.name === name)
    if (gens.length === 1) {
      const gen = gens[0]
      const trims = getTrimsForModel(gen.id)
      if (trims.length === 0) {
        onSelect(gen)
      } else {
        setPickedModel(gen)
      }
    } else {
      setPickedName(name)
    }
  }

  // Trim picker görünür mü? (pickedModel + model'in trim'i var)
  if (pickedModel && trimsForPicked.length > 0) {
    return (
      <div>
        <header class="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 class="font-display text-xl font-semibold">
              {brand.name} {pickedModel.name}
            </h2>
            <p class="mt-1 text-sm text-[var(--color-text-muted)]">
              Versiyonu seç (opsiyonel). Atölyemiz tam donanımı görsün diye işaretle.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setPickedModel(null); setChosenTrim(null) }}
            class="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-surface-2)] hover:bg-[var(--color-border)]/40 whitespace-nowrap"
          >
            ← Yıl değiştir
          </button>
        </header>

        {/* Mevcut model bilgisi */}
        <div class="mb-3 px-3 py-2 rounded-lg bg-[var(--color-surface-2)]/60 text-xs text-[var(--color-text-soft)] flex items-center gap-2 flex-wrap">
          <span class="font-mono text-[var(--color-text)]">{pickedModel.chassisCode}</span>
          <span>·</span>
          <span>{pickedModel.yearStart}–{pickedModel.yearEnd}</span>
          {pickedModel.bodyType && <><span>·</span><span>{BODY_LABEL[pickedModel.bodyType]}</span></>}
        </div>

        {/* Trim listesi */}
        <div class="space-y-1.5 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
          {trimsForPicked.map((t) => {
            const active = chosenTrim?.id === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setChosenTrim(t)}
                class={[
                  'w-full text-left p-3 rounded-xl border transition-all',
                  active
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                    : 'border-[var(--color-border)]/40 bg-[var(--color-surface-2)]/40 hover:border-[var(--color-text-muted)]',
                ].join(' ')}
              >
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span class="font-semibold text-sm">{t.name}</span>
                  {t.power && <span class="text-[10px] font-mono text-[var(--color-primary)]">{t.power} HP</span>}
                </div>
                <div class="flex flex-wrap gap-2 text-[10px] text-[var(--color-text-muted)]">
                  {t.engine && <span class="font-mono">{t.engine}</span>}
                  {t.fuel && <span class="px-1.5 py-0.5 rounded bg-[var(--color-surface)]/60">{FUEL_LABEL[t.fuel]}</span>}
                  {t.transmission && <span class="px-1.5 py-0.5 rounded bg-[var(--color-surface)]/60">{TRANSMISSION_LABEL[t.transmission]}</span>}
                  {t.package && <span class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300/80">{t.package}</span>}
                </div>
              </button>
            )
          })}
        </div>

        {/* Devam / Atla butonları */}
        <div class="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSelect(pickedModel)}
            class="px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--color-surface-2)] hover:bg-[var(--color-border)]/40 text-[var(--color-text-soft)]"
          >
            Versiyon Atla
          </button>
          <button
            type="button"
            onClick={() => onSelect(pickedModel, chosenTrim ?? undefined)}
            disabled={!chosenTrim}
            class="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] disabled:opacity-30"
          >
            Devam →
          </button>
        </div>
      </div>
    )
  }

  // Yıl picker görünür mü?
  if (pickedName && pickedGenerations.length > 1) {
    return (
      <div>
        <header class="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 class="font-display text-xl font-semibold">
              {brand.name} {pickedName}
            </h2>
            <p class="mt-1 text-sm text-[var(--color-text-muted)]">
              Aracının üretim yılını seç. Doğru jenerasyon otomatik seçilecek.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPickedName(null)}
            class="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-surface-2)] hover:bg-[var(--color-border)]/40 whitespace-nowrap"
          >
            ← Model değiştir
          </button>
        </header>

        {/* Jenerasyon timeline — yıl aralığı görsel */}
        <div class="mb-4 space-y-1.5">
          {pickedGenerations.map((g, i) => (
            <div
              key={g.id}
              class={[
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs',
                selected?.id === g.id
                  ? 'bg-[var(--color-primary-soft)] border border-[var(--color-primary)]/40'
                  : 'bg-[var(--color-surface-2)]/60',
              ].join(' ')}
            >
              <span class="size-5 grid place-items-center rounded-full bg-[var(--color-primary)] text-[var(--color-bg)] text-[10px] font-bold">
                {i + 1}
              </span>
              <span class="font-mono text-[var(--color-text)]">{g.chassisCode}</span>
              <span class="text-[var(--color-text-muted)]">{g.yearStart}-{g.yearEnd}</span>
              {g.bodyType && (
                <span class="ml-auto px-2 py-0.5 rounded-full text-[10px] bg-[var(--color-surface)]/60 text-[var(--color-text-soft)]">
                  {BODY_LABEL[g.bodyType]}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Yıl grid */}
        <div class="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
          {yearOptions.map((y) => {
            const matchingGen = pickedGenerations.find((g) => y >= g.yearStart && y <= g.yearEnd)
            const active = selected && y >= selected.yearStart && y <= selected.yearEnd
            return (
              <button
                key={y}
                type="button"
                onClick={() => pickYear(y)}
                disabled={!matchingGen}
                class={[
                  'px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                  active
                    ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                    : matchingGen
                    ? 'bg-[var(--color-surface-2)] hover:bg-[var(--color-border)]/40 text-[var(--color-text)]'
                    : 'bg-[var(--color-surface-2)]/40 text-[var(--color-text-muted)]/50 cursor-not-allowed',
                ].join(' ')}
              >
                {y}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      <header class="mb-5">
        <h2 class="font-display text-xl font-semibold">{brand.name} model</h2>
        <p class="mt-1 text-sm text-[var(--color-text-muted)]">
          Aracının modelini seç. Birden fazla jenerasyon varsa yıl seçimi gelecek.
        </p>
      </header>

      {/* Body type filtre chip'leri */}
      {availableBodies.length > 1 && (
        <div class="mb-4 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setBodyFilter('all')}
            class={[
              'px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors',
              bodyFilter === 'all'
                ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                : 'bg-[var(--color-surface-2)] text-[var(--color-text-soft)] hover:bg-[var(--color-border)]/40',
            ].join(' ')}
          >
            Tümü ({models.length})
          </button>
          {availableBodies.map((b) => {
            const count = models.filter((m) => m.bodyType === b).length
            const active = bodyFilter === b
            return (
              <button
                key={b}
                type="button"
                onClick={() => setBodyFilter(active ? 'all' : b)}
                class={[
                  'px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors',
                  active
                    ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                    : 'bg-[var(--color-surface-2)] text-[var(--color-text-soft)] hover:bg-[var(--color-border)]/40',
                ].join(' ')}
              >
                {BODY_LABEL[b]} ({count})
              </button>
            )
          })}
        </div>
      )}

      {models.length === 0 ? (
        <div class="p-6 rounded-lg bg-[var(--color-surface-2)] text-sm text-[var(--color-text-muted)] text-center">
          Bu marka için henüz model verisi yüklenmemiş.
        </div>
      ) : uniqueModels.length === 0 ? (
        <div class="p-6 rounded-lg bg-[var(--color-surface-2)] text-sm text-[var(--color-text-muted)] text-center">
          Bu kasa tipinde model bulunamadı. Filtreyi temizle.
        </div>
      ) : (
        <div class="grid sm:grid-cols-2 gap-2.5">
          {uniqueModels.map((u) => {
            const active = selected?.name === u.name
            return (
              <button
                key={u.name}
                type="button"
                onClick={() => pickModelNameWithTrim(u.name)}
                class={[
                  'text-left p-4 rounded-xl border transition-all',
                  active
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                    : 'border-[var(--color-border)]/60 bg-[var(--color-surface-2)] hover:border-[var(--color-text-muted)]',
                ].join(' ')}
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="font-semibold">{u.name}</div>
                  {u.bodyType && (
                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface)]/70 text-[var(--color-text-muted)] font-medium">
                      {BODY_LABEL[u.bodyType]}
                    </span>
                  )}
                </div>
                <div class="mt-1 text-xs text-[var(--color-text-muted)]">
                  {u.generations.length === 1
                    ? `${u.generations[0].chassisCode} · ${u.generations[0].yearStart}-${u.generations[0].yearEnd}`
                    : `${u.generations.length} jenerasyon · ${Math.min(...u.generations.map((g) => g.yearStart))}-${Math.max(...u.generations.map((g) => g.yearEnd))}`}
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

/* -------------------- Generic Swatch Step (Photorealistic CSS) -------------------- */
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
  colors: { id: number; name: string; hex: string; threadHex?: string; swatchUrl: string }[]
  selected: number | undefined
  onSelect: (c: any) => void
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
          const hasDiamond = !!c.threadHex
          // Pure CSS photorealistic diamond stitching pattern
          const style = hasDiamond ? {
            backgroundColor: c.hex,
            backgroundImage: `linear-gradient(115deg, transparent 75%, ${c.threadHex} 75%, ${c.threadHex} 76%, transparent 76%), linear-gradient(245deg, transparent 75%, ${c.threadHex} 75%, ${c.threadHex} 76%, transparent 76%)`,
            backgroundSize: '24px 48px',
            backgroundPosition: 'center',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
          } : {
            backgroundColor: c.hex,
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)`,
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
          }

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
                    ? 'ring-white scale-105 shadow-[0_0_15px_rgba(255,255,255,0.4)] z-10'
                    : 'ring-white/10 hover:ring-white/30',
                ].join(' ')}
              >
                <div class="size-full transition-transform duration-700 group-hover:scale-110" style={style}></div>
                <div class="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />
                {active && (
                  <span class="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="drop-shadow">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                )}
              </div>
              <span class={['text-[11px] truncate w-full text-center', active ? 'text-white font-medium' : 'text-white/50 group-hover:text-white/80'].join(' ')}>
                {c.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* -------------------- Heel Pad Step (Photorealistic CSS) -------------------- */
function HeelPadStep({
  pads,
  selected,
  onSelect,
  heelPosition,
  onPositionChange,
  onContinue,
}: {
  pads: HeelPad[]
  selected: HeelPad | null
  onSelect: (p: HeelPad) => void
  heelPosition: HeelPosition
  onPositionChange: (p: HeelPosition) => void
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
          
          let patternStyle = {}
          if (p.slug.includes('karbon')) {
            patternStyle = {
              backgroundColor: p.textureHex,
              backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.2) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.2) 75%, rgba(0,0,0,0.2)), linear-gradient(45deg, rgba(0,0,0,0.2) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.2) 75%, rgba(0,0,0,0.2))',
              backgroundSize: '10px 10px',
              backgroundPosition: '0 0, 5px 5px',
              boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)'
            }
          } else if (p.slug.includes('noktali')) {
            patternStyle = {
              backgroundColor: p.textureHex,
              backgroundImage: 'radial-gradient(rgba(0,0,0,0.4) 15%, transparent 16%), radial-gradient(rgba(255,255,255,0.1) 15%, transparent 16%)',
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 4px 4px',
              boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)'
            }
          } else {
             patternStyle = {
               backgroundColor: p.textureHex,
               backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
               boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)'
             }
          }

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
                    ? 'ring-white scale-105 shadow-[0_0_15px_rgba(255,255,255,0.4)] z-10'
                    : 'ring-white/10 hover:ring-white/30',
                ].join(' ')}
              >
                <div class="size-full transition-transform duration-700 group-hover:scale-110" style={patternStyle}></div>
                <div class="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />
                {p.isStandard && (
                  <span class="absolute top-1.5 right-1.5 px-2 py-0.5 text-[9px] rounded-full bg-emerald-500/90 text-white font-semibold uppercase tracking-wider">
                    Standart
                  </span>
                )}
                {!p.isStandard && p.pricePremium > 0 && (
                  <span class="absolute top-1.5 right-1.5 px-2 py-0.5 text-[9px] rounded-full bg-black/80 backdrop-blur text-white font-semibold ring-1 ring-white/20">
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
              <span class={['text-[11px] truncate text-center w-full', active ? 'text-white font-medium' : 'text-white/50 group-hover:text-white/80'].join(' ')}>
                {p.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Konum: sürücü / yolcu / ikisi / yok */}
      <div class="mt-6">
        <div class="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold mb-2">Topukluk Konumu</div>
        <div class="grid grid-cols-2 gap-2">
          {([
            { v: 'driver-only', label: 'Sadece Sürücü', desc: 'Standart', extra: 0 },
            { v: 'passenger-only', label: 'Sadece Yolcu', desc: 'Yer değiştirir', extra: 0 },
            { v: 'both', label: 'Her İkisi', desc: '+₺100', extra: 100 },
            { v: 'none', label: 'İstemiyorum', desc: 'Düz paspas', extra: 0 },
          ] as const).map((opt) => {
            const active = heelPosition === opt.v
            return (
              <button
                key={opt.v}
                type="button"
                onClick={() => onPositionChange(opt.v)}
                class={[
                  'p-3 rounded-xl border text-left transition-all',
                  active
                    ? 'border-white bg-white/15 ring-2 ring-white/30'
                    : 'border-white/10 bg-white/5 hover:border-white/30',
                ].join(' ')}
              >
                <div class="text-sm font-semibold">{opt.label}</div>
                <div class={['text-[10px] mt-0.5', opt.extra > 0 ? 'text-amber-400' : 'text-white/50'].join(' ')}>
                  {opt.desc}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={!selected}
        class="mt-5 w-full px-5 py-2.5 rounded-lg text-sm font-semibold bg-white text-black hover:bg-white/90 disabled:opacity-30 transition-colors"
      >
        Devam et →
      </button>
    </div>
  )
}

/* -------------------- Logo step (per-mat picker) -------------------- */
const POSITION_LABELS: Record<MatPosition, string> = {
  driver: 'Sürücü',
  passenger: 'Yolcu',
  leftRear: 'Sol Arka',
  rightRear: 'Sağ Arka',
  trunk: 'Bagaj',
}
const PLACEMENT_LABELS: Record<LogoPlacement, string> = {
  top: 'Üst',
  middle: 'Orta',
  bottom: 'Alt',
}

function LogoStep({
  brand,
  product,
  matColor,
  borderColor,
  logos,
  onSetLogo,
  onSetPlacement,
  onApplyAll,
  onContinue,
}: {
  brand: Brand | null
  product: Product
  matColor: MatColor
  borderColor: BorderColor
  logos: MatLogoConfig[]
  onSetLogo: (position: MatPosition, brandSlug: string | null) => void
  onSetPlacement: (position: MatPosition, placement: LogoPlacement) => void
  onApplyAll: (brandSlug: string | null) => void
  onContinue: () => void
}) {
  const activePositions = positionsFor(product.parts, product.includesTrunk)
  const activeCount = logos.filter((l) => l.brandSlug !== null && activePositions.includes(l.position)).length
  const totalLogoCost = activeCount * 150

  return (
    <div>
      <header class="mb-5">
        <h2 class="font-display text-2xl font-semibold">Marka Amblemleri</h2>
        <p class="mt-2 text-sm text-white/60">
          Her paspasa ayrı amblem ve konum seçebilirsiniz. Paslanmaz çelik 3D plaka olarak monte edilir.
        </p>
      </header>

      {/* Hızlı işlem barı */}
      <div class="mb-4 flex items-center gap-2 flex-wrap">
        {brand && (
          <button
            type="button"
            onClick={() => onApplyAll(brand.slug)}
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/20"
          >
            ⚡ Tüm Paspaslara {brand.name}
          </button>
        )}
        <button
          type="button"
          onClick={() => onApplyAll(null)}
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
        >
          🚫 Hiçbirine Logo Yok
        </button>
        <span class="ml-auto text-[10px] text-white/50">
          {activeCount} amblem · {totalLogoCost > 0 ? `+${formatTRY(totalLogoCost)}` : 'Ücretsiz'}
        </span>
      </div>

      {/* Her aktif pozisyon için ayrı kart */}
      <div class="space-y-2">
        {activePositions.map((pos) => {
          const cfg = logos.find((l) => l.position === pos)
          const hasLogo = cfg?.brandSlug != null
          return (
            <div
              key={pos}
              class={[
                'p-3 rounded-xl border transition-all',
                hasLogo ? 'border-white/30 bg-white/5' : 'border-white/10 bg-black/30',
              ].join(' ')}
            >
              <div class="flex items-center gap-3">
                {/* Mini paspas önizleme */}
                <div class="size-12 shrink-0 rounded-lg overflow-hidden ring-1 ring-white/15 relative">
                  <img src={borderColor.swatchUrl} alt="" class="absolute inset-0 size-full object-cover" />
                  <div class="absolute inset-[14%] rounded-sm overflow-hidden">
                    <img src={matColor.swatchUrl} alt="" class="size-full object-cover" />
                  </div>
                  {hasLogo && brand && (
                    <div class="absolute inset-0 grid place-items-center">
                      <div class="size-5 grid place-items-center rounded-full bg-black/60 backdrop-blur ring-1 ring-white/30">
                        <ClientBrandLogo iconSlug={brand.iconSlug} logoUrl={brand.logoUrl} name={brand.name} size={10} color="#fff" />
                      </div>
                    </div>
                  )}
                </div>
                {/* Pozisyon adı */}
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold text-white">{POSITION_LABELS[pos]}</div>
                  <div class="text-[10px] text-white/50">
                    {hasLogo ? `${brand?.name ?? cfg?.brandSlug} amblem` : 'Logo yok'}
                  </div>
                </div>
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => onSetLogo(pos, hasLogo ? null : (brand?.slug ?? null))}
                  class={[
                    'px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors',
                    hasLogo ? 'bg-amber-500 text-black' : 'bg-white/10 text-white/70 hover:bg-white/15',
                  ].join(' ')}
                >
                  {hasLogo ? '✓ Eklendi' : '+ Ekle'}
                </button>
              </div>

              {/* Placement (sadece logo varsa) */}
              {hasLogo && (
                <div class="mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
                  <span class="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Konum:</span>
                  <div class="flex gap-1">
                    {(['top', 'middle', 'bottom'] as const).map((pl) => {
                      const isActive = cfg?.placement === pl
                      return (
                        <button
                          key={pl}
                          type="button"
                          onClick={() => onSetPlacement(pos, pl)}
                          class={[
                            'px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors',
                            isActive ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/15',
                          ].join(' ')}
                        >
                          {PLACEMENT_LABELS[pl]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onContinue}
        class="mt-6 w-full px-5 py-3 rounded-xl text-sm font-semibold bg-white hover:bg-white/90 text-black transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
      >
        Sipariş özetini gör →
      </button>
    </div>
  )
}

/* -------------------- Summary step -------------------- */
const HEEL_LABEL: Record<HeelPosition, string> = {
  'driver-only': 'Sadece sürücü',
  'passenger-only': 'Sadece yolcu',
  both: 'Sürücü + yolcu',
  none: 'Topukluk yok',
}

function SummaryStep({
  brand,
  model,
  product,
  matColor,
  borderColor,
  heelPad,
  heelPosition,
  logos,
  total,
  onAddToCart,
}: {
  brand: Brand
  model: VehicleModel
  product: Product
  matColor: MatColor
  borderColor: BorderColor
  heelPad: HeelPad
  heelPosition: HeelPosition
  logos: MatLogoConfig[]
  total: number
  onAddToCart: () => void
}) {
  const activePositions = positionsFor(product.parts, product.includesTrunk)
  const activeLogos = logos.filter((l) => l.brandSlug !== null && activePositions.includes(l.position))
  const logoSummary =
    activeLogos.length === 0
      ? 'Eklenmedi'
      : activeLogos.length === activePositions.length
      ? `Tüm paspaslar (${activePositions.length})`
      : activeLogos.map((l) => POSITION_LABELS[l.position]).join(', ')

  return (
    <div>
      <header class="mb-5">
        <h2 class="font-display text-2xl font-semibold">Paspasınız hazır.</h2>
        <p class="mt-2 text-sm text-white/60">
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
          value={`${heelPad.name} · ${HEEL_LABEL[heelPosition]}`}
          swatchUrl={heelPad.swatchUrl}
        />
        <Row label="Amblem" value={logoSummary} />
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
  const photorealisticImage = matColor?.previewUrl

  return (
    <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 overflow-hidden shadow-2xl shadow-black/40 group">
      <div class="relative aspect-[3/4] overflow-hidden">
        {/* Zemin sahne */}
        <div
          class="absolute inset-0 transition-opacity duration-1000"
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

        {photorealisticImage ? (
          <div class="absolute inset-x-2 top-2 bottom-2 mx-auto pointer-events-none flex items-center justify-center animate-in fade-in zoom-in duration-1000">
             <div class="relative w-full h-full rounded-xl overflow-hidden ring-1 ring-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                <img src={photorealisticImage} alt="Gerçekçi Paspas Önizlemesi" class="absolute inset-0 size-full object-cover scale-105 group-hover:scale-110 transition-transform duration-1000" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                
                {/* Dynamically overlay the chosen brand logo if selected */}
                {showLogo && brand && (
                  <div class="absolute bottom-6 left-1/2 -translate-x-1/2 size-16 grid place-items-center rounded-full bg-black/40 backdrop-blur-md ring-1 ring-white/30 shadow-[0_4px_20px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-4 fade-in duration-700">
                    <ClientBrandLogo
                      iconSlug={brand.iconSlug}
                      logoUrl={brand.logoUrl}
                      name={brand.name}
                      size={32}
                      color="#ffffff"
                    />
                  </div>
                )}
                
                <div class="absolute top-4 left-0 w-full text-center pointer-events-none">
                   <span class="inline-block px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-[10px] font-semibold text-white/90 tracking-[0.2em] uppercase border border-white/10">
                     Foto-Realistik Önizleme
                   </span>
                </div>
             </div>
          </div>
        ) : (
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
        )}

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
            logoUrl={brand.logoUrl}
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
