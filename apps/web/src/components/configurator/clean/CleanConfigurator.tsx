/**
 * CleanConfigurator — Ultra-Premium Carmat paspas configurator.
 * 
 * Luxury Automotive UI with deep glassmorphism, glowing amber accents, 
 * sleek animations, and highly premium typography mimicking Porsche/Aston Martin.
 */
import { useState, useEffect } from 'preact/hooks'
import type { Product, MatColor, BorderColor, Brand, VehicleModel } from '../../../lib/catalog'
import { PRODUCTS, MAT_COLORS, BORDER_COLORS, BRANDS, VEHICLE_MODELS } from '../../../lib/catalog'
import { Check, ChevronRight, User, Phone, MapPin, Layers, Palette, Columns, ArrowRight, Star, ShieldCheck } from 'lucide-preact'

import LayoutStep from './LayoutStep'
import MatColorStep from './MatColorStep'
import BorderColorStep from './BorderColorStep'
import MatPreview from './MatPreview'

type Step = 'layout' | 'mat' | 'border' | 'extras' | 'summary'

const STEPS: { key: Step; label: string; icon: any }[] = [
  { key: 'layout', label: 'Paspas Seti', icon: Layers },
  { key: 'mat', label: 'Zemin Rengi', icon: Palette },
  { key: 'border', label: 'Kenarlık', icon: Columns },
  { key: 'extras', label: 'Ekstralar', icon: Star },
  { key: 'summary', label: 'Teklif Al', icon: Check },
]

type Props = {
  initialBrandSlug?: string
  initialModelSlug?: string
}

