import { useState } from 'preact/hooks'
import { useStore } from '@nanostores/preact'
import { $cart, $cartTotal, clearCart } from '../../stores/cart'
import { generateOrderNo, generateToken, saveOrder, type Order } from '../../stores/orders'
import { formatTRY } from '../../lib/format'

const CITIES = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Konya', 'Adana', 'Gaziantep',
  'Kayseri', 'Mersin', 'Eskişehir', 'Diyarbakır', 'Samsun', 'Trabzon', 'Sakarya',
  'Manisa', 'Şanlıurfa', 'Denizli', 'Hatay', 'Balıkesir',
]

export default function Checkout() {
  const items = useStore($cart)
  const total = useStore($cartTotal)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'havale' | 'kapida'>('havale')
  const [note, setNote] = useState('')
  const [kvkk, setKvkk] = useState(false)
  const [mesafeli, setMesafeli] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (items.length === 0) {
    return (
      <div class="text-center py-20">
        <p class="text-[var(--color-text-muted)]">Sepetinizde ürün yok.</p>
        <a href="/konfigurator" class="mt-4 inline-block text-[var(--color-primary)] hover:underline">
          Konfigüratöre Git →
        </a>
      </div>
    )
  }

  function submit(e: Event) {
    e.preventDefault()
    if (!kvkk || !mesafeli) {
      alert('Lütfen KVKK ve mesafeli satış sözleşmesi onaylarını verin.')
      return
    }
    setSubmitting(true)
    const orderNo = generateOrderNo()
    const accessToken = generateToken()
    const now = Date.now()
    const order: Order = {
      orderNo,
      accessToken,
      customer: { fullName, phone, email },
      shippingAddress: { fullName, phone, city, district, addressLine },
      items: [...items],
      subtotal: total,
      shipping: 0,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'havale' ? 'bekliyor' : 'bekliyor',
      productionStatus: 'received',
      customerNote: note || undefined,
      createdAt: now,
      events: [{ status: 'received', at: now, note: 'Sipariş sistemimize ulaştı.' }],
    }
    saveOrder(order)
    clearCart()
    setTimeout(() => {
      window.location.href = `/siparis/onay?t=${accessToken}`
    }, 400)
  }

  return (
    <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] gap-6 lg:gap-10">
      <form onSubmit={submit} class="space-y-6">
        {/* Müşteri bilgi */}
        <Section title="İletişim Bilgileri">
          <div class="grid sm:grid-cols-2 gap-3">
            <Field label="Ad Soyad" required>
              <input
                type="text"
                value={fullName}
                onInput={(e) => setFullName((e.target as HTMLInputElement).value)}
                required
                class={inputCls}
              />
            </Field>
            <Field label="GSM" required hint="0 ile başlayan 11 hane">
              <input
                type="tel"
                value={phone}
                onInput={(e) => setPhone((e.target as HTMLInputElement).value)}
                required
                pattern="[0-9 ]{10,14}"
                placeholder="0532 123 45 67"
                class={inputCls}
              />
            </Field>
            <Field label="E-posta" required class="sm:col-span-2">
              <input
                type="email"
                value={email}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                required
                class={inputCls}
              />
            </Field>
          </div>
        </Section>

        {/* Teslimat */}
        <Section title="Teslimat Adresi">
          <div class="grid sm:grid-cols-2 gap-3">
            <Field label="İl" required>
              <select
                value={city}
                onChange={(e) => setCity((e.target as HTMLSelectElement).value)}
                required
                class={inputCls}
              >
                <option value="">Seçin...</option>
                {CITIES.map((c) => (
                  <option value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="İlçe" required>
              <input
                type="text"
                value={district}
                onInput={(e) => setDistrict((e.target as HTMLInputElement).value)}
                required
                class={inputCls}
              />
            </Field>
            <Field label="Açık Adres" required class="sm:col-span-2">
              <textarea
                value={addressLine}
                onInput={(e) => setAddressLine((e.target as HTMLTextAreaElement).value)}
                required
                rows={3}
                class={`${inputCls} resize-none`}
                placeholder="Mahalle, sokak/cadde, daire no, vb."
              ></textarea>
            </Field>
          </div>
        </Section>

        {/* Ödeme */}
        <Section title="Ödeme Yöntemi">
          <div class="grid sm:grid-cols-2 gap-3">
            <PaymentRadio
              value="havale"
              current={paymentMethod}
              onSelect={setPaymentMethod}
              title="Banka Havalesi / EFT"
              desc="IBAN bilgileri sipariş onayı sonrası iletilir"
            />
            <PaymentRadio
              value="kapida"
              current={paymentMethod}
              onSelect={setPaymentMethod}
              title="Kapıda Ödeme"
              desc="Teslimat sırasında nakit/kart"
            />
          </div>
        </Section>

        <Section title="Sipariş Notu (opsiyonel)">
          <textarea
            value={note}
            onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)}
            rows={2}
            placeholder="Ekibimize iletmek istediğiniz bir not"
            class={`${inputCls} resize-none`}
          ></textarea>
        </Section>

        <div class="space-y-2 text-sm">
          <Checkbox checked={kvkk} onChange={setKvkk}>
            <a href="/kvkk-aydinlatma" target="_blank" class="text-[var(--color-primary)] underline-offset-2 hover:underline">
              KVKK Aydınlatma Metni
            </a>
            'ni okudum, onaylıyorum.
          </Checkbox>
          <Checkbox checked={mesafeli} onChange={setMesafeli}>
            <a href="/mesafeli-satis-sozlesmesi" target="_blank" class="text-[var(--color-primary)] underline-offset-2 hover:underline">
              Mesafeli Satış Sözleşmesi
            </a>
            'ni okudum, onaylıyorum.
          </Checkbox>
        </div>
      </form>

      <aside class="lg:sticky lg:top-32 self-start">
        <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-6">
          <h3 class="font-display text-lg font-semibold mb-4">Sipariş Özeti</h3>
          <div class="space-y-3 max-h-64 overflow-y-auto pr-2 -mr-2">
            {items.map((i) => (
              <div class="flex items-start gap-3 text-xs">
                <div class="size-12 shrink-0 rounded-lg overflow-hidden ring-1 ring-[var(--color-border)] relative">
                  <img src={i.borderSwatchUrl} alt="" class="absolute inset-0 size-full object-cover" />
                  <div class="absolute inset-[14%] rounded-sm overflow-hidden">
                    <img src={i.matSwatchUrl} alt="" class="size-full object-cover" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium truncate">
                    {i.brandName} {i.modelName}
                  </div>
                  <div class="text-[var(--color-text-muted)]">
                    {i.matName} · {i.borderName}
                  </div>
                </div>
                <div class="tabular-nums font-medium">{formatTRY(i.unitPrice * i.qty)}</div>
              </div>
            ))}
          </div>
          <dl class="mt-4 pt-4 border-t border-[var(--color-border)]/60 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-[var(--color-text-muted)]">Ara toplam</dt>
              <dd class="tabular-nums">{formatTRY(total)}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-[var(--color-text-muted)]">Kargo</dt>
              <dd class="text-[var(--color-success)] tabular-nums">Ücretsiz</dd>
            </div>
            <div class="flex justify-between pt-2 mt-2 border-t border-[var(--color-border)]/60 text-base font-semibold">
              <dt>Toplam</dt>
              <dd class="text-[var(--color-primary)] tabular-nums">{formatTRY(total)}</dd>
            </div>
          </dl>
          <button
            type="submit"
            onClick={submit}
            disabled={submitting}
            class="mt-5 w-full text-center px-5 py-3.5 rounded-xl text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] transition-all hover:shadow-[var(--shadow-glow)] disabled:opacity-50 disabled:cursor-wait"
          >
            {submitting ? 'Siparişiniz oluşturuluyor...' : 'Siparişi Oluştur'}
          </button>
          <p class="mt-3 text-[10px] text-[var(--color-text-muted)] text-center">
            ✓ KDV dahil · 2 yıl garantili · Şeffaf sipariş takibi
          </p>
        </div>
      </aside>
    </div>
  )
}

