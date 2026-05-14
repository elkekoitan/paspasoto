/**
 * CartSummary — /sepet sayfasının ana tablosu.
 * Sepet line'larını listeler, qty +/-, sil, toplam.
 */
import { useStore } from '@nanostores/preact'
import { cartStore, updateQty, removeLine, cartTotal } from '../../lib/cart'
import { formatTRY } from '../../lib/format'

export default function CartSummary() {
  const lines = useStore(cartStore)

  if (lines.length === 0) {
    return (
      <div class="text-center py-20">
        <div class="text-6xl mb-4 opacity-30">🛒</div>
        <h2 class="font-display text-2xl font-semibold mb-2">Sepetiniz boş</h2>
        <p class="text-[var(--color-text-muted)] mb-6">Önce ürünlere göz atın.</p>
        <a
          href="/urunler"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-primary)] text-black font-semibold hover:bg-[var(--color-primary)]/90 transition-colors"
        >
          Ürünleri Keşfet
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </a>
      </div>
    )
  }

  const total = cartTotal(lines)

  return (
    <div class="grid lg:grid-cols-[1fr_360px] gap-8">
      {/* Sepet listesi */}
      <div class="space-y-3">
        {lines.map((line) => (
          <article
            key={line.lineId}
            class="flex items-stretch gap-4 p-3 rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)]"
          >
            {/* Görsel */}
            <div class="size-24 shrink-0 rounded-xl overflow-hidden bg-[var(--color-surface-2)] ring-1 ring-[var(--color-border)]/50">
              {line.image && (
                <img
                  src={line.image}
                  alt={line.name}
                  class="size-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>

            {/* Detay */}
            <div class="flex-1 min-w-0 flex flex-col">
              <h3 class="text-sm font-semibold text-[var(--color-text)] line-clamp-2">{line.name}</h3>
              {line.attributes && Object.keys(line.attributes).length > 0 && (
                <div class="mt-1 flex flex-wrap gap-1.5">
                  {Object.entries(line.attributes).map(([k, v]) => (
                    <span class="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
                      {k}: {v}
                    </span>
                  ))}
                </div>
              )}
              <div class="mt-auto flex items-center justify-between pt-2">
                {/* Qty stepper */}
                <div class="inline-flex items-center rounded-lg border border-[var(--color-border)]/60 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => updateQty(line.lineId, line.quantity - 1)}
                    class="size-8 grid place-items-center hover:bg-[var(--color-surface-2)] text-[var(--color-text)]"
                    aria-label="Azalt"
                  >−</button>
                  <span class="w-10 text-center text-sm font-semibold tabular-nums">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(line.lineId, line.quantity + 1)}
                    class="size-8 grid place-items-center hover:bg-[var(--color-surface-2)] text-[var(--color-text)]"
                    aria-label="Arttır"
                  >+</button>
                </div>
                {/* Tutar */}
                <div class="text-right">
                  <div class="text-sm font-bold tabular-nums text-[var(--color-text)]">
                    {formatTRY(line.unitPrice * line.quantity)}
                  </div>
                  {line.quantity > 1 && (
                    <div class="text-[10px] text-[var(--color-text-muted)] tabular-nums">
                      {formatTRY(line.unitPrice)} × {line.quantity}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sil */}
            <button
              type="button"
              onClick={() => removeLine(line.lineId)}
              class="self-start text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors p-1"
              aria-label="Ürünü çıkar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </article>
        ))}
      </div>

      {/* Özet */}
      <aside class="space-y-4 lg:sticky lg:top-24 self-start">
        <div class="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-5">
          <h3 class="font-display text-lg font-semibold mb-4">Sepet Özeti</h3>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between text-[var(--color-text-soft)]">
              <dt>Ara Toplam</dt>
              <dd class="tabular-nums">{formatTRY(total)}</dd>
            </div>
            <div class="flex justify-between text-[var(--color-text-soft)]">
              <dt>Kargo</dt>
              <dd class="text-[var(--color-success)]">Ödeme adımında hesaplanır</dd>
            </div>
            <div class="border-t border-[var(--color-border)]/60 pt-2 mt-2 flex justify-between text-base font-bold">
              <dt>Toplam</dt>
              <dd class="tabular-nums text-[var(--color-primary)]">{formatTRY(total)}</dd>
            </div>
          </dl>
          <a
            href="/odeme"
            class="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-primary)] text-black font-semibold hover:bg-[var(--color-primary)]/90 transition-colors"
          >
            Ödemeye Geç
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </a>
          <a
            href="/urunler"
            class="mt-2 block text-center text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            ← Alışverişe Devam Et
          </a>
        </div>
      </aside>
    </div>
  )
}
