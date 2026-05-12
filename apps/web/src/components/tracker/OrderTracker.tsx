import { useEffect, useState } from 'preact/hooks'
import { formatTRY, formatDateTime } from '../../lib/format'

type OrderStatus = 'received' | 'in_production' | 'ready' | 'delivered' | 'cancelled' | string

type DeliveryMethod = 'cargo' | 'pickup'
type CustomerStage = 'received' | 'in_production' | 'ready' | 'delivered'

/** Status → 4-aşama (legacy granular kayıtlar da desteklenir) */
function customerStageOf(s: string): CustomerStage | null {
  if (s === 'cancelled') return null
  if (s === 'received' || s === 'awaiting_payment') return 'received'
  if (s === 'in_production' || s === 'payment_confirmed' || s === 'production_started' || s === 'production_cutting' || s === 'production_sewing' || s === 'quality_check') return 'in_production'
  if (s === 'ready' || s === 'ready_pickup' || s === 'shipped') return 'ready'
  if (s === 'delivered' || s === 'picked_up') return 'delivered'
  return null
}

function stageIndex(stage: CustomerStage | null): number {
  if (!stage) return -1
  const arr: CustomerStage[] = ['received', 'in_production', 'ready', 'delivered']
  return arr.indexOf(stage)
}

const CUSTOMER_TIMELINE: { stage: CustomerStage; label: string; description: string }[] = [
  { stage: 'received', label: 'Sipariş Alındı', description: 'Siparişiniz atölyemize ulaştı, kontrol ediliyor.' },
  { stage: 'in_production', label: 'Üretimde', description: 'Aracınıza özel paspas üretiliyor — kalıp, kesim, dikim ve kalite kontrol.' },
  { stage: 'ready', label: 'Hazır', description: 'Paspasınız hazır.' },
  { stage: 'delivered', label: 'Teslim Edildi', description: 'Aracınızda kullanım başlasın!' },
]

type OrderItem = {
  brandName: string; modelName: string; modelChassis: string
  productName: string; matName: string; matSwatchUrl: string
  borderName: string; borderSwatchUrl: string
  heelName: string; heelSwatchUrl: string
  heelPadPassenger: boolean
  logoBrandSlug: string | null; logoQty: number
  qty: number; unitPrice: number
}

type Installment = {
  id: string; dueAt: number; amount: number
  method: string; status: 'planlandi' | 'odendi' | 'gecikti' | 'iptal'
  paidAt?: number; note?: string
}

type Order = {
  orderNo: string; accessToken: string
  customer: { fullName: string; phone: string }
  shippingAddress: { fullName: string; phone: string; city: string; district: string; addressLine: string }
  items: OrderItem[]
  total: number; paidAmount: number
  paymentMethod: string; paymentStatus: string; productionStatus: OrderStatus
  paymentInstallments?: Installment[]
  deliveryMethod?: DeliveryMethod
  cargoCompany?: string; cargoTrackingNo?: string; shippedAt?: number; deliveredAt?: number
  createdAt: number
  events: { status: OrderStatus; at: number; note?: string }[]
}

const PAYMENT_LABEL: Record<string, string> = {
  'elden-nakit': 'Elden — Nakit',
  'elden-kart': 'Elden — Kredi Kartı (POS)',
  havale: 'Havale / EFT',
  kapida: 'Kapıda Ödeme',
  sonra: 'Sonra Ödenecek',
  taksit: 'Parçalı / Taksit',
}

