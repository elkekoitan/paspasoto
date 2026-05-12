import { useEffect, useMemo, useState } from 'preact/hooks'
import {
  BRANDS,
  VEHICLE_MODELS,
  MAT_COLORS,
  BORDER_COLORS,
  HEEL_PADS,
  LOGO_ACCESSORIES,
  MAT_TEXTURES,
  EMBLEM_TYPES,
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
  type MatTexture,
  type EmblemType,
  type Product,
} from '../../lib/catalog'
import { getTrimsForModel, FUEL_LABEL, TRANSMISSION_LABEL } from '../../lib/catalog-trims'
import { buildHelpRequestUrl } from '../../lib/whatsapp'
import { formatTRY } from '../../lib/format'
import ClientBrandLogo from '../ui/ClientBrandLogo'
import VirtualShowroom from './VirtualShowroom'
import LivePreview from './preview/LivePreview'

/** Product slug → asset set slug mapping (gerçek EVA paspas fotoğraf adları) */
function productToSetSlug(productSlug?: string): string {
  if (!productSlug) return 'classic-paw-full'
  if (productSlug.includes('surucu') || productSlug.includes('on') || productSlug.includes('front')) return 'classic-paw-front'
  return 'classic-paw-full'
}

/** EmblemType slug → asset dir slug ('metal' | 'premium') */
function emblemSlugToDir(emblemSlug?: string): 'metal' | 'premium' {
  if (!emblemSlug) return 'metal'
  return emblemSlug.startsWith('premium') ? 'premium' : 'metal'
}

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
 * Konfigüratör her ziyarette sıfırdan başlar — "kaldığın yerden devam"
 * özelliği kullanıcı geri bildirimi üzerine kaldırıldı. Eski localStorage
 * key'leri ilk mount'ta temizlenir (cleanupStaleDrafts).
 */
const LEGACY_KEYS = [
  'carmat-config-draft-v3',
  'carmat-config-draft-v2',
  'carmat-config-draft',
  'carmat-seat-draft-v1',
  'carmat-steering-draft-v1',
]

function cleanupStaleDrafts() {
  if (typeof window === 'undefined') return
  try {
    for (const k of LEGACY_KEYS) localStorage.removeItem(k)
  } catch {}
}

/** Paspas pozisyonu — araç içinde hangi paspas */
export type MatPosition = 'driver' | 'passenger' | 'leftRear' | 'rightRear' | 'trunk'
/** Logo'nun paspas üzerindeki yerleşimi */
/**
 * Logo placement 3×3 grid — 9 pozisyon.
 * Backward compat: eski 'top'/'middle'/'bottom' = '*-center' alias.
 */
export type LogoPlacement =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'top' | 'middle' | 'bottom'  // legacy alias
/** Topukluk konum tercihi */
export type HeelPosition = 'driver-only' | 'passenger-only' | 'both' | 'none'

/** Logo yönlendirmesi — yatay (default) veya dikey (90° rotated) */
export type LogoOrientation = 'horizontal' | 'vertical'

/** Bir paspas pozisyonu için logo konfigürasyonu */
export type MatLogoConfig = {
  position: MatPosition
  brandSlug: string | null   // null = bu paspasta logo yok
  placement: LogoPlacement
  orientation?: LogoOrientation
}

/** Set parts → o set için pozisyon listesi */
function positionsFor(parts: number, includesTrunk: boolean): MatPosition[] {
  const out: MatPosition[] = ['driver', 'passenger']
  if (parts >= 4) out.push('leftRear', 'rightRear')
  if (includesTrunk) out.push('trunk')
  return out
}

