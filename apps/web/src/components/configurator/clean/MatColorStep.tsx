/**
 * MatColorStep — Paspas iç (zemin) rengi seçimi.
 *
 * Tek odaklı: MAT_COLORS arasından bir tane seç. Hiçbir başka state'i kirletmez.
 * Görsel: ızgaralı renk paleti, seçili olan altın çerçeve + tik.
 */
import type { MatColor } from '../../../lib/catalog'
import { MAT_COLORS } from '../../../lib/catalog'

type Props = {
  value: MatColor | null
  onChange: (c: MatColor) => void
}

export default function MatColorStep({ value, onChange }: Props) {
  return (
    <div class="space-y-6">
      <div class="space-y-1.5">
        <h2 class="text-2xl font-semibold tracking-tight text-stone-100">Paspas Rengi</h2>
        <p class="text-sm text-stone-400">Aracınıza yakışacak zemin tonunu seçin · {MAT_COLORS.length} seçenek</p>
      </div>

      <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {MAT_COLORS.map((c) => (
          <ColorSwatch key={c.id} color={c} selected={value?.slug === c.slug} onSelect={() => onChange(c)} />
        ))}
      </div>
    </div>
  )
}

function ColorSwatch({
  color,
  selected,
  onSelect,
}: {
  color: MatColor
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      class={
        'group relative aspect-square rounded-xl border-2 overflow-hidden transition-all ' +
        (selected
          ? 'border-amber-400 shadow-[0_0_0_3px_rgba(212,146,58,0.18)]'
          : 'border-stone-700 hover:border-stone-500')
      }
      aria-label={color.name}
      title={color.name}
    >
      {/* Renk dolgu — gradient ile dokulu görünüm */}
      <div
        class="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 30% 25%, ${lighten(color.hex, 18)}, ${color.hex} 60%, ${darken(color.hex, 12)} 100%)`,
        }}
      />

      {/* İsim — alt bant */}
      <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-2 py-1.5">
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

function lighten(hex: string, amt: number): string {
  return shiftHex(hex, amt)
}
function darken(hex: string, amt: number): string {
  return shiftHex(hex, -amt)
}
function shiftHex(hex: string, amt: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = Math.max(0, Math.min(255, parseInt(full.slice(0, 2), 16) + amt))
  const g = Math.max(0, Math.min(255, parseInt(full.slice(2, 4), 16) + amt))
  const b = Math.max(0, Math.min(255, parseInt(full.slice(4, 6), 16) + amt))
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}
