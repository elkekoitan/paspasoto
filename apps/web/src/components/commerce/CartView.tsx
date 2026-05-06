import { useStore } from '@nanostores/preact'
import { $cart, $cartTotal, removeItem, updateQty, type CartItem } from '../../stores/cart'
import { formatTRY } from '../../lib/format'

export default function CartView() {
  const items = useStore($cart)
  const total = useStore($cartTotal)
  const shipping = total > 0 ? 0 : 0 // V1 ücretsiz
  const grandTotal = total + shipping

  if (items.length === 0) {
    return (
      <div class="text-center py-20">
        <div class="size-16 mx-auto grid place-items-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] mb-6 text-3xl">
          🛒
        </div>
        <h2 class="font-display text-2xl font-semibold">Sepetiniz boş</h2>
        <p class="mt-2 text-[var(--color-text-soft)]">
          Aracınıza özel paspasınızı oluşturmaya başlayın.
        </p>
        <a
          href="/konfigurator"
          class="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] transition-all"
        >
          Konfigüratörü Aç →
        </a>
      </div>
    )
  }

  return (
    <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] gap-6 lg:gap-10">
      <div class="space-y-3">
        {items.map((item) => (
          <CartRow key={item.id} item={item} />
        ))}
      </div>

      <aside class="lg:sticky lg:top-32 self-start">
        <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-6">
          <h3 class="font-display text-lg font-semibold mb-4">Sipariş Özeti</h3>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-[var(--color-text-muted)]">Ara toplam</dt>
              <dd class="tabular-nums">{formatTRY(total)}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-[var(--color-text-muted)]">Kargo</dt>
              <dd class="tabular-nums text-[var(--color-success)]">Ücretsiz</dd>
            </div>
            <div class="flex justify-between pt-2 mt-2 border-t border-[var(--color-border)]/60 text-base font-semibold">
              <dt>Toplam</dt>
              <dd class="text-[var(--color-primary)] tabular-nums">{formatTRY(grandTotal)}</dd>
            </div>
          </dl>
          <a
            href="/odeme"
            class="mt-5 block text-center px-5 py-3.5 rounded-xl text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] transition-all hover:shadow-[var(--shadow-glow)]"
          >
            Siparişi Tamamla →
          </a>
          <a
            href="/konfigurator"
            class="mt-3 block text-center text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            ← Yeni paspas ekle
          </a>
          <p class="mt-4 text-[10px] text-[var(--color-text-muted)] text-center">
            ✓ KDV dahil · 2 yıl üretim garantisi · 5-7 iş günü teslimat
          </p>
        </div>
      </aside>
    </div>
  )
}

function CartRow({ item }: { item: CartItem }) {
  return (
    <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-4 flex gap-4">
      <div class="relative size-24 sm:size-28 shrink-0 rounded-xl overflow-hidden ring-1 ring-[var(--color-border)]">
        <img src={item.borderSwatchUrl} alt="" class="absolute inset-0 size-full object-cover" />
        <div class="absolute inset-[14%] rounded-md overflow-hidden">
          <img src={item.matSwatchUrl} alt="" class="size-full object-cover" />
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h3 class="font-semibold text-sm">
              {item.brandName} {item.modelName} <span class="text-[var(--color-text-muted)]">{item.modelChassis}</span>
            </h3>
            <p class="mt-0.5 text-xs text-[var(--color-text-muted)]">{item.productName}</p>
          </div>
          <button
            onClick={() => removeItem(item.id)}
            class="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
            aria-label="Kaldır"
          >
            ✕
          </button>
        </div>
        <div class="mt-2 flex flex-wrap gap-1.5 text-[10px]">
          <span class="px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-soft)]">
            Zemin: {item.matName}
          </span>
          <span class="px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-soft)]">
            Kenarlık: {item.borderName}
          </span>
          <span class="px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-soft)]">
            Topukluk: {item.heelName}
          </span>
          {item.logoBrandSlug && (
            <span class="px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-soft)]">
              Amblem × {item.logoQty}
            </span>
          )}
        </div>
        <div class="mt-3 flex items-center justify-between">
          <div class="inline-flex items-center gap-1 rounded-lg bg-[var(--color-surface-2)] p-1">
            <button
              onClick={() => updateQty(item.id, item.qty - 1)}
              class="size-7 grid place-items-center rounded text-sm hover:bg-[var(--color-border)]"
              aria-label="Azalt"
            >
              −
            </button>
            <span class="w-8 text-center text-sm tabular-nums">{item.qty}</span>
            <button
              onClick={() => updateQty(item.id, item.qty + 1)}
              class="size-7 grid place-items-center rounded text-sm hover:bg-[var(--color-border)]"
              aria-label="Artır"
            >
              +
            </button>
          </div>
          <div class="text-right">
            <div class="font-semibold tabular-nums">{formatTRY(item.unitPrice * item.qty)}</div>
            {item.qty > 1 && (
              <div class="text-[10px] text-[var(--color-text-muted)]">
                {formatTRY(item.unitPrice)} × {item.qty}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