export default function Configurator() {
  // Her ziyarette sıfırdan — kalmış localStorage key'lerini temizle
  useEffect(() => { cleanupStaleDrafts() }, [])

  const [step, setStep] = useState<StepKey>('brand')
  const [brand, setBrand] = useState<Brand | null>(null)
  const [model, setModel] = useState<VehicleModel | null>(null)
  const [trim, setTrim] = useState<VehicleTrim | null>(null)
  const [product, setProduct] = useState<Product | null>(PRODUCTS[1]!)
  const [matColor, setMatColor] = useState<MatColor | null>(MAT_COLORS[0]!)
  const [borderColor, setBorderColor] = useState<BorderColor | null>(BORDER_COLORS[13]!)
  const [heelPad, setHeelPad] = useState<HeelPad | null>(HEEL_PADS[0]!)
  const [heelPosition, setHeelPosition] = useState<HeelPosition>('driver-only')
  const [logos, setLogos] = useState<MatLogoConfig[]>(
    (['driver', 'passenger', 'leftRear', 'rightRear', 'trunk'] as MatPosition[]).map((p) => ({
      position: p,
      brandSlug: null,
      placement: 'top',
    })),
  )
  const [texture, setTexture] = useState<MatTexture>(MAT_TEXTURES[0]!)
  const [emblemType, setEmblemType] = useState<EmblemType>(EMBLEM_TYPES[0]!)
  const [search, setSearch] = useState('')

  function resetDraft() {
    if (!confirm('Tüm seçimleriniz silinip baştan başlanacak. Emin misiniz?')) return
    cleanupStaleDrafts()
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
  const setOrientationFor = (position: MatPosition, orientation: LogoOrientation) =>
    setLogos((prev) => prev.map((l) => (l.position === position ? { ...l, orientation } : l)))
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
    // Logo: her aktif (brandSlug != null) pozisyon için +150₺ (premium-leather) / +250₺ (metal-plate)
    const activePositions = positionsFor(product?.parts ?? 0, !!product?.includesTrunk)
    const logoCount = logos.filter(
      (l) => l.brandSlug !== null && activePositions.includes(l.position),
    ).length
    const logoUnit = 150 + (emblemType?.pricePremium ?? 0)
    total += logoCount * logoUnit
    // Mat doku premium (Diamond varsayılan, ek ücret yok)
    total += texture?.pricePremium ?? 0
    return total
  }, [product, heelPad, heelPosition, logos, texture, emblemType])

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
  const [showMobilePreview, setShowMobilePreview] = useState(false)

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

  async function capturePreview(): Promise<string | null> {
    if (typeof window === 'undefined') return null
    const el = document.getElementById('configurator-preview')
    if (!el) return null
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(el, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      })
      return canvas.toDataURL('image/png')
    } catch {
      return null
    }
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
      const previewImageData = await capturePreview()
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
        ...(previewImageData ? { previewImageData } : {}),
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
        // Talep oluştuktan sonra varsa kalmış key'leri temizle
        cleanupStaleDrafts()
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
        
        {/* Mobile-only compact preview chip — tıklayınca fullscreen preview açar */}
        {matColor && borderColor && (
          <button
            type="button"
            onClick={() => setShowMobilePreview(true)}
            class="md:hidden absolute top-16 inset-x-4 z-30 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-500 active:scale-[0.98] transition-transform"
            aria-label="Tasarım önizlemesini aç"
          >
            <div class="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-2xl">
              <div class="flex -space-x-2">
                <span class="size-7 rounded-full ring-2 ring-black/40" style={`background-color: ${matColor.hex};`}></span>
                <span class="size-7 rounded-full ring-2 ring-black/40" style={`background-color: ${borderColor.hex};`}></span>
                {brand && (
                  <span class="size-7 rounded-full bg-white/95 grid place-items-center ring-2 ring-black/40 overflow-hidden">
                    <ClientBrandLogo iconSlug={brand.iconSlug} logoUrl={brand.logoUrl} name={brand.name} size={16} color="#000" />
                  </span>
                )}
              </div>
              <div class="flex-1 min-w-0 text-left">
                <div class="text-[10px] text-white/60 leading-tight">🔍 Tasarımı Gör</div>
                <div class="text-xs text-white font-semibold leading-tight truncate">
                  {matColor.name} + {borderColor.name}
                  {brand && model && <span class="text-white/60"> · {brand.name} {model.name}</span>}
                </div>
              </div>
              <div class="text-right shrink-0">
                <div class="text-[10px] text-white/60 leading-tight">Fiyat</div>
                <div class="text-sm font-display font-bold text-[var(--color-primary)] leading-tight tabular-nums">{formatTRY(totalPrice)}</div>
              </div>
            </div>
          </button>
        )}

        {/* Mobile fullscreen preview overlay — chip tıklanırsa açılır */}
        {showMobilePreview && matColor && borderColor && heelPad && product && (
          <div
            class="md:hidden fixed inset-0 z-[200] bg-black/90 backdrop-blur-md pointer-events-auto overflow-y-auto p-4 animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === e.currentTarget) setShowMobilePreview(false) }}
          >
            <div class="max-w-md mx-auto pt-4 pb-20">
              <button
                type="button"
                onClick={() => setShowMobilePreview(false)}
                class="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold mb-3"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                Kapat
              </button>
              <LivePreview
                setSlug={productToSetSlug(product?.slug)}
                textureSlug="diamond"
                matColorSlug={matColor?.slug ?? 'siyah'}
                matColorHex={matColor?.hex}
                borderHex={borderColor?.hex ?? '#15151a'}
                heelSlug={heelPad ? `heel-${heelPad.slug}` : null}
                heelPosition={heelPosition}
                logos={logos}
                emblemType={emblemSlugToDir(emblemType?.slug)}
                vehicleLabel={brand && model ? `${brand.name} ${model.name}` : undefined}
              />
            </div>
          </div>
        )}

        {/* Left Side: Configuration Steps */}
        <div class="w-full md:w-[460px] h-full flex flex-col justify-end md:justify-center pointer-events-auto mt-16 md:mt-0">
           {/* Glassmorphic Panel */}
           <div class="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col max-h-[85vh]">
              <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
              
              <div class="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar relative z-10">
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

                {/* key={step} — Preact reconciliation'ın step değişimde DOM nodes'larını
                  yeniden kullanmasını engeller (parent class diff bug fix) */}
                <div key={step} class="animate-in slide-in-from-left-4 fade-in duration-500">
                  {step === 'brand' && <BrandStep brands={filteredBrands} selected={brand} onSelect={(b) => { setBrand(b); setModel(null); setStep('model'); }} search={search} onSearchChange={setSearch} />}
                  {step === 'model' && brand && <ModelStep brand={brand} models={models} selected={model} selectedTrim={trim} onSelect={(m, t) => { setModel(m); setTrim(t ?? null); setStep('product'); }} onBack={() => setStep('brand')} />}
                  {step === 'product' && <ProductStep products={PRODUCTS} selected={product} onSelect={(p) => { setProduct(p); setStep('mat'); }} />}
                  {step === 'mat' && (
                    <SwatchStep title="Paspas Zemin Rengi" description="Paspasın havuzlu kısmının zemin rengi. Tüm paspaslar Diamond (Elmas) dokuyla üretilir." colors={MAT_COLORS} selected={matColor?.id} onSelect={(c) => { setMatColor(c); setStep('border'); }} />
                  )}
                  {step === 'border' && <SwatchStep title="Kenarlık Rengi" description="Paspasın çevresini saran biye/kenarlık şeridi." colors={BORDER_COLORS} selected={borderColor?.id} onSelect={(c) => { setBorderColor(c); setStep('heel'); }} big={false} />}
                  {step === 'heel' && <HeelPadStep pads={HEEL_PADS} selected={heelPad} onSelect={setHeelPad} heelPosition={heelPosition} onPositionChange={setHeelPosition} onContinue={() => setStep('logo')} />}
                  {step === 'logo' && (
                    <>
                      {/* Emblem tipi chip row — Premium deri vs Metal plaka */}
                      <div class="mb-5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <div class="flex items-center gap-2 mb-2.5">
                          <span class="text-[11px] uppercase tracking-[0.2em] text-[var(--color-primary)] font-bold">Emblem Tipi</span>
                          <span class="text-[10px] text-white/45">— Marka logosu taban</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                          {EMBLEM_TYPES.map((e) => (
                            <button
                              key={e.slug}
                              type="button"
                              onClick={() => setEmblemType(e)}
                              class={[
                                'relative rounded-lg border-2 p-2.5 text-left transition-all overflow-hidden',
                                emblemType.slug === e.slug
                                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-[var(--shadow-glow)]'
                                  : 'border-white/10 hover:border-white/30 bg-white/[0.02]',
                              ].join(' ')}
                            >
                              {/* Plaka mini önizleme */}
                              <div
                                class="absolute right-2 top-1/2 -translate-y-1/2 w-14 h-7 rounded-sm flex items-center justify-center text-[8px] font-bold tracking-widest"
                                style={`background-color: ${e.baseHex}; color: ${e.engraveHex}; box-shadow: inset 0 0 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3);`}
                              >
                                {brand?.name?.toUpperCase()?.slice(0, 4) ?? 'LOGO'}
                              </div>
                              <div class="relative pr-16">
                                <div class="text-[13px] font-bold text-white">{e.name}</div>
                                <div class="text-[10px] text-white/60 leading-tight mt-0.5">{e.description}</div>
                                {e.pricePremium > 0 && (
                                  <div class="text-[10px] text-[var(--color-primary)] font-bold mt-1">+{formatTRY(e.pricePremium)} / adet</div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <LogoStep
                        brand={brand}
                        product={product!}
                        matColor={matColor!}
                        borderColor={borderColor!}
                        logos={logos}
                        onSetLogo={setLogoFor}
                        onSetPlacement={setPlacementFor}
                        onSetOrientation={setOrientationFor}
                        onApplyAll={applyLogoToAll}
                        onContinue={() => setStep('summary')}
                      />
                    </>
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
                <div class="mt-auto p-4 md:p-6 border-t border-white/10 bg-black/20 relative z-10 space-y-2.5">
                  <div class="flex items-center justify-between gap-2">
                    <button type="button" onClick={prev} disabled={step === 'brand'} class="px-5 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors backdrop-blur-md">
                      ← Geri
                    </button>
                    <button type="button" onClick={next} disabled={!canNext} class="px-6 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:bg-white/90 disabled:opacity-30 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                      Devam →
                    </button>
                  </div>
                  {/* "Emin Değilim" — atölyeye WhatsApp ile mevcut konfigürasyonu gönder */}
                  <a
                    href={buildHelpRequestUrl({
                      brandName: brand?.name,
                      modelName: model?.name,
                      modelChassis: model?.chassisCode,
                      productName: product?.name,
                      matColorName: matColor?.name,
                      borderColorName: borderColor?.name,
                      heelName: heelPad?.name,
                      totalPrice,
                    })}
                    target="_blank"
                    rel="noopener"
                    class="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold text-emerald-300/80 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.16 5.335 5.495 0 12.05 0c3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414 0 6.557-5.336 11.892-11.893 11.892-1.99 0-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                    🤔 Emin değilim — atölyeden tavsiye iste
                  </a>
                </div>
              )}
           </div>
        </div>

        {/* Right Side: Live Preview + Price HUD */}
        <div class="hidden md:flex flex-col justify-between items-end flex-1 py-8 pointer-events-auto gap-6">
           {/* Canlı paspas önizlemesi — mat color seçildiyse görünür */}
           {matColor && borderColor && heelPad && product && (
             <div class="w-full max-w-[360px] animate-in slide-in-from-right-8 fade-in duration-700">
               <LivePreview
                 setSlug={productToSetSlug(product?.slug)}
                 textureSlug="diamond"
                 matColorSlug={matColor?.slug ?? 'siyah'}
                 matColorHex={matColor?.hex}
                 borderHex={borderColor?.hex ?? '#15151a'}
                 heelSlug={heelPad ? `heel-${heelPad.slug}` : null}
                 heelPosition={heelPosition}
                 logos={logos}
                 emblemType={emblemSlugToDir(emblemType?.slug)}
                 vehicleLabel={brand && model ? `${brand.name} ${model.name}` : undefined}
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
    <div class="flex flex-wrap items-center gap-1.5 pb-1">
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
            title={s.label}
            class={[
              'shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border',
              active && 'bg-[var(--color-primary)] text-[var(--color-bg)] border-[var(--color-primary)] shadow-sm',
              !active && passed && 'bg-white/8 text-white/95 border-white/15 hover:bg-white/15',
              !active && !passed && 'bg-white/5 text-white/55 border-white/10 hover:text-white/80',
              !reachable && 'opacity-40 cursor-not-allowed',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span class={[
              'size-4 grid place-items-center rounded-full text-[9px] font-bold',
              active ? 'bg-[var(--color-bg)]/25 text-[var(--color-bg)]' : passed ? 'bg-white/15 text-white/95' : 'bg-white/8 text-white/60',
            ].join(' ')}>
              {passed ? '✓' : i + 1}
            </span>
            <span class={active ? 'inline' : 'hidden md:inline'}>{s.label}</span>
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
  // Popüler markaları üstte göster (search aktif değilse)
  const popular = brands.filter((b) => b.popular)
  const others = brands.filter((b) => !b.popular)
  const showSections = search.trim() === ''

  return (
    <div>
      <header class="mb-5">
        <h2 class="font-display text-xl font-semibold">Aracının markası</h2>
        <p class="mt-1 text-sm text-[var(--color-text-muted)]">
          Markanı seç — Türkiye'de satılan {brands.length} marka. Listede yoksa{' '}
          <a href="https://wa.me/905545417561" class="text-[var(--color-primary)] underline-offset-2 hover:underline">WhatsApp'tan</a> iletin.
        </p>
      </header>

      <div class="relative mb-5">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          placeholder="Marka ara... (BMW, Tesla, Renault...)"
          value={search}
          onInput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
          class="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm"
        />
      </div>

      {showSections && popular.length > 0 && (
        <div class="mb-5">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)] font-bold">⭐ Popüler</span>
            <div class="flex-1 h-px bg-gradient-to-r from-[var(--color-primary)]/30 to-transparent"></div>
          </div>
          <BrandGrid brands={popular} selected={selected} onSelect={onSelect} />
        </div>
      )}

      {showSections && others.length > 0 && (
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Diğer Markalar</span>
            <div class="flex-1 h-px bg-white/10"></div>
          </div>
          <BrandGrid brands={others} selected={selected} onSelect={onSelect} />
        </div>
      )}

      {!showSections && (
        <BrandGrid brands={brands} selected={selected} onSelect={onSelect} />
      )}

      {brands.length === 0 && (
        <div class="p-6 rounded-lg bg-[var(--color-surface-2)] text-sm text-[var(--color-text-muted)] text-center">
          "{search}" araması için marka bulunamadı.
        </div>
      )}
    </div>
  )
}

/** Marka kart grid'i — premium kart tasarımı: brand color radial gradient bg + büyük logo */
function BrandGrid({
  brands,
  selected,
  onSelect,
}: {
  brands: Brand[]
  selected: Brand | null
  onSelect: (b: Brand) => void
}) {
  return (
    <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {brands.map((b) => {
        const active = selected?.id === b.id
        const brandColor = b.color || '#444'
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onSelect(b)}
            class={[
              'aspect-square rounded-2xl border-2 transition-all relative overflow-hidden group',
              active
                ? 'border-[var(--color-primary)] shadow-[var(--shadow-glow)] -translate-y-1 scale-[1.02]'
                : 'border-white/10 hover:border-white/30 hover:-translate-y-0.5',
            ].join(' ')}
            aria-label={b.name}
          >
            {/* Brand color radial gradient background */}
            <div
              class={['absolute inset-0 transition-opacity', active ? 'opacity-25' : 'opacity-10 group-hover:opacity-20'].join(' ')}
              style={`background: radial-gradient(circle at 50% 30%, ${brandColor}, transparent 70%);`}
            />
            {/* Glassmorphic overlay */}
            <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            {/* Active indicator (köşe rozet) */}
            {active && (
              <div class="absolute top-1.5 right-1.5 size-5 grid place-items-center rounded-full bg-[var(--color-primary)] text-[var(--color-bg)] z-10">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
            )}
            <div class="relative h-full flex flex-col items-center justify-center gap-2 p-3 z-10">
              <div class="grid place-items-center size-16 sm:size-20 rounded-xl bg-white/95 ring-1 ring-white/40 shadow-lg shadow-black/40 p-2 group-hover:scale-105 transition-transform">
                <ClientBrandLogo
                  iconSlug={b.iconSlug}
                  name={b.name}
                  size={56}
                  color={brandColor}
                  logoUrl={b.logoUrl}
                  className="size-full object-contain"
                />
              </div>
              <span class={['font-display font-semibold text-[11px] sm:text-xs leading-none truncate w-full text-center', active ? 'text-white' : 'text-white/80'].join(' ')}>
                {b.name}
              </span>
            </div>
          </button>
        )
      })}
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
                  'aspect-[4/3] w-full rounded-xl ring-2 transition-all relative overflow-hidden bg-[var(--color-surface)]',
                  active
                    ? 'ring-white scale-105 shadow-[0_0_15px_rgba(255,255,255,0.4)] z-10'
                    : 'ring-white/10 hover:ring-white/30',
                ].join(' ')}
              >
                {/* Gerçek EVA paspas swatch foto */}
                <img
                  src={c.swatchUrl}
                  alt={c.name}
                  loading="lazy"
                  decoding="async"
                  class="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    // Foto yoksa düz renk
                    const el = e.currentTarget as HTMLImageElement
                    el.style.display = 'none'
                    ;(el.parentElement as HTMLElement).style.backgroundColor = c.hex
                  }}
                />
                <div class="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/5 pointer-events-none" />
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
  'top-left': 'Üst Sol',
  'top-center': 'Üst Orta',
  'top-right': 'Üst Sağ',
  'middle-left': 'Orta Sol',
  'middle-center': 'Orta',
  'middle-right': 'Orta Sağ',
  'bottom-left': 'Alt Sol',
  'bottom-center': 'Alt Orta',
  'bottom-right': 'Alt Sağ',
  // Legacy alias (eski draft'lar için)
  top: 'Üst Orta',
  middle: 'Orta',
  bottom: 'Alt Orta',
}

/** Logo placement → CSS top/left % değerleri (Preview component için) */
export const PLACEMENT_COORDS: Record<LogoPlacement, { top: string; left: string }> = {
  'top-left':      { top: '20%', left: '25%' },
  'top-center':    { top: '20%', left: '50%' },
  'top-right':     { top: '20%', left: '75%' },
  'middle-left':   { top: '50%', left: '25%' },
  'middle-center': { top: '50%', left: '50%' },
  'middle-right':  { top: '50%', left: '75%' },
  'bottom-left':   { top: '80%', left: '25%' },
  'bottom-center': { top: '80%', left: '50%' },
  'bottom-right':  { top: '80%', left: '75%' },
  // Legacy
  top:    { top: '20%', left: '50%' },
  middle: { top: '50%', left: '50%' },
  bottom: { top: '80%', left: '50%' },
}

/** 9-yön grid için sırayla pozisyonlar (UI picker için) */
const PLACEMENT_GRID: LogoPlacement[] = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'middle-center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
]

