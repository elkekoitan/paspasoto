import { useEffect, useState } from 'preact/hooks'
import { findByToken, findByOrderNoAndPhone, PRODUCTION_TIMELINE, type Order, type OrderStatus } from '../../stores/orders'
import { formatTRY, formatDateTime } from '../../lib/format'

export default function OrderTracker() {
  const [mode, setMode] = useState<'lookup' | 'detail'>('lookup')
  const [order, setOrder] = useState<Order | null>(null)
  const [orderNo, setOrderNo] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('t')
    if (token) {
      const found = findByToken(token)
      if (found) {
        setOrder(found)
        setMode('detail')
      }
    }
  }, [])

  function lookup(e: Event) {
    e.preventDefault()
    const found = findByOrderNoAndPhone(orderNo.trim().toUpperCase(), phone.trim())
    if (!found) {
      setError(
        'Sipariş bulunamadı. Sipariş numaranızı ve telefonunuzun son 4 hanesini kontrol edin.',
      )
      return
    }
    setError('')
    setOrder(found)
    setMode('detail')
    window.history.pushState({}, '', `?t=${found.accessToken}`)
  }

  if (mode === 'detail' && order) {
    return <OrderDetail order={order} />
  }

  return (
    <div class="max-w-md mx-auto">
      <form
        onSubmit={lookup}
        class="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 space-y-4"
      >
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
          class="w-full px-5 py-3 rounded-lg text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] transition-all"
        >
          Siparişi Sorgula
        </button>
      </form>

      <p class="mt-6 text-xs text-[var(--color-text-muted)] text-center">
        Sipariş numaranızı bulamıyor musunuz?{' '}
        <a href="https://wa.me/905550000000" class="text-[var(--color-primary)] hover:underline">
          WhatsApp
        </a>
        'tan ulaşın.
      </p>
    </div>
  )
}

