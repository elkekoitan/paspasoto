/**
 * CheckoutForm — Sepet + adres + ödeme yöntemi → /api/orders/checkout
 */
import { useState } from 'preact/hooks'
import { useStore } from '@nanostores/preact'
import { cartStore, cartTotal, clearCart } from '../../lib/cart'
import { formatTRY } from '../../lib/format'

const TR_CITIES = [
  'Adana', 'Ankara', 'Antalya', 'Balıkesir', 'Bursa', 'Denizli', 'Diyarbakır', 'Erzurum',
  'Eskişehir', 'Gaziantep', 'Hatay', 'İstanbul', 'İzmir', 'Kayseri', 'Kocaeli', 'Konya',
  'Malatya', 'Manisa', 'Mersin', 'Sakarya', 'Samsun', 'Şanlıurfa', 'Trabzon', 'Diğer',
]

type PaymentMethod = 'elden-nakit' | 'elden-kart' | 'havale' | 'kapida' | 'iyzico'

const PAYMENT_OPTIONS: Array<{ value: PaymentMethod; label: string; desc: string; disabled?: boolean; badge?: string }> = [
  { value: 'kapida', label: '📦 Kapıda Ödeme', desc: 'Kargo geldiğinde nakit/kart ile öde' },
  { value: 'havale', label: '🏦 Havale / EFT', desc: 'Banka bilgileri sipariş sonrası iletilir' },
  { value: 'elden-nakit', label: '💵 Dükkânda Nakit', desc: 'Konya atölyemizden teslim alırken nakit' },
  { value: 'elden-kart', label: '💳 Dükkânda Kart (POS)', desc: 'Konya atölyemizden teslim alırken POS' },
  { value: 'iyzico', label: '💻 Online Kredi Kartı', desc: 'Çok Yakında — iyzico ile güvenli ödeme', disabled: true, badge: 'Yakında' },
]

