/**
 * MobileStickyCart — Sepet doluyken mobile bottom sticky bar.
 *
 * Davranış:
 * - Mobil-only (md:hidden)
 * - Sepet boşsa görünmez (MobileBottomNav görünür kalır)
 * - Sepet doluysa: "Sepet (N) · ₺TOTAL → Ödemeye Geç" full-width buton
 * - Z-index: MobileBottomNav (40) üzerinde (50) — alt navı kaplar
 */
import { useStore } from '@nanostores/preact'
import { cartStore, cartCount, cartTotal } from '../../lib/cart'
import { formatTRY } from '../../lib/format'

export default function MobileStickyCart() {
  const lines = useStore(cartStore)
  const count = cartCount(lines)
  if (count === 0) return null
  const total = cartTotal(lines)

  return (
    <div
      class="md:hidden fixed bottom-0 inset-x-0 z-50 px-3 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 bg-[var(--color-bg)]/95 backdrop-blur-md border-t border-[var(--color-border)]/60"
      role="region"
      aria-label="Sepet özeti"
    >
      <a
        href="/sepet"
        class="flex items-center justify-between gap-3 w-full min-h-[56px] px-4 py-3 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black font-bold shadow-2xl transition-all active:scale-[0.98]"
      >
        <div class="flex items-center gap-2.5">
          <span class="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span class="absolute -top-1.5 -right-2 size-5 grid place-items-center rounded-full bg-black text-white text-[10px] font-black ring-2 ring-[var(--color-primary)]">
              {count > 9 ? '9+' : count}
            </span>
          </span>
          <div class="text-left">
            <div class="text-[11px] uppercase tracking-wider opacity-70 leading-none">Sepetim</div>
            <div class="text-base tabular-nums leading-tight mt-0.5">{formatTRY(total)}</div>
          </div>
        </div>
        <div class="flex items-center gap-1 text-sm">
          Ödemeye Geç
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </div>
      </a>
    </div>
  )
}