export default function OrderTracker() {
  const [mode, setMode] = useState<'lookup' | 'detail' | 'loading'>('lookup')
  const [order, setOrder] = useState<Order | null>(null)
  const [orderNo, setOrderNo] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('t')
    if (token) {
      setMode('loading')
      fetch(`/api/track/${token}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((o: Order) => { setOrder(o); setMode('detail') })
        .catch(() => { setMode('lookup'); setError('Sipariş bulunamadı veya link süresi dolmuş.') })
    }
  }, [])

  async function lookup(e: Event) {
    e.preventDefault()
    setError('')
    setMode('loading')
    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo: orderNo.trim().toUpperCase(), phoneLast4: phone.trim() }),
      })
      if (!res.ok) {
        setError('Sipariş bulunamadı. Sipariş numaranızı ve telefonunuzun son 4 hanesini kontrol edin.')
        setMode('lookup')
        return
      }
      const { token } = await res.json()
      const detail = await fetch(`/api/track/${token}`)
      const o = await detail.json()
      setOrder(o)
      setMode('detail')
      window.history.pushState({}, '', `?t=${token}`)
    } catch {
      setError('Bir hata oluştu, tekrar deneyin.')
      setMode('lookup')
    }
  }

  if (mode === 'loading') {
    return <div class="text-center py-12 text-[var(--color-text-muted)]">Yükleniyor...</div>
  }

  if (mode === 'detail' && order) {
    return <OrderDetail order={order} />
  }

  return (
    <div class="max-w-md mx-auto">
      <form onSubmit={lookup} class="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1.5">Sipariş Numarası</label>
          <input
            type="text"
            value={orderNo}
            onInput={(e) => setOrderNo((e.target as HTMLInputElement).value)}
            placeholder="PO-260506-A4F2"
            required
            class="w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm font-mono uppercase"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1.5">Telefon Son 4 Hane</label>
          <input
            type="text"
            value={phone}
            onInput={(e) => setPhone((e.target as HTMLInputElement).value)}
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            placeholder="1234"
            required
            class="w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm font-mono"
          />
        </div>
        {error && <p class="text-sm text-[var(--color-danger)]">{error}</p>}
        <button
          type="submit"
          class="w-full px-5 py-3 rounded-lg text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)]"
        >
          Siparişi Sorgula
        </button>
      </form>
      <p class="mt-6 text-xs text-[var(--color-text-muted)] text-center">
        Sipariş numaranızı bulamıyor musunuz?{' '}
        <a href="https://wa.me/905074988989" class="text-[var(--color-primary)] hover:underline">
          WhatsApp
        </a>
        'tan ulaşın.
      </p>
    </div>
  )
}

function OrderDetail({ order }: { order: Order }) {
  const stage = customerStageOf(order.productionStatus)
  const currentIdx = stageIndex(stage)
  const cargoLink = cargoLinkFor(order)
  const i = order.items[0]
  const isPickup = order.deliveryMethod === 'pickup'
  const isCancelled = order.productionStatus === 'cancelled'

  // Push subscribe state — müşteri sipariş takip sayfasını açtığında "Bildirim al" CTA
  const [pushState, setPushState] = useState<'idle' | 'subscribed' | 'denied' | 'unsupported'>('idle')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setPushState('unsupported')
      return
    }
    if (Notification.permission === 'granted') {
      // Daha önce subscribe ettiyse durumu yansıt
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription()
        if (sub) setPushState('subscribed')
      }).catch(() => {})
    } else if (Notification.permission === 'denied') {
      setPushState('denied')
    }
  }, [])

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(base64)
    const out = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
    return out
  }

  async function enablePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') {
      setPushState('denied')
      return
    }
    try {
      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        const r = await fetch('/api/push/vapid')
        const { publicKey } = await r.json()
        if (!publicKey) return
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
      }
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          audience: `order:${order.orderNo}`,
          token: order.accessToken,
        }),
      })
      if (res.ok) setPushState('subscribed')
    } catch (e) {
      console.warn('[push] customer subscribe error:', e)
    }
  }

  // 'Hazır' aşamasında alt etiket
  const readyLabel = isPickup ? 'Dükkanda hazır — gelip teslim alabilirsiniz' : order.cargoTrackingNo ? 'Kargoya verildi' : 'Atölyemizde paketlendi'
  // 'Teslim Edildi' aşamasında alt etiket
  const deliveredLabel = isPickup ? 'Dükkandan teslim alındı' : 'Adresinize teslim edildi'

  return (
    <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-6 lg:gap-10">
      <div>
        <header class="mb-6">
          <div class="flex items-center gap-3 flex-wrap">
            {isCancelled ? (
              <span class="px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider">
                İptal Edildi
              </span>
            ) : (
              <span class="px-3 py-1.5 rounded-full bg-[var(--color-primary-soft)] border border-[var(--color-primary)]/30 text-[var(--color-primary)] text-xs font-semibold uppercase tracking-wider">
                {CUSTOMER_TIMELINE[currentIdx]?.label ?? 'Sipariş Alındı'}
              </span>
            )}
            <span class="px-2.5 py-1 rounded-full text-[10px] font-medium border border-[var(--color-border)] text-[var(--color-text-soft)]">
              {isPickup ? 'Dükkandan Teslim' : 'Kargo ile Gönderim'}
            </span>
            <span class="text-xs text-[var(--color-text-muted)]">
              <span class="font-mono text-[var(--color-text)]">{order.orderNo}</span>
            </span>
            {order.channel === 'trendyol' && order.externalRef?.id && (
              <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-orange-500/15 border border-orange-500/40 text-orange-400 inline-flex items-center gap-1.5">
                <span>🛒</span>
                <span>Trendyol</span>
                <span class="font-mono opacity-80">·</span>
                <span class="font-mono opacity-90">{order.externalRef.id}</span>
              </span>
            )}
          </div>
          {i && (
            <h2 class="mt-3 font-display text-2xl md:text-3xl font-semibold tracking-tight">
              {i.brandName} {i.modelName} {i.modelChassis}
            </h2>
          )}
          <p class="mt-1 text-sm text-[var(--color-text-soft)]">
            Sipariş tarihi: {formatDateTime(order.createdAt)}
          </p>
        </header>

        <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5 md:p-6">
          <h3 class="font-display text-lg font-semibold mb-5">Sipariş Takibi</h3>
          <ol class="space-y-4">
            {CUSTOMER_TIMELINE.map((s, idx) => {
              const passed = idx <= currentIdx
              const active = idx === currentIdx
              // ilgili stage'in son event'i
              const passedStatuses: Record<CustomerStage, string[]> = {
                received: ['received', 'awaiting_payment'],
                in_production: ['in_production', 'payment_confirmed', 'production_started', 'production_cutting', 'production_sewing', 'quality_check'],
                ready: ['ready', 'ready_pickup', 'shipped'],
                delivered: ['delivered', 'picked_up'],
              }
              const stageEvents = order.events.filter((e) => passedStatuses[s.stage].includes(e.status))
              const lastEvent = stageEvents[stageEvents.length - 1]
              return (
                <li class="flex gap-4">
                  <div class="relative shrink-0">
                    <div class={[
                      'size-10 grid place-items-center rounded-full ring-2 transition-all',
                      passed ? 'bg-[var(--color-primary)] ring-[var(--color-primary)] text-[var(--color-bg)]' : 'bg-[var(--color-surface-2)] ring-[var(--color-border)] text-[var(--color-text-muted)]',
                      active && 'shadow-[var(--shadow-glow)]',
                    ].filter(Boolean).join(' ')}>
                      {passed ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : (
                        <span class="text-sm font-semibold">{idx + 1}</span>
                      )}
                    </div>
                    {idx < CUSTOMER_TIMELINE.length - 1 && (
                      <div class={['absolute left-1/2 top-10 -translate-x-1/2 w-0.5 h-[calc(100%+0.5rem)]', passed ? 'bg-[var(--color-primary)]/40' : 'bg-[var(--color-border)]'].join(' ')} />
                    )}
                  </div>
                  <div class="flex-1 pb-4">
                    <div class={['font-semibold text-base', passed ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'].join(' ')}>
                      {s.label}
                      {lastEvent && <span class="ml-2 text-[10px] text-[var(--color-text-muted)] font-normal">{formatDateTime(lastEvent.at)}</span>}
                    </div>
                    <p class="mt-0.5 text-xs text-[var(--color-text-muted)] leading-relaxed">
                      {s.stage === 'ready' && active ? readyLabel : s.stage === 'delivered' && active && deliveredLabel ? deliveredLabel : s.description}
                    </p>
                    {s.stage === 'ready' && active && !isPickup && order.cargoTrackingNo && (
                      <a href={cargoLink ?? '#'} target="_blank" rel="noopener" class="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline">
                        Kargo takibi → {order.cargoCompany?.toUpperCase()} #{order.cargoTrackingNo}
                      </a>
                    )}
                    {s.stage === 'ready' && active && isPickup && (
                      <div class="mt-2 text-xs text-[var(--color-primary)]">
                        📍 Atölye adresimize gelip teslim alabilirsiniz.
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        {/* Sipariş içeriği */}
        <div class="mt-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
          <h3 class="font-display text-lg font-semibold mb-4">Sipariş İçeriği</h3>
          <div class="space-y-3">
            {order.items.map((it) => (
              <div class="flex items-start gap-3">
                <div class="size-16 shrink-0 rounded-lg overflow-hidden ring-1 ring-[var(--color-border)] relative">
                  <img src={it.borderSwatchUrl} alt="" class="absolute inset-0 size-full object-cover" />
                  <div class="absolute inset-[14%] rounded-sm overflow-hidden">
                    <img src={it.matSwatchUrl} alt="" class="size-full object-cover" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold">{it.brandName} {it.modelName} {it.modelChassis}</div>
                  <div class="text-xs text-[var(--color-text-muted)] mt-0.5">{it.productName}</div>
                  <div class="text-[10px] text-[var(--color-text-muted)] mt-1">
                    {it.matName} · {it.borderName} · {it.heelName}
                    {it.logoBrandSlug ? ` · ${it.brandName} amblem` : ''}
                  </div>
                </div>
                <div class="text-sm font-semibold tabular-nums">{formatTRY(it.unitPrice * it.qty)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside class="space-y-4">
        <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
          <h3 class="font-display text-base font-semibold">Ödeme Durumu</h3>
          <div class="mt-3 flex items-center gap-2 flex-wrap">
            <span class={[
              'px-2.5 py-1 rounded-full text-xs font-semibold border',
              order.paymentStatus === 'tamamlandi' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : order.paymentStatus === 'kismi' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
              : 'bg-amber-500/15 text-amber-400 border-amber-500/30',
            ].join(' ')}>
              {order.paymentStatus === 'tamamlandi' ? 'Tamamlandı' : order.paymentStatus === 'kismi' ? `Kısmi (${formatTRY(order.paidAmount)})` : 'Beklemede'}
            </span>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-medium bg-[var(--color-surface-2)] text-[var(--color-text-soft)]">
              {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
            </span>
          </div>
          <div class="mt-3 pt-3 border-t border-[var(--color-border)]/60 text-sm space-y-1.5">
            <div class="flex justify-between">
              <span class="text-[var(--color-text-muted)]">Toplam</span>
              <span class="tabular-nums font-semibold">{formatTRY(order.total)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[var(--color-text-muted)]">Tahsil edildi</span>
              <span class="tabular-nums text-[var(--color-success)]">{formatTRY(order.paidAmount)}</span>
            </div>
            <div class="flex justify-between pt-1 border-t border-[var(--color-border)]/40">
              <span class="text-[var(--color-text-muted)]">Kalan</span>
              <span class={[
                'tabular-nums font-semibold',
                order.total - order.paidAmount === 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]',
              ].join(' ')}>
                {formatTRY(Math.max(0, order.total - order.paidAmount))}
              </span>
            </div>
          </div>

          {/* Taksit planı (varsa) */}
          {order.paymentInstallments && order.paymentInstallments.length > 0 && (
            <div class="mt-4 pt-3 border-t border-[var(--color-border)]/60">
              <h4 class="text-xs font-semibold text-[var(--color-text-soft)] mb-2 uppercase tracking-wider">Taksit Planı</h4>
              <ol class="space-y-2">
                {order.paymentInstallments.map((it, idx) => {
                  const overdue = it.status === 'planlandi' && it.dueAt < Date.now()
                  return (
                    <li class="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--color-surface-2)]/50">
                      <div class="flex items-center gap-2 min-w-0">
                        <span class={[
                          'size-5 grid place-items-center rounded-full text-[9px] font-bold shrink-0',
                          it.status === 'odendi' ? 'bg-emerald-500 text-white'
                          : overdue || it.status === 'gecikti' ? 'bg-red-500 text-white'
                          : 'bg-[var(--color-border)] text-[var(--color-text-muted)]',
                        ].join(' ')}>
                          {it.status === 'odendi' ? '✓' : idx + 1}
                        </span>
                        <div class="min-w-0">
                          <div class="text-xs font-medium tabular-nums">{formatTRY(it.amount)}</div>
                          <div class="text-[10px] text-[var(--color-text-muted)]">
                            {new Date(it.dueAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {' · '}
                            {PAYMENT_LABEL[it.method] ?? it.method}
                          </div>
                        </div>
                      </div>
                      <span class={[
                        'px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap',
                        it.status === 'odendi' ? 'bg-emerald-500/15 text-emerald-400'
                        : overdue || it.status === 'gecikti' ? 'bg-red-500/15 text-red-400'
                        : it.status === 'iptal' ? 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                        : 'bg-amber-500/15 text-amber-400',
                      ].join(' ')}>
                        {it.status === 'odendi' ? 'Ödendi' : overdue ? 'Gecikti' : it.status === 'iptal' ? 'İptal' : 'Planlı'}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>
          )}
        </div>

        {/* Kargo paneli — kargoda veya teslim olmuşsa göster */}
        {!isPickup && (order.productionStatus === 'ready' || order.productionStatus === 'delivered') && order.cargoCompany && (
          <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
            <h3 class="font-display text-base font-semibold">Kargo</h3>
            <div class="mt-3 text-sm space-y-2">
              <div class="flex justify-between">
                <span class="text-[var(--color-text-muted)]">Firma</span>
                <span class="font-medium uppercase">{order.cargoCompany}</span>
              </div>
              {order.cargoTrackingNo && (
                <div class="flex justify-between">
                  <span class="text-[var(--color-text-muted)]">Takip No</span>
                  <span class="font-mono text-xs">{order.cargoTrackingNo}</span>
                </div>
              )}
              {order.shippedAt && (
                <div class="flex justify-between">
                  <span class="text-[var(--color-text-muted)]">Verildi</span>
                  <span class="text-xs">{formatDateTime(order.shippedAt)}</span>
                </div>
              )}
              {order.deliveredAt && (
                <div class="flex justify-between">
                  <span class="text-[var(--color-text-muted)]">Teslim</span>
                  <span class="text-xs text-[var(--color-success)]">{formatDateTime(order.deliveredAt)}</span>
                </div>
              )}
              {cargoLink && (
                <a href={cargoLink} target="_blank" rel="noopener" class="mt-2 block text-center px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--color-primary)] text-[var(--color-bg)] hover:bg-[var(--color-primary-hover)]">
                  Kargoyu Takip Et →
                </a>
              )}
            </div>
          </div>
        )}

        <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
          <h3 class="font-display text-base font-semibold">Teslimat</h3>
          <div class="mt-3 text-sm text-[var(--color-text-soft)]">
            <p class="font-medium text-[var(--color-text)]">{order.shippingAddress.fullName}</p>
            <p class="text-xs text-[var(--color-text-muted)]">{order.shippingAddress.phone}</p>
            <p class="mt-2">
              {order.shippingAddress.addressLine}
              <br />
              {order.shippingAddress.district} / {order.shippingAddress.city}
            </p>
          </div>
        </div>

        {/* Push bildirim aboneliği */}
        {pushState === 'idle' && (
          <button
            onClick={enablePush}
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-br from-[var(--color-primary)] to-amber-500 hover:from-amber-400 text-[var(--color-bg)] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            <div class="flex-1 text-left">
              <div class="text-sm">Bildirim Al</div>
              <div class="text-[10px] opacity-80 font-normal">Sipariş hazır olunca telefonuna gelsin</div>
            </div>
          </button>
        )}
        {pushState === 'subscribed' && (
          <div class="px-4 py-3 rounded-xl text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            <span>Bildirim aktif. Durum değiştiğinde anında haberdar olacaksın.</span>
          </div>
        )}
        {pushState === 'denied' && (
          <div class="px-4 py-3 rounded-xl text-xs bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
            Bildirim izni reddedildi. Tarayıcı ayarlarından yeniden açabilirsin.
          </div>
        )}

        <a
          href="https://wa.me/905074988989"
          target="_blank"
          rel="noopener"
          class="block text-center px-5 py-3 rounded-xl text-sm font-medium border border-[var(--color-success)]/40 text-[var(--color-success)] hover:bg-[var(--color-success)]/10"
        >
          💬 WhatsApp ile destek
        </a>
      </aside>
    </div>
  )
}

function cargoLinkFor(order: Order): string | null {
  if (!order.cargoTrackingNo) return null
  const map: Record<string, string> = {
    yurtici: `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${order.cargoTrackingNo}`,
    aras: `https://www.araskargo.com.tr/sayfa/anasayfa/?kod=${order.cargoTrackingNo}`,
    mng: `https://kargotakip.mngkargo.com.tr/?takipkodu=${order.cargoTrackingNo}`,
  }
  return map[order.cargoCompany ?? ''] ?? null
}
