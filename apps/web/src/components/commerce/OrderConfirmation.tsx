import { useEffect, useState } from 'preact/hooks'
import { findByToken, type Order } from '../../stores/orders'
import { formatTRY, formatDateTime } from '../../lib/format'

export default function OrderConfirmation() {
  const [order, setOrder] = useState<Order | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('t') ?? ''
    setOrder(findByToken(token))
  }, [])

  if (!order) {
    return (
      <div class="text-center py-20">
        <p class="text-[var(--color-text-muted)]">Sipariş bulunamadı.</p>
        <a href="/" class="mt-4 inline-block text-[var(--color-primary)] hover:underline">
          Anasayfaya Dön →
        </a>
      </div>
    )
  }

  function copyOrderNo() {
    navigator.clipboard?.writeText(order!.orderNo)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const trackUrl = `/siparis-takip/detay?t=${order.accessToken}`

  return (
    <div class="max-w-2xl mx-auto">
      <div class="text-center">
        <div class="size-16 mx-auto grid place-items-center rounded-2xl bg-[var(--color-success)]/15 border border-[var(--color-success)]/40 mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-success)]">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 class="font-display text-3xl md:text-4xl font-semibold tracking-tight">
          Siparişiniz alındı, teşekkürler!
        </h1>
        <p class="mt-3 text-[var(--color-text-soft)]">
          Siparişiniz sistemimize ulaştı. Üretim sürecini sipariş takip sayfasından canlı izleyebilirsiniz.
        </p>
      </div>

      <div class="mt-10 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] font-semibold">
              Sipariş Numaranız
            </div>
            <div class="font-display text-2xl font-semibold text-[var(--color-text)] tabular-nums mt-1">
              {order.orderNo}
            </div>
          </div>
          <button
            onClick={copyOrderNo}
            class="px-3 py-2 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:border-[var(--color-text-muted)] transition-colors"
          >
            {copied ? '✓ Kopyalandı' : 'Kopyala'}
          </button>
        </div>
        <div class="mt-4 pt-4 border-t border-[var(--color-border)]/60 text-sm text-[var(--color-text-soft)]">
          <p>
            <span class="text-[var(--color-text-muted)]">Sipariş tarihi:</span>{' '}
            {formatDateTime(order.createdAt)}
          </p>
          <p class="mt-1">
            <span class="text-[var(--color-text-muted)]">Toplam:</span>{' '}
            <span class="font-semibold text-[var(--color-text)]">{formatTRY(order.total)}</span>
          </p>
        </div>
      </div>

      {order.paymentMethod === 'havale' && (
        <div class="mt-6 rounded-2xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/40 p-6">
          <h2 class="font-display text-lg font-semibold flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[var(--color-warning)]">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            Banka Havalesi Bilgileri
          </h2>
          <p class="mt-2 text-sm text-[var(--color-text-soft)]">
            Aşağıdaki hesaplardan birine ödeme yaparken{' '}
            <strong class="text-[var(--color-text)]">açıklamaya sipariş numaranızı yazmayı unutmayın</strong>.
          </p>
          <div class="mt-4 space-y-3">
            <BankAccount
              bank="Ziraat Bankası"
              owner="Hamza Turhan"
              iban="TR00 0001 0001 0000 0000 0000 00"
            />
            <BankAccount
              bank="İş Bankası"
              owner="Hamza Turhan"
              iban="TR00 0006 4000 0010 0000 0000 00"
            />
          </div>
        </div>
      )}

      {order.paymentMethod === 'kapida' && (
        <div class="mt-6 rounded-2xl bg-[var(--color-info)]/10 border border-[var(--color-info)]/40 p-6">
          <h2 class="font-display text-lg font-semibold">Kapıda Ödeme</h2>
          <p class="mt-2 text-sm text-[var(--color-text-soft)]">
            Siparişiniz üretim sürecine alındı. Teslimat sırasında kargo görevlisine ödeme yapacaksınız.
          </p>
        </div>
      )}

      <div class="mt-8 grid sm:grid-cols-2 gap-3">
        <a
          href={trackUrl}
          class="block text-center px-5 py-4 rounded-xl text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] transition-all hover:shadow-[var(--shadow-glow)]"
        >
          Siparişimi Takip Et →
        </a>
        <a
          href="/"
          class="block text-center px-5 py-4 rounded-xl text-sm font-medium border border-[var(--color-border)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors"
        >
          Anasayfaya Dön
        </a>
      </div>

      <p class="mt-6 text-xs text-[var(--color-text-muted)] text-center">
        Sipariş takip linki ve detaylar e-posta adresinize ({order.customer.email}) gönderildi.
      </p>
    </div>
  )
}

function BankAccount({ bank, owner, iban }: { bank: string; owner: string; iban: string }) {
  function copy() {
    navigator.clipboard?.writeText(iban.replace(/\s/g, ''))
  }
  return (
    <div class="flex items-center justify-between gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/60">
      <div>
        <div class="text-xs font-semibold">{bank}</div>
        <div class="text-[10px] text-[var(--color-text-muted)] mt-0.5">{owner}</div>
        <div class="font-mono text-xs mt-1">{iban}</div>
      </div>
      <button
        onClick={copy}
        class="px-2.5 py-1.5 rounded text-xs font-medium border border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
      >
        Kopyala
      </button>
    </div>
  )
}
