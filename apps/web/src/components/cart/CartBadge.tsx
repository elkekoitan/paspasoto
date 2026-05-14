/**
 * CartBadge — Header'da sepet ikonu + adet sayacı.
 * useStore ile reactive (sepet değişince anında güncellenir).
 */
import { useStore } from '@nanostores/preact'
import { cartStore, cartCount } from '../../lib/cart'

export default function CartBadge({ href = '/sepet' }: { href?: string }) {
  const lines = useStore(cartStore)
  const count = cartCount(lines)

  return (
    <a
      href={href}
      class="relative grid size-10 place-items-center rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] transition-colors group"
      aria-label={`Sepet (${count} ürün)`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && (
        <span class="absolute -top-1 -right-1 size-5 grid place-items-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-black ring-2 ring-[var(--color-bg)] tabular-nums">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </a>
  )
}
