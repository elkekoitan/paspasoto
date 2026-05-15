/**
 * AddressAutocomplete — Google Places Autocomplete ile akıllı adres alanı.
 *
 * Çalışma:
 *   - PUBLIC_GOOGLE_MAPS_API_KEY env varsa: Maps JS API yüklenir,
 *     kullanıcı yazarken Türkiye-içi adres önerisi çıkar; seçince
 *     city/district/lat/lng otomatik doldurulur.
 *   - Env yoksa: sade textarea (mevcut davranış).
 *
 * Parent komponente onPick callback'i ile (city, district, addressLine, geo)
 * paketi gönderir.
 */
import { useEffect, useRef, useState } from 'preact/hooks'

declare global {
  interface Window {
    google?: any
    __googleMapsApiLoaded?: boolean
    __googleMapsApiPromise?: Promise<void>
  }
}

type Pick = {
  city?: string
  district?: string
  addressLine: string
  formattedAddress?: string
  geo?: { lat: number; lng: number }
}

interface Props {
  value: string
  onChange: (v: string) => void
  onPick?: (p: Pick) => void
  apiKey?: string
  placeholder?: string
  className?: string
  rows?: number
}

function loadMapsApi(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.__googleMapsApiLoaded) return Promise.resolve()
  if (window.__googleMapsApiPromise) return window.__googleMapsApiPromise

  window.__googleMapsApiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    // weekly channel, places kütüphanesi, TR locale
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=tr&region=TR&v=weekly`
    script.async = true
    script.defer = true
    script.onload = () => {
      window.__googleMapsApiLoaded = true
      resolve()
    }
    script.onerror = () => reject(new Error('maps_load_failed'))
    document.head.appendChild(script)
  })
  return window.__googleMapsApiPromise
}

function pickAddressComponents(components: any[]): { city?: string; district?: string } {
  const out: { city?: string; district?: string } = {}
  for (const c of components ?? []) {
    const types: string[] = c.types ?? []
    if (types.includes('administrative_area_level_1')) {
      out.city = c.long_name
    } else if (types.includes('administrative_area_level_2') && !out.district) {
      out.district = c.long_name
    } else if (types.includes('sublocality_level_1') && !out.district) {
      out.district = c.long_name
    }
  }
  return out
}

export default function AddressAutocomplete({
  value,
  onChange,
  onPick,
  apiKey,
  placeholder,
  className,
  rows = 3,
}: Props) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const acRef = useRef<any>(null)
  const [ready, setReady] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!apiKey || !inputRef.current) return
    let alive = true
    loadMapsApi(apiKey)
      .then(() => {
        if (!alive || !inputRef.current || !window.google?.maps?.places) return
        const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ['address_components', 'formatted_address', 'geometry'],
          types: ['geocode'],
          componentRestrictions: { country: 'tr' },
        })
        ac.addListener('place_changed', () => {
          const place = ac.getPlace()
          if (!place) return
          const { city, district } = pickAddressComponents(place.address_components ?? [])
          const formatted: string = place.formatted_address ?? ''
          const loc = place.geometry?.location
          const geo = loc ? { lat: loc.lat(), lng: loc.lng() } : undefined
          if (formatted) onChange(formatted)
          onPick?.({
            city,
            district,
            addressLine: formatted || value,
            formattedAddress: formatted || undefined,
            geo,
          })
        })
        acRef.current = ac
        setReady(true)
      })
      .catch(() => setErr('maps_load_failed'))
    return () => {
      alive = false
    }
  }, [apiKey])

  return (
    <div class="relative">
      <textarea
        ref={inputRef as any}
        value={value}
        onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)}
        rows={rows}
        placeholder={placeholder ?? 'Mahalle, sokak, bina no, daire no...'}
        class={className}
        autoComplete="street-address"
      />
      {apiKey && ready && (
        <div class="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-medium pointer-events-none">
          📍 Akıllı arama
        </div>
      )}
      {apiKey && err && (
        <div class="mt-1 text-[10px] text-[var(--color-text-muted)]">
          Akıllı adres araması yüklenemedi. Lütfen adresi elle girin.
        </div>
      )}
    </div>
  )
}
