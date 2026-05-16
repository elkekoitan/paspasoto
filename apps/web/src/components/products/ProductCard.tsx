/**
 * ProductCard — Listeleme sayfalarında ürün kartı (yenilenmiş tasarım).
 *
 * - Daha büyük görsel, modern e-ticaret hissi
 * - Hover'da yükselir, ring + glow
 * - Hızlı "Sepete Ekle" butonu (sadece hover'da görünür, mobilde her zaman)
 * - Açık rozetler + indirim oranı
 */
import { useState } from 'preact/hooks'
import type { SimpleProduct } from '../../lib/catalog-extra'
import { formatTRY } from '../../lib/format'
import { addLine } from '../../lib/cart'

const BADGE_LABELS: Record<string, { text: string; class: string }> = {
  'best-seller': { text: '⭐ Çok Satan', class: 'bg-amber-500 text-black' },
  new: { text: '✨ Yeni', class: 'bg-emerald-500 text-white' },
  discount: { text: '🏷 İndirim', class: 'bg-rose-500 text-white' },
  limited: { text: 'Sınırlı', class: 'bg-purple-500 text-white' },
  premium: { text: '👑 Premium', class: 'bg-gradient-to-r from-amber-400 to-amber-600 text-black' },
}

export default function ProductCard({ product }: { product: SimpleProduct }) {
  const [added, setAdded] = useState(false)
  const [adding, setAdding] = useState(false)

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0

  function handleAdd(e: Event) {
    e.preventDefault()
    e.stopPropagation()
    if (adding || product.stock < 1) return
    setAdding(true)
    addLine({
      kind: 'simple',
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      image: product.image,
      quantity: 1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
    setTimeout(() => setAdding(false), 200)
  }

  const outOfStock = product.stock < 1

  return (
    <a
      href={`/urunler/${product.category}/${product.slug}`}
      class="group relative flex flex-col rounded-2xl overflow-hidden border border-[var(--color-border)]/60 bg-[var(--color-surface)] hover:border-[var(--color-primary)]/60 hover:shadow-2xl hover:shadow-[var(--color-primary)]/15 transition-all hover:-translate-y-1"
    >
      {/* Görsel + rozet */}
      <div class="relative aspect-square overflow-hidden img-fallback">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          class="size-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e: any) => {
            // 2 deneme: önce SVG fallback, sonra opacity 0 (gradient bg görünür)
            const img = e.currentTarget
            if (!img.dataset.fallbackTried) {
              img.dataset.fallbackTried = '1'
              img.src = `/assets/products/${product.category}/${product.slug}.svg`
            } else {
              img.style.opacity = '0'
            }
          }}
        />
        {/* Sol üst: rozetler */}
        {product.badges && product.badges.length > 0 && (
          <div class="absolute top-2 left-2 flex flex-col gap-1">
            {product.badges.slice(0, 2).map((b) => (
              <span class={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase whitespace-nowrap shadow-lg ${BADGE_LABELS[b]?.class ?? 'bg-white text-black'}`}>
                {BADGE_LABELS[b]?.text ?? b}
              </span>
            ))}
          </div>
        )}
        {/* Sağ üst: indirim oranı */}
        {discount > 0 && (
          <span class="absolute top-2 right-2 size-14 rounded-full bg-[var(--color-danger)] text-white grid place-items-center text-xs font-black tabular-nums shadow-lg ring-2 ring-white/20">
            −%{discount}
          </span>
        )}

        {/* Stok tükendi overlay */}
        {outOfStock && (
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm grid place-items-center">
            <span class="px-4 py-2 rounded-lg bg-[var(--color-text)] text-[var(--color-bg)] text-sm font-bold">
              STOK TÜKENDİ
            </span>
          </div>
        )}

        {/* Hızlı Sepete Ekle — Touch safe (44px), mobil her zaman, desktop hover'da */}
        {!outOfStock && (
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            aria-label={added ? 'Sepete eklendi' : `${product.name} sepete ekle`}
            class={[
              'absolute bottom-2 right-2 size-11 rounded-full grid place-items-center shadow-lg transition-all duration-200',
              // Mobilde her zaman görünür; desktop'ta hover'da
              'opacity-100 md:opacity-0 md:group-hover:opacity-100',
              added
                ? 'bg-emerald-500 text-white scale-110'
                : 'bg-[var(--color-primary)] text-black hover:scale-110 active:scale-95',
            ].join(' ')}
          >
            {added ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>
            )}
          </button>
        )}
      </div>

      {/* Bilgi */}
      <div class="flex-1 flex flex-col p-4">
        <h3 class="text-sm md:text-[15px] font-semibold leading-snug text-[var(--color-text)] line-clamp-2 min-h-[2.6em] group-hover:text-[var(--color-primary)] transition-colors">
          {product.name}
        </h3>
        <p class="mt-1.5 text-xs text-[var(--color-text-muted)] line-clamp-2 flex-1 min-h-[2em]">
          {product.shortDescription}
        </p>

        {/* Fiyat */}
        <div class="mt-3 flex items-baseline gap-2">
          <span class="font-display text-lg md:text-xl font-bold text-[var(--color-primary)] tabular-nums">
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
              <span class="text-[var(--color-text-muted)]">Stokta · Hızlı kargo</span>
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
