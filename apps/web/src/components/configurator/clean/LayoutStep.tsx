/**
 * LayoutStep — Carmat configurator paspas seti seçimi.
 *
 * Kullanıcının istediği "araç top-down + paspaslar sarı vurgulu" pattern.
 * 3 kart: 2'li (Sürücü+Yolcu) · 4'lü · 4'lü+Bagaj.
 *
 * Tertemiz, tek odaklı: sadece PRODUCTS arasından seçim. Hiçbir ekstra state yok.
 */
import type { Product } from '../../../lib/catalog'
import { PRODUCTS } from '../../../lib/catalog'

type Props = {
  value: Product | null
  onChange: (p: Product) => void
}

export default function LayoutStep({ value, onChange }: Props) {
  return (
    <div class="space-y-6">
      <div class="space-y-1.5">
        <h2 class="text-2xl font-semibold tracking-tight text-stone-100">Paspas Seti</h2>
        <p class="text-sm text-stone-400">Aracınızın kaç koltuğunu kaplayacağını seçin</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PRODUCTS.map((p) => (
          <LayoutCard
            key={p.id}
            product={p}
            selected={value?.slug === p.slug}
            onSelect={() => onChange(p)}
          />
        ))}
      </div>
    </div>
  )
}

function LayoutCard({
  product,
  selected,
  onSelect,
}: {
  product: Product
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      class={
        'group relative overflow-hidden rounded-2xl border-2 bg-stone-900/60 p-5 text-left transition-all hover:bg-stone-900 ' +
        (selected
          ? 'border-amber-400 shadow-[0_0_0_4px_rgba(212,146,58,0.15)]'
          : 'border-stone-700 hover:border-stone-500')
      }
    >
      {/* Top-down araç SVG (paspaslar sarı vurgulu) */}
      <div class="aspect-[5/3] rounded-xl bg-stone-950/60 p-3 mb-4">
        <CarTopdown
          product={product}
          highlightColor={selected ? '#d4923a' : '#a8a39a'}
        />
      </div>

      {/* Bilgi */}
      <div class="flex items-end justify-between gap-2">
        <div>
          <div class="text-base font-semibold text-stone-100">{product.name}</div>
          <div class="text-xs text-stone-400 mt-0.5">
            {product.parts} parça{product.includesTrunk ? ' · bagaj dahil' : ''}
          </div>
        </div>
        <div class="text-right">
          <div class="text-xs text-stone-500">başlangıç</div>
          <div class="text-lg font-bold text-amber-400 tabular-nums">{product.basePrice}₺</div>
        </div>
      </div>

      {/* Seçim rozeti */}
      {selected && (
        <div class="absolute top-3 right-3 size-7 rounded-full bg-amber-400 text-stone-950 grid place-items-center shadow-lg">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l3 3 7-7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      )}
    </button>
  )
}

/**
 * Top-down araç silüeti + paspas yerleri.
 *
 * Her layout için hangi paspasların görüneceğini PRODUCT.parts + includesTrunk belirler.
 *  - 2 parça: sadece ön (sürücü + yolcu)
 *  - 4 parça: ön 2 + arka 2
 *  - 5 parça: ön 2 + arka 2 + bagaj
 */
function CarTopdown({ product, highlightColor }: { product: Product; highlightColor: string }) {
  const showFront = product.parts >= 2
  const showRear = product.parts >= 4
  const showTrunk = product.includesTrunk

  return (
    <svg viewBox="0 0 200 120" class="w-full h-full" aria-hidden="true">
      {/* Araç gövdesi - top-down silüet */}
      <g>
        {/* Tavan/gövde */}
        <rect x="30" y="14" width="140" height="92" rx="22" fill="#1a1a20" stroke="#3a3a44" stroke-width="1.5" />
        {/* Ön cam */}
        <path d="M40 36 Q100 32 160 36 L156 50 Q100 47 44 50 Z" fill="#0c0c10" opacity="0.7" />
        {/* Arka cam */}
        <path d="M40 90 Q100 92 160 90 L156 76 Q100 79 44 76 Z" fill="#0c0c10" opacity="0.7" />
        {/* Yan ayraç (orta direk) */}
        <line x1="100" y1="50" x2="100" y2="76" stroke="#2a2a32" stroke-width="0.8" />
        {/* Tekerlek izleri (köşe noktaları) */}
        <circle cx="34" cy="34" r="2" fill="#0a0a0e" />
        <circle cx="166" cy="34" r="2" fill="#0a0a0e" />
        <circle cx="34" cy="86" r="2" fill="#0a0a0e" />
        <circle cx="166" cy="86" r="2" fill="#0a0a0e" />
      </g>

      {/* Paspas yerleri - sarı vurgulu */}
      {showFront && (
        <>
          {/* Sürücü (sol-ön) */}
          <rect x="48" y="53" width="22" height="22" rx="3" fill={highlightColor} />
          {/* Yolcu (sağ-ön) */}
          <rect x="130" y="53" width="22" height="22" rx="3" fill={highlightColor} />
        </>
      )}
      {showRear && (
        <>
          {/* Arka sol */}
          <rect x="48" y="78" width="22" height="18" rx="3" fill={highlightColor} />
          {/* Arka sağ */}
          <rect x="130" y="78" width="22" height="18" rx="3" fill={highlightColor} />
        </>
      )}
      {showTrunk && (
        /* Bagaj */
        <rect x="78" y="96" width="44" height="8" rx="2" fill={highlightColor} />
      )}
    </svg>
  )
}