function LogoStep({
  brand,
  product,
  matColor,
  borderColor,
  logos,
  onSetLogo,
  onSetPlacement,
  onSetOrientation,
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
  onSetOrientation: (position: MatPosition, orientation: LogoOrientation) => void
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
                <div class="mt-2 pt-2 border-t border-white/10 space-y-2.5">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-1">Logo Konumu</div>
                      <div class="text-[11px] text-white/70 font-medium">
                        {cfg?.placement ? (PLACEMENT_LABELS[cfg.placement] ?? 'Üst Orta') : 'Üst Orta'}
                      </div>
                    </div>
                    {/* 3x3 grid picker — paspas yüzeyini temsil eder */}
                    <div class="shrink-0">
                      <div class="grid grid-cols-3 gap-0.5 p-1.5 rounded-lg bg-white/5 border border-white/10" style="width: 64px; height: 64px;">
                        {PLACEMENT_GRID.map((pl) => {
                          const currentPlacement = cfg?.placement ?? 'top-center'
                          const normalized = currentPlacement === 'top' ? 'top-center'
                            : currentPlacement === 'middle' ? 'middle-center'
                            : currentPlacement === 'bottom' ? 'bottom-center'
                            : currentPlacement
                          const isActive = normalized === pl
                          return (
                            <button
                              key={pl}
                              type="button"
                              onClick={() => onSetPlacement(pos, pl)}
                              title={PLACEMENT_LABELS[pl]}
                              aria-label={PLACEMENT_LABELS[pl]}
                              class={[
                                'rounded-sm transition-all',
                                isActive
                                  ? 'bg-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/40'
                                  : 'bg-white/10 hover:bg-white/25',
                              ].join(' ')}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Logo yönü — yatay/dikey toggle */}
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Yön</span>
                    <div class="flex gap-1 p-0.5 rounded-lg bg-white/5 border border-white/10">
                      {(['horizontal', 'vertical'] as const).map((or) => {
                        const isActive = (cfg?.orientation ?? 'horizontal') === or
                        return (
                          <button
                            key={or}
                            type="button"
                            onClick={() => onSetOrientation(pos, or)}
                            class={[
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors',
                              isActive ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'text-white/60 hover:text-white',
                            ].join(' ')}
                          >
                            {or === 'horizontal' ? (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="9" width="18" height="6" rx="1" /></svg>
                                Yatay
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="3" width="6" height="18" rx="1" /></svg>
                                Dikey
                              </>
                            )}
                          </button>
                        )
                      })}
                    </div>
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

      {/* Güven artırıcı trust badges — section tag ile Preact reconciliation'ı
       * div diff bug'ından korunur (key={step} de çalışmadığı için tag farkı zorla). */}
      <section
        class="mt-5"
        style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem;"
      >
        {[
          { icon: '🛡️', label: '2 Yıl Garanti', sub: 'Üretici güvencesi' },
          { icon: '🚚', label: 'Kargo Dahil', sub: 'Tüm Türkiye' },
          { icon: '⏱️', label: '5–7 İş Günü', sub: 'Aynı gün üretim' },
          { icon: '↩️', label: '14 Gün İade', sub: 'Beğenmezsen iade' },
        ].map((b) => (
          <article class="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
            <div class="text-[20px] leading-none mb-1">{b.icon}</div>
            <div class="text-[11px] font-semibold text-white">{b.label}</div>
            <div class="text-[9px] text-white/50 mt-0.5 leading-tight">{b.sub}</div>
          </article>
        ))}
      </section>

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

      {/* Üretim timeline — sipariş yolculuğu görseli */}
      <div class="mt-5 pt-4 border-t border-white/5">
        <div class="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold mb-3 text-center">
          Sipariş yolculuğu
        </div>
        <ol
          class="text-center"
          style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0.25rem;"
        >
          {[
            { step: '1', label: 'Onay', sub: 'Bugün', dot: 'bg-[var(--color-primary)]' },
            { step: '2', label: 'Üretim', sub: 'Aynı gün', dot: 'bg-white/30' },
            { step: '3', label: 'Kalite', sub: '3. gün', dot: 'bg-white/30' },
            { step: '4', label: 'Kargo', sub: '5. gün', dot: 'bg-white/30' },
            { step: '5', label: 'Teslim', sub: '7. gün', dot: 'bg-white/30' },
          ].map((s, i, arr) => (
            <li class="relative">
              {i < arr.length - 1 && (
                <span class="absolute top-1.5 left-1/2 w-full h-px bg-white/10" aria-hidden="true" />
              )}
              <span class={`relative inline-block size-3 rounded-full ${s.dot} ring-2 ring-[var(--color-bg)]`} />
              <div class="text-[10px] font-semibold text-white mt-1.5">{s.label}</div>
              <div class="text-[9px] text-white/45 leading-tight">{s.sub}</div>
            </li>
          ))}
        </ol>
      </div>

      <p class="mt-4 text-[10px] text-[var(--color-text-muted)] text-center">
        ✓ Sipariş onayından sonra atölyemiz aynı gün üretime başlar
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