function OrderDetail({ order }: { order: Order }) {
  const currentIdx = PRODUCTION_TIMELINE.findIndex((s) => s.status === order.productionStatus)
  const cargoLink = cargoLinkFor(order)

  return (
    <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-6 lg:gap-10">
      <div>
        <header class="mb-6">
          <div class="flex items-center gap-3 flex-wrap">
            <span class="px-3 py-1.5 rounded-full bg-[var(--color-primary-soft)] border border-[var(--color-primary)]/30 text-[var(--color-primary)] text-xs font-semibold uppercase tracking-wider">
              {PRODUCTION_TIMELINE[currentIdx]?.label ?? 'Sipariş Alındı'}
            </span>
            <span class="text-xs text-[var(--color-text-muted)] tabular-nums">
              Sipariş No: <span class="font-mono text-[var(--color-text)]">{order.orderNo}</span>
            </span>
          </div>
          <h2 class="mt-3 font-display text-2xl md:text-3xl font-semibold tracking-tight">
            {order.items[0]?.brandName} {order.items[0]?.modelName}
          </h2>
          <p class="mt-1 text-sm text-[var(--color-text-soft)]">
            Sipariş tarihi: {formatDateTime(order.createdAt)}
          </p>
        </header>

        {/* Timeline */}
        <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5 md:p-6">
          <h3 class="font-display text-lg font-semibold mb-5">Üretim Takibi</h3>
          <ol class="space-y-4">
            {PRODUCTION_TIMELINE.map((s, i) => {
              const passed = i <= currentIdx
              const active = i === currentIdx
              const event = order.events.find((e) => e.status === s.status)
              return (
                <li class="flex gap-4">
                  <div class="relative shrink-0">
                    <div
                      class={[
                        'size-9 grid place-items-center rounded-full ring-2 transition-all',
                        passed
                          ? 'bg-[var(--color-primary)] ring-[var(--color-primary)] text-[var(--color-bg)]'
                          : 'bg-[var(--color-surface-2)] ring-[var(--color-border)] text-[var(--color-text-muted)]',
                        active && 'shadow-[var(--shadow-glow)]',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {passed ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : (
                        <span class="text-xs font-semibold">{i + 1}</span>
                      )}
                    </div>
                    {i < PRODUCTION_TIMELINE.length - 1 && (
                      <div
                        class={[
                          'absolute left-1/2 top-9 -translate-x-1/2 w-0.5 h-full',
                          passed ? 'bg-[var(--color-primary)]/40' : 'bg-[var(--color-border)]',
                        ].join(' ')}
                      />
                    )}
                  </div>
                  <div class="flex-1 pb-4">
                    <div class={['font-medium text-sm', passed ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'].join(' ')}>
                      {s.label}
                      {event && (
                        <span class="ml-2 text-[10px] text-[var(--color-text-muted)] font-normal">
                          {formatDateTime(event.at)}
                        </span>
                      )}
                    </div>
                    <p class="mt-0.5 text-xs text-[var(--color-text-muted)] leading-relaxed">
                      {s.description}
                    </p>
                    {s.status === 'shipped' && order.cargoTrackingNo && (
                      <a
                        href={cargoLink ?? '#'}
                        target="_blank"
                        rel="noopener"
                        class="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline"
                      >
                        Kargo takibi → {order.cargoCompany} #{order.cargoTrackingNo}
                      </a>
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
            {order.items.map((i) => (
              <div class="flex items-start gap-3">
                <div class="size-16 shrink-0 rounded-lg overflow-hidden ring-1 ring-[var(--color-border)] relative">
                  <img src={i.borderSwatchUrl} alt="" class="absolute inset-0 size-full object-cover" />
                  <div class="absolute inset-[14%] rounded-sm overflow-hidden">
                    <img src={i.matSwatchUrl} alt="" class="size-full object-cover" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold">
                    {i.brandName} {i.modelName} {i.modelChassis}
                  </div>
                  <div class="text-xs text-[var(--color-text-muted)] mt-0.5">{i.productName}</div>
                  <div class="text-[10px] text-[var(--color-text-muted)] mt-1">
                    {i.matName} · {i.borderName} · {i.heelName}
                    {i.logoBrandSlug ? ` · ${i.brandName} amblem` : ''}
                  </div>
                </div>
                <div class="text-sm font-semibold tabular-nums">{formatTRY(i.unitPrice * i.qty)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sağ panel */}
      <aside class="space-y-4">
        <PaymentStatus order={order} />
        <DeliveryInfo order={order} />
        <a
          href="https://wa.me/905550000000"
          target="_blank"
          rel="noopener"
          class="block text-center px-5 py-3 rounded-xl text-sm font-medium border border-[var(--color-success)]/40 text-[var(--color-success)] hover:bg-[var(--color-success)]/10 transition-colors"
        >
          💬 WhatsApp ile destek
        </a>
      </aside>
    </div>
  )
}

function PaymentStatus({ order }: { order: Order }) {
  const map = {
    bekliyor: { label: 'Beklemede', color: 'warning' as const },
    kismi: { label: 'Kısmi Ödeme Alındı', color: 'info' as const },
    tamamlandi: { label: 'Ödeme Tamamlandı', color: 'success' as const },
    iade: { label: 'İade Edildi', color: 'danger' as const },
  }
  const s = map[order.paymentStatus]
  return (
    <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
      <h3 class="font-display text-base font-semibold">Ödeme Durumu</h3>
      <div class="mt-3 flex items-center justify-between">
        <span
          class={[
            'px-2.5 py-1 rounded-full text-xs font-semibold',
            `bg-[var(--color-${s.color})]/15 text-[var(--color-${s.color})] border border-[var(--color-${s.color})]/30`,
          ].join(' ')}
        >
          {s.label}
        </span>
        <span class="text-xs text-[var(--color-text-muted)]">
          {order.paymentMethod === 'havale' ? 'Banka Havalesi' : 'Kapıda Ödeme'}
        </span>
      </div>
      <div class="mt-4 pt-4 border-t border-[var(--color-border)]/60 text-sm">
        <div class="flex justify-between mb-1">
          <span class="text-[var(--color-text-muted)]">Toplam</span>
          <span class="tabular-nums font-semibold">{formatTRY(order.total)}</span>
        </div>
      </div>
    </div>
  )
}

function DeliveryInfo({ order }: { order: Order }) {
  const a = order.shippingAddress
  return (
    <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
      <h3 class="font-display text-base font-semibold">Teslimat</h3>
      <div class="mt-3 text-sm text-[var(--color-text-soft)]">
        <p class="font-medium text-[var(--color-text)]">{a.fullName}</p>
        <p class="text-xs text-[var(--color-text-muted)]">{a.phone}</p>
        <p class="mt-2">
          {a.addressLine}
          <br />
          {a.district} / {a.city}
        </p>
      </div>
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
