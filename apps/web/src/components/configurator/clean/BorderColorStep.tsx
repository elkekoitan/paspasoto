/**
 * BorderColorStep — Paspas kenarlık (biye) rengi seçimi.
 *
 * Görselde paspasın net çevresine kontur çizilecek olan renk.
 * Tek state, tek odaklı: BORDER_COLORS arasından seçim.
 */
import type { BorderColor } from '../../../lib/catalog'
import { BORDER_COLORS } from '../../../lib/catalog'

type Props = {
  value: BorderColor | null
  onChange: (c: BorderColor) => void
}

export default function BorderColorStep({ value, onChange }: Props) {
  return (
    <div class="space-y-6">
      <div class="space-y-1.5">
        <h2 class="text-2xl font-semibold tracking-tight text-stone-100">Kenarlık Rengi</h2>
        <p class="text-sm text-stone-400">
          Paspasın çevresine atılan biye rengi · {BORDER_COLORS.length} seçenek
        </p>
      </div>

      <div class="grid grid-cols-4 sm:grid-cols-5 gap-3">
        {BORDER_COLORS.map((c) => (
          <BorderSwatch
            key={c.id}
            color={c}
            selected={value?.slug === c.slug}
            onSelect={() => onChange(c)}
          />
        ))}
      </div>
    </div>
  )
}

function BorderSwatch({
  color,
  selected,
  onSelect,
}: {
  color: BorderColor
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      class={
        'group relative aspect-square rounded-xl border-2 bg-stone-900 overflow-hidden transition-all ' +
        (selected
          ? 'border-amber-400 shadow-[0_0_0_3px_rgba(212,146,58,0.18)]'
          : 'border-stone-700 hover:border-stone-500')
      }
      aria-label={color.name}
      title={color.name}
    >
      {/* Mini paspas önizleme — siyah zemin + bu renk biye */}
      <div class="absolute inset-2 rounded-md bg-stone-950 grid place-items-center">
        <div
          class="size-[80%] rounded-[6px] bg-stone-800"
          style={{
            boxShadow: `inset 0 0 0 4px ${color.hex}`,
          }}
        />
      </div>

      {/* İsim */}
      <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-2 py-1.5">
        <div class="text-[11px] font-medium text-stone-100 leading-tight">{color.name}</div>
      </div>

      {/* Tik */}
      {selected && (
        <div class="absolute top-1.5 right-1.5 size-6 rounded-full bg-amber-400 text-stone-950 grid place-items-center shadow-md">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l3 3 7-7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      )}
    </button>
  )
}