export default function CleanConfigurator({ initialBrandSlug, initialModelSlug }: Props) {
  const initialBrand = initialBrandSlug ? BRANDS.find((b) => b.slug === initialBrandSlug) ?? null : null
  const initialModel = initialBrand && initialModelSlug ? VEHICLE_MODELS.find((m) => m.brandSlug === initialBrand.slug && m.slug === initialModelSlug) ?? null : null

  const [brand] = useState<Brand | null>(initialBrand)
  const [model] = useState<VehicleModel | null>(initialModel)

  const [product, setProduct] = useState<Product>(PRODUCTS[1])
  const [matColor, setMatColor] = useState<MatColor>(MAT_COLORS[0])
  const [borderColor, setBorderColor] = useState<BorderColor>(BORDER_COLORS[13])
  const [hasLogo, setHasLogo] = useState(true)
  const [hasHeelPad, setHasHeelPad] = useState(true)

  // Drag and drop overlay coordinates for production
  const [overlayCoords, setOverlayCoords] = useState<Record<string, {x: number, y: number, rot: number}>>({})

  const [step, setStep] = useState<Step>('layout')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ orderNo: string; accessToken: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const total = product.basePrice

  async function submit(e: Event) {
    e.preventDefault()
    if (!name || !phone) {
      setError('Lütfen adınızı ve telefon numaranızı eksiksiz giriniz.')
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
          shippingAddress: { fullName: name, phone, city: city || 'Belirtilmedi', district: '-', addressLine: '-' },
          items: [{
            category: 'mat', brandSlug: brand?.slug ?? 'unknown', brandName: brand?.name ?? 'Belirtilmedi',
            modelSlug: model?.slug ?? 'unknown', modelName: model?.name ?? 'Belirtilmedi',
            modelChassis: model?.chassisCode ?? '', productSlug: product.slug, productName: product.name,
            productParts: product.parts, matSlug: matColor.slug, matName: matColor.name,
            matSwatchUrl: matColor.swatchUrl, borderSlug: borderColor.slug, borderName: borderColor.name,
            borderSwatchUrl: borderColor.swatchUrl, heelSlug: 'standart', heelName: 'Standart',
            heelSwatchUrl: '/assets/heel-pads/heel-standart.webp', heelPosition: 'driver-only',
            heelPadPassenger: false, logoBrandSlug: null, logoQty: 0, logos: [], qty: 1, unitPrice: total,
            productionCoordinates: overlayCoords // Send the final dragged coordinates to the backend
          }],
          subtotal: total, total,
        }),
      })
      if (!res.ok) throw new Error('Sunucu hatası, lütfen daha sonra tekrar deneyiniz.')
      const data = await res.json()
      setResult({ orderNo: data.orderNo, accessToken: data.accessToken })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div class="min-h-screen bg-black text-white grid place-items-center px-4 font-sans selection:bg-amber-500/30 overflow-hidden relative">
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/20 via-black to-black" />
        <div class="max-w-md w-full animate-in zoom-in-95 duration-1000 ease-out text-center space-y-8 p-12 rounded-[2rem] bg-white/[0.01] border border-white/5 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] relative z-10">
          <div class="mx-auto size-24 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 grid place-items-center shadow-[0_0_50px_rgba(245,158,11,0.3)] relative">
            <Check class="size-10 text-black stroke-[3]" />
          </div>
          <div>
            <h1 class="text-3xl font-light tracking-tight text-white mb-3">Talebiniz Alındı</h1>
            <p class="text-white/50 font-light leading-relaxed">Özel üretim atölyemiz sipariş detaylarınızı inceleyip sizinle en kısa sürede iletişime geçecek.</p>
          </div>
          <div class="rounded-2xl bg-white/[0.02] border border-white/10 p-6 text-left space-y-4 backdrop-blur-md">
            <div class="flex justify-between items-center pb-4 border-b border-white/5">
              <span class="text-white/40 text-xs font-semibold uppercase tracking-[0.2em]">Sipariş No</span>
              <span class="font-mono text-sm font-medium text-amber-400/90 tracking-wider">{result.orderNo}</span>
            </div>
            <div class="flex justify-between items-center pt-2">
              <span class="text-white/40 text-xs font-semibold uppercase tracking-[0.2em]">Toplam</span>
              <span class="font-light text-2xl tracking-tighter text-white">{total.toLocaleString('tr-TR')} ₺</span>
            </div>
          </div>
          <a href={`/siparis-takip/detay?o=${result.orderNo}&t=${result.accessToken}`} class="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-white hover:bg-stone-200 text-black font-semibold tracking-widest uppercase text-xs py-5 transition-all duration-500 hover:scale-[1.02] shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            <span>Siparişi Takip Et</span>
            <ArrowRight class="size-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div class={`min-h-screen bg-[#020202] text-stone-200 font-sans selection:bg-amber-500/30 transition-opacity duration-1000 overflow-x-hidden ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Full Screen Immersive Background Preview */}
      <MatPreview 
        product={product} matColor={matColor} borderColor={borderColor} 
        hasLogo={hasLogo} hasHeelPad={hasHeelPad} 
        onCoordinatesChange={setOverlayCoords} 
      />

      {/* Floating Foreground Content */}
      <div class="relative z-10 flex flex-col min-h-screen pointer-events-none">

      {/* Top Bar: Logo & Price */}
      <div class="absolute top-0 inset-x-0 p-8 flex items-start justify-between pointer-events-none z-50">
        <a href="/" class="flex items-center gap-4 group cursor-pointer pointer-events-auto transition-transform hover:scale-105 duration-300">
          <div class="relative bg-black/60 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <img src="/logo.png" alt="Carmat" class="h-8 w-auto object-contain drop-shadow-2xl" />
          </div>
        </a>

        <div class="text-right bg-black/60 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] pointer-events-auto">
          <div class="text-[10px] text-white/50 uppercase tracking-[0.4em] font-bold mb-1">Toplam Tutar</div>
          <div class="text-3xl font-bold tracking-tighter text-white drop-shadow-2xl">{total.toLocaleString('tr-TR')} <span class="text-amber-500 text-xl">₺</span></div>
        </div>
      </div>

      {/* Floating Stepper Island */}
      <div class="absolute top-8 inset-x-0 z-50 flex justify-center pointer-events-none">
        <div class="pointer-events-auto flex items-center justify-between relative bg-[#0a0a0a]/80 backdrop-blur-3xl px-12 py-4 rounded-[3rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] min-w-[700px]">
          <div class="absolute left-16 right-16 top-1/2 -translate-y-1/2 h-[2px] bg-white/[0.05] z-0" />
          {STEPS.map((s, i) => {
            const active = s.key === step
            const done = STEPS.findIndex((x) => x.key === step) > i
            const Icon = s.icon
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setStep(s.key)}
                class="relative z-10 flex flex-col items-center gap-4 group outline-none"
              >
                <div class={`size-16 rounded-[1.25rem] flex items-center justify-center transition-all duration-700 ${active ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black scale-110 shadow-[0_0_50px_rgba(245,158,11,0.6)] border border-amber-300' :
                    done ? 'bg-white text-black hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.15)] border border-white/50' : 'bg-[#111] border border-white/10 text-white/30 hover:border-white/30 hover:text-white'
                  }`}>
                  <Icon class={`size-6 ${active || done ? 'stroke-[2.5]' : 'stroke-2'}`} />
                </div>
                <span class={`absolute -bottom-8 whitespace-nowrap text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-700 ${active ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]' : done ? 'text-white/90' : 'text-white/30'
                  }`}>
                  {s.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <main class="max-w-7xl w-full mx-auto px-6 max-md:px-0 py-12 max-md:py-0 flex-1 flex flex-col justify-center max-md:justify-end pointer-events-none mt-16 max-md:mt-0 z-50">
        
        {/* Responsive UI Panel (Bottom Sheet on Mobile, Floating Right on Desktop) */}
        <div class="w-full max-w-md ml-auto max-md:ml-0 max-md:max-w-full pointer-events-auto flex flex-col max-md:h-[60vh]">
          
          {brand && model && (
            <div class="mb-8 flex flex-col items-end text-right animate-in fade-in slide-in-from-right-8 duration-1000">
              <div class="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-black/40 border border-white/10 text-[9px] font-semibold tracking-[0.3em] uppercase text-white/50 mb-3 backdrop-blur-md">
                Konfigürasyon
              </div>
              <h3 class="text-3xl font-light tracking-tighter text-white drop-shadow-2xl">
                {brand.name} <span class="font-medium text-amber-500">{model.name}</span>
              </h3>
              {model.chassisCode && <p class="text-white/50 text-sm mt-1 tracking-[0.2em]">{model.chassisCode}</p>}
            </div>
          )}

          <div class="bg-[#050505]/70 max-md:bg-[#050505]/95 border border-white/[0.08] max-md:border-t-white/20 max-md:border-x-0 max-md:border-b-0 rounded-[2rem] max-md:rounded-t-[2.5rem] max-md:rounded-b-none p-10 max-md:p-6 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,1)] max-md:shadow-[0_-30px_60px_rgba(0,0,0,0.9)] relative overflow-hidden flex-1 max-md:overflow-y-auto overscroll-contain">
            {/* Mobile Drag Handle Indicator */}
            <div class="hidden max-md:block w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
            <div class="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 to-transparent blur-[80px] rounded-full pointer-events-none" />
            <div class="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-white/5 to-transparent blur-[80px] rounded-full pointer-events-none" />
            <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-screen" />

            <div class="relative z-10" key={step}>
              <div class="animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
                {step === 'layout' && <LayoutStep value={product} onChange={setProduct} />}
                {step === 'mat' && <MatColorStep value={matColor} onChange={setMatColor} />}
                {step === 'border' && <BorderColorStep value={borderColor} onChange={setBorderColor} />}
                {step === 'extras' && <ExtrasStep hasLogo={hasLogo} setHasLogo={setHasLogo} hasHeelPad={hasHeelPad} setHasHeelPad={setHasHeelPad} />}
                {step === 'summary' && (
                  <SummaryStep
                    product={product} matColor={matColor} borderColor={borderColor}
                    brand={brand} model={model} name={name} phone={phone} city={city}
                    onNameChange={setName} onPhoneChange={setPhone} onCityChange={setCity}
                    onSubmit={submit} submitting={submitting} error={error} total={total}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Bottom Cinematic Nav */}
          {step !== 'summary' && (
            <div class="mt-8 max-md:mt-0 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 max-md:p-6 max-md:bg-[#050505]/95 max-md:border-t max-md:border-white/10 max-md:backdrop-blur-3xl z-20 shrink-0">
              <button
                type="button"
                onClick={() => { const i = STEPS.findIndex((s) => s.key === step); if (i > 0) setStep(STEPS[i - 1].key) }}
                disabled={step === 'layout'}
                class="px-8 max-md:px-6 py-5 max-md:py-4 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white bg-black/40 hover:bg-white/10 border border-white/5 hover:border-white/20 backdrop-blur-md disabled:opacity-0 transition-all duration-500"
              >
                Geri
              </button>
              <button
                type="button"
                onClick={() => { const i = STEPS.findIndex((s) => s.key === step); if (i < STEPS.length - 1) setStep(STEPS[i + 1].key) }}
                class="group flex-1 flex items-center justify-center gap-4 px-10 max-md:px-6 py-5 max-md:py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-500 hover:scale-[1.02] shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_50px_rgba(245,158,11,0.5)]"
              >
                Sonraki Adım
                <ArrowRight class="size-4 group-hover:translate-x-1.5 transition-transform duration-500" />
              </button>
            </div>
          )}
        </div>
      </main>
      </div>
    </div>
  )
}

function SummaryStep({ product, matColor, borderColor, brand, model, name, phone, city, onNameChange, onPhoneChange, onCityChange, onSubmit, submitting, error, total }: any) {
  return (
    <div class="space-y-12">
      <div>
        <h2 class="text-3xl font-light tracking-tighter text-white mb-4">Tasarım <span class="font-medium text-amber-500">Özeti</span></h2>
        <p class="text-white/40 font-light leading-relaxed">Mükemmel paspas setiniz için son bir adım kaldı. Bilgilerinizi girin, atölyemiz sizinle detaylar için iletişime geçsin.</p>
      </div>

      <div class="rounded-2xl bg-black/40 border border-white/5 p-8 space-y-5 shadow-inner">
        {brand && model && <Row label="Araç" value={`${brand.name} ${model.name}${model.chassisCode ? ` · ${model.chassisCode}` : ''}`} />}
        <Row label="Set Yapısı" value={`${product.name} · ${product.parts} Parça`} />
        <Row label="Zemin Materyali" value={matColor.name} swatchHex={matColor.hex} />
        <Row label="Kenarlık Biyesi" value={borderColor.name} swatchHex={borderColor.hex} />
        <div class="border-t border-white/5 pt-6 mt-6 flex items-center justify-between">
          <span class="text-white/30 text-[10px] uppercase tracking-[0.2em] font-semibold">Genel Toplam</span>
          <span class="text-3xl font-light text-white tracking-tighter">{total.toLocaleString('tr-TR')} <span class="text-amber-500 text-2xl">₺</span></span>
        </div>
      </div>

      <form onSubmit={onSubmit} class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field icon={User} label="İsim Soyisim" value={name} onChange={onNameChange} required placeholder="Örn: Ahmet Yılmaz" />
          <Field icon={Phone} label="Telefon No" value={phone} onChange={onPhoneChange} type="tel" required placeholder="05XX XXX XX XX" />
        </div>
        <Field icon={MapPin} label="Teslimat Şehri" value={city} onChange={onCityChange} placeholder="Örn: İstanbul (Opsiyonel)" />

        {error && (
          <div class="rounded-xl bg-red-500/10 border border-red-500/20 px-5 py-4 text-sm text-red-400 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
            <div class="size-2 rounded-full bg-red-500 animate-pulse" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          class="w-full relative overflow-hidden group rounded-2xl bg-gradient-to-r from-amber-600 to-amber-400 text-black font-bold uppercase tracking-[0.2em] text-xs py-6 transition-all duration-500 disabled:opacity-50 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(245,158,11,0.4)] mt-4"
        >
          <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
          <span class="relative z-10 flex items-center justify-center gap-3">
            {submitting ? 'İşleniyor...' : 'Tasarımı Gönder ve Teklif Al'}
            {!submitting && <ArrowRight class="size-4 group-hover:translate-x-1 transition-transform" />}
          </span>
        </button>
      </form>
    </div>
  )
}

function Row({ label, value, swatchHex }: any) {
  return (
    <div class="flex items-center justify-between group">
      <span class="text-white/40 text-xs tracking-wider">{label}</span>
      <span class="flex items-center gap-4">
        {swatchHex && <span class="size-5 rounded-full ring-1 ring-white/20 shadow-inner" style={{ background: swatchHex }} />}
        <span class="text-white font-medium text-sm tracking-wide">{value}</span>
      </span>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required, placeholder, icon: Icon }: any) {
  return (
    <label class="block relative group">
      <span class="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-2.5 block font-semibold">
        {label} {required && <span class="text-amber-500">*</span>}
      </span>
      <div class="relative">
        <div class="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-amber-400 transition-colors duration-500">
          <Icon class="size-4" />
        </div>
        <input
          type={type} value={value} onInput={(e) => onChange((e.target as HTMLInputElement).value)}
          required={required} placeholder={placeholder}
          class="w-full rounded-2xl bg-black/40 border border-white/5 focus:border-amber-500/50 focus:bg-black/60 focus:ring-1 focus:ring-amber-500/50 outline-none pl-12 pr-5 py-4 text-sm text-white placeholder:text-white/20 transition-all duration-500"
        />
      </div>
    </label>
  )
}

function ExtrasStep({ hasLogo, setHasLogo, hasHeelPad, setHasHeelPad }: any) {
  return (
    <div class="space-y-8">
      <div>
        <h2 class="text-3xl font-light tracking-tighter text-white mb-3">Ekstra <span class="font-medium text-amber-500">Detaylar</span></h2>
        <p class="text-white/40 font-light leading-relaxed">Paspasınıza premium marka logoları ve alüminyum topukluk ekleyerek görünümünü ve dayanıklılığını artırın.</p>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <button
          onClick={() => setHasLogo(!hasLogo)}
          class={`flex items-start gap-5 p-6 rounded-2xl border transition-all duration-300 text-left ${hasLogo ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'bg-white/[0.02] border-white/10 hover:bg-white/5'}`}
        >
          <div class={`mt-1 size-6 rounded-full flex items-center justify-center shrink-0 border ${hasLogo ? 'bg-amber-500 border-amber-500 text-black' : 'border-white/20 text-transparent'}`}>
            <Check class="size-3.5 stroke-[3]" />
          </div>
          <div>
            <h4 class={`text-sm font-semibold tracking-wide mb-1 ${hasLogo ? 'text-amber-400' : 'text-white'}`}>Premium Marka Logosu</h4>
            <p class="text-xs text-white/40 leading-relaxed">Sürücü ve yolcu paspaslarına aracınızın orijinal logosu eklenir. Sol menüdeki önizlemede logoların konumunu görebilirsiniz.</p>
          </div>
        </button>

        <button
          onClick={() => setHasHeelPad(!hasHeelPad)}
          class={`flex items-start gap-5 p-6 rounded-2xl border transition-all duration-300 text-left ${hasHeelPad ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'bg-white/[0.02] border-white/10 hover:bg-white/5'}`}
        >
          <div class={`mt-1 size-6 rounded-full flex items-center justify-center shrink-0 border ${hasHeelPad ? 'bg-amber-500 border-amber-500 text-black' : 'border-white/20 text-transparent'}`}>
            <Check class="size-3.5 stroke-[3]" />
          </div>
          <div>
            <h4 class={`text-sm font-semibold tracking-wide mb-1 ${hasHeelPad ? 'text-amber-400' : 'text-white'}`}>Alüminyum Metal Topukluk</h4>
            <p class="text-xs text-white/40 leading-relaxed">Sürücü tarafında gaz/fren pedalının altına gelen kısma aşınmayı önleyici %100 paslanmaz alüminyum alaşımlı plaka eklenir.</p>
          </div>
        </button>
      </div>
    </div>
  )
}