export default function CheckoutForm() {
  const lines = useStore(cartStore)
  const total = cartTotal(lines)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [customerNote, setCustomerNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('kapida')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ orderNo: string; accessToken: string } | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit(e: Event) {
    e.preventDefault()
    setError('')
    if (lines.length === 0) {
      setError('Sepetiniz boş.')
      return
    }
    if (!fullName.trim() || !phone.trim() || !city.trim() || !district.trim() || !addressLine.trim()) {
      setError('Lütfen ad, telefon ve adres bilgilerini eksiksiz doldurun.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { fullName: fullName.trim(), phone: phone.trim(), email: email.trim() || undefined },
          shippingAddress: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            city: city.trim(),
            district: district.trim(),
            addressLine: addressLine.trim(),
          },
          lines,
          paymentMethod,
          customerNote: customerNote.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Sipariş gönderilemedi.')
      }
      const data = await res.json()
      setResult({ orderNo: data.orderNo, accessToken: data.accessToken })
      clearCart()
    } catch (err: any) {
      setError(err?.message || 'Bağlantı hatası, lütfen tekrar deneyin.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div class="max-w-xl mx-auto text-center py-12">
        <div class="size-20 mx-auto rounded-full bg-emerald-500/20 ring-2 ring-emerald-500 grid place-items-center mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h2 class="font-display text-3xl font-semibold mb-2">Siparişiniz alındı!</h2>
        <p class="text-[var(--color-text-soft)] mb-2">
          Sipariş numaranız: <strong class="text-[var(--color-primary)] tabular-nums">{result.orderNo}</strong>
        </p>
        <p class="text-sm text-[var(--color-text-muted)] mb-8">
          WhatsApp üzerinden sizinle iletişime geçeceğiz.
        </p>
        <div class="flex flex-col sm:flex-row justify-center gap-3">
          <a
            href={`/siparis-takip/detay?o=${result.orderNo}&t=${result.accessToken}`}
            class="px-5 py-3 rounded-xl bg-[var(--color-primary)] text-black font-semibold hover:bg-[var(--color-primary)]/90"
          >
            Siparişi Takip Et
          </a>
          <a
            href="/urunler"
            class="px-5 py-3 rounded-xl bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold hover:bg-[var(--color-border)]"
          >
            Alışverişe Devam
          </a>
        </div>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div class="text-center py-20">
        <div class="text-6xl mb-4 opacity-30">🛒</div>
        <h2 class="font-display text-2xl font-semibold mb-2">Sepetiniz boş</h2>
        <p class="text-[var(--color-text-muted)] mb-6">Önce sepete ürün ekleyin.</p>
        <a
          href="/urunler"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-primary)] text-black font-semibold"
        >
          Ürünleri Keşfet
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} class="grid lg:grid-cols-[1fr_360px] gap-8">
      {/* Sol kolon: form */}
      <div class="space-y-6">
        {/* Müşteri bilgileri */}
        <section class="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-5 md:p-6">
          <h2 class="font-display text-lg font-semibold mb-4">İletişim Bilgileri</h2>
          <div class="grid sm:grid-cols-2 gap-3">
            <Field label="Ad Soyad *">
              <input type="text" value={fullName} onInput={(e) => setFullName((e.target as HTMLInputElement).value)} class={inpClass} required />
            </Field>
            <Field label="Telefon *">
              <input type="tel" value={phone} onInput={(e) => setPhone((e.target as HTMLInputElement).value)} placeholder="0544 710 81 15" class={inpClass} required />
            </Field>
            <Field label="E-posta (opsiyonel)" class="sm:col-span-2">
              <input type="email" value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} class={inpClass} />
            </Field>
          </div>
        </section>

        {/* Teslimat adresi */}
        <section class="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-5 md:p-6">
          <h2 class="font-display text-lg font-semibold mb-4">Teslimat Adresi</h2>
          <div class="grid sm:grid-cols-2 gap-3">
            <Field label="İl *">
              <select value={city} onChange={(e) => setCity((e.target as HTMLSelectElement).value)} class={inpClass} required>
                <option value="">İl seçin...</option>
                {TR_CITIES.map((c) => <option value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="İlçe *">
              <input type="text" value={district} onInput={(e) => setDistrict((e.target as HTMLInputElement).value)} class={inpClass} required />
            </Field>
            <Field label="Adres *" class="sm:col-span-2">
              <textarea value={addressLine} onInput={(e) => setAddressLine((e.target as HTMLTextAreaElement).value)} rows={3} class={`${inpClass} resize-none`} required></textarea>
            </Field>
            <Field label="Sipariş notu (opsiyonel)" class="sm:col-span-2">
              <textarea value={customerNote} onInput={(e) => setCustomerNote((e.target as HTMLTextAreaElement).value)} rows={2} placeholder="Özel istek, teslimat saati vb." class={`${inpClass} resize-none`}></textarea>
            </Field>
          </div>
        </section>

        {/* Ödeme yöntemi */}
        <section class="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-5 md:p-6">
          <h2 class="font-display text-lg font-semibold mb-4">Ödeme Yöntemi</h2>
          <div class="space-y-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <label class={[
                'flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                opt.disabled
                  ? 'border-[var(--color-border)]/40 bg-[var(--color-surface-2)]/50 cursor-not-allowed opacity-60'
                  : paymentMethod === opt.value
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-2 ring-[var(--color-primary)]/30'
                    : 'border-[var(--color-border)]/60 hover:border-[var(--color-primary)]/40',
              ].join(' ')}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={opt.value}
                  checked={paymentMethod === opt.value}
                  disabled={opt.disabled}
                  onChange={() => !opt.disabled && setPaymentMethod(opt.value)}
                  class="mt-1"
                />
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-[var(--color-text)]">{opt.label}</span>
                    {opt.badge && (
                      <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <div class="text-[11px] text-[var(--color-text-muted)] mt-0.5">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </section>

        {error && (
          <div class="p-3 rounded-xl bg-[var(--color-danger)]/15 border border-[var(--color-danger)]/40 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}
      </div>

      {/* Sağ kolon: özet + submit */}
      <aside class="lg:sticky lg:top-24 self-start space-y-4">
        <div class="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-5">
          <h3 class="font-display text-lg font-semibold mb-4">Sipariş Özeti</h3>
          <ul class="space-y-2 mb-4 max-h-60 overflow-y-auto">
            {lines.map((l) => (
              <li class="flex items-center gap-3 text-sm">
                <div class="size-12 rounded-lg overflow-hidden bg-[var(--color-surface-2)] shrink-0">
                  {l.image && <img src={l.image} alt="" class="size-full object-cover" />}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium line-clamp-1">{l.name}</div>
                  <div class="text-[10px] text-[var(--color-text-muted)] tabular-nums">{l.quantity} × {formatTRY(l.unitPrice)}</div>
                </div>
                <div class="text-sm font-semibold tabular-nums">{formatTRY(l.unitPrice * l.quantity)}</div>
              </li>
            ))}
          </ul>
          <div class="border-t border-[var(--color-border)]/60 pt-3 flex justify-between text-lg font-bold">
            <span>Toplam</span>
            <span class="tabular-nums text-[var(--color-primary)]">{formatTRY(total)}</span>
          </div>
          <button
            type="submit"
            disabled={submitting}
            class="mt-4 w-full px-5 py-3.5 rounded-xl bg-[var(--color-primary)] text-black font-bold text-sm hover:bg-[var(--color-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Gönderiliyor...' : 'Siparişi Oluştur'}
          </button>
          <p class="mt-2 text-[10px] text-[var(--color-text-muted)] text-center leading-relaxed">
            Siparişiniz alınınca size WhatsApp üzerinden ulaşacağız.
          </p>
        </div>
      </aside>
    </form>
  )
}

const inpClass = 'w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm'

function Field({ label, class: cls, children }: { label: string; class?: string; children: any }) {
  return (
    <label class={cls ?? ''}>
      <div class="text-xs font-medium mb-1.5 text-[var(--color-text-soft)]">{label}</div>
      {children}
    </label>
  )
}