const inputCls = 'w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm'

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
  hint,
  class: cls,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  class?: string
  children: any
}) {
  return (
    <label class={cls ?? ''}>
      <div class="text-xs font-medium mb-1.5 flex items-center gap-1.5">
        {label} {required && <span class="text-[var(--color-danger)]">*</span>}
        {hint && <span class="text-[var(--color-text-muted)] font-normal ml-auto">{hint}</span>}
      </div>
      {children}
    </label>
  )
}

function PaymentRadio({
  value,
  current,
  onSelect,
  title,
  desc,
}: {
  value: 'havale' | 'kapida'
  current: 'havale' | 'kapida'
  onSelect: (v: 'havale' | 'kapida') => void
  title: string
  desc: string
}) {
  const active = current === value
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      class={[
        'text-left p-4 rounded-xl border-2 transition-all',
        active
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
          : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]',
      ].join(' ')}
    >
      <div class="flex items-start gap-3">
        <span
          class={[
            'mt-0.5 size-4 shrink-0 rounded-full border-2',
            active ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-[var(--color-border)]',
          ].join(' ')}
        />
        <div>
          <div class="text-sm font-semibold">{title}</div>
          <div class="mt-0.5 text-xs text-[var(--color-text-muted)]">{desc}</div>
        </div>
      </div>
    </button>
  )
}

function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: any
}) {
  return (
    <label class="flex items-start gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
        class="size-4 mt-0.5 accent-[var(--color-primary)]"
      />
      <span class="text-[var(--color-text-soft)] text-xs leading-relaxed">{children}</span>
    </label>
  )
}
