/**
 * ProductCard — Listeleme sayfalarında ürün kartı.
 */
import type { SimpleProduct } from '../../lib/catalog-extra'
import { formatTRY } from '../../lib/format'

const BADGE_LABELS: Record<string, { text: string; class: string }> = {
  'best-seller': { text: 'Çok Satan', class: 'bg-amber-500 text-black' },
  new: { text: 'Yeni', class: 'bg-emerald-500 text-white' },
  discount: { text: 'İndirim', class: 'bg-rose-500 text-white' },
  limited: { text: 'Sınırlı', class: 'bg-purple-500 text-white' },
  premium: { text: 'Premium', class: 'bg-gradient-to-r from-amber-400 to-amber-600 text-black' },
}

export default function ProductCard({ product }: { product: SimpleProduct }) {
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0

  return (
    <a
      href={`/urunler/${product.category}/${product.slug}`}
      class="group flex flex-col rounded-2xl overflow-hidden border border-[var(--color-border)]/60 bg-[var(--color-surface)] hover:border-[var(--color-primary)]/60 hover:shadow-2xl hover:shadow-[var(--color-primary)]/10 transition-all hover:-translate-y-1"
    >
      {/* Görsel + rozet */}
      <div class="relative aspect-square overflow-hidden bg-[var(--color-surface-2)]">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          class="size-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {/* Sol üst: rozetler */}
        {product.badges && product.badges.length > 0 && (
          <div class="absolute top-2 left-2 flex flex-col gap-1">
            {product.badges.slice(0, 2).map((b) => (
              <span class={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${BADGE_LABELS[b]?.class ?? 'bg-white text-black'}`}>
                {BADGE_LABELS[b]?.text ?? b}
              </span>
            ))}
          </div>
        )}
        {/* Sağ üst: indirim oranı */}
        {discount > 0 && (
          <span class="absolute top-2 right-2 size-12 rounded-full bg-[var(--color-danger)] text-white grid place-items-center text-[11px] font-black tabular-nums">
            −%{discount}
          </span>
        )}
      </div>

      {/* Bilgi */}
      <div class="flex-1 flex flex-col p-4">
        <h3 class="text-sm font-semibold leading-snug text-[var(--color-text)] line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        <p class="mt-2 text-xs text-[var(--color-text-muted)] line-clamp-2 flex-1">
          {product.shortDescription}
        </p>

        {/* Fiyat */}
        <div class="mt-3 flex items-baseline gap-2">
          <span class="font-display text-xl font-bold text-[var(--color-primary)] tabular-nums">
            {formatTRY(product.price)}
          </span>
          {product.oldPrice && (
            <span class="text-xs text-[var(--color-text-muted)] line-through tabular-nums">
              {formatTRY(product.oldPrice)}
            </span>
          )}
        </div>

        {/* Stok durumu */}
        <div class="mt-2 flex items-center gap-1.5 text-[11px]">
          {product.stock > 10 ? (
            <>
              <span class="size-1.5 rounded-full bg-emerald-500"></span>
              <span class="text-[var(--color-text-muted)]">Stokta</span>
            </>
          ) : product.stock > 0 ? (
            <>
              <span class="size-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span class="text-amber-500 font-medium">Son {product.stock} adet</span>
            </>
          ) : (
            <>
              <span class="size-1.5 rounded-full bg-[var(--color-text-muted)]"></span>
              <span class="text-[var(--color-text-muted)]">Stokta yok</span>
            </>
          )}
        </div>
      </div>
    </a>
  )
}
