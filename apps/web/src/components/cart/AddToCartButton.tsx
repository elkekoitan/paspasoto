/**
 * AddToCartButton — Basit ürün (catalog-extra.ts) için sepete ekle butonu.
 * Tıklayınca line ekler + kısa "Eklendi" feedback gösterir.
 */
import { useState } from 'preact/hooks'
import { addLine } from '../../lib/cart'
import type { SimpleProduct } from '../../lib/catalog-extra'

export type AddToCartButtonProps = {
  product: SimpleProduct
  /** Renk varyantı veya boyut seçimi için (opsiyonel) */
  quantity?: number
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export default function AddToCartButton({
  product,
  quantity = 1,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
}: AddToCartButtonProps) {
  const [feedback, setFeedback] = useState(false)
  const outOfStock = product.stock <= 0

  function handleClick() {
    if (outOfStock) return
    addLine({
      kind: 'simple',
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      unitPrice: product.price,
      quantity,
    })
    setFeedback(true)
    setTimeout(() => setFeedback(false), 1800)
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  }[size]

  const variantClasses = variant === 'primary'
    ? 'bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary)]/90'
    : 'bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-[var(--color-border)] border border-[var(--color-border)]'

  if (outOfStock) {
    return (
      <button
        type="button"
        disabled
        class={[
          'rounded-xl font-semibold transition-colors cursor-not-allowed',
          'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-border)]/40',
          sizeClasses,
          fullWidth ? 'w-full' : '',
        ].join(' ')}
      >
        Stokta Yok
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      class={[
        'rounded-xl font-semibold transition-all inline-flex items-center justify-center gap-2',
        variantClasses,
        sizeClasses,
        fullWidth ? 'w-full' : '',
        feedback ? 'scale-[0.97]' : 'hover:-translate-y-0.5',
      ].join(' ')}
    >
      {feedback ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          Sepete Eklendi
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
          Sepete Ekle
        </>
      )}
    </button>
  )
}
