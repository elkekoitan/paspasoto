/**
 * Configurator (client) içinde gerçek marka logoları için.
 * simple-icons paketinden tree-shake friendly named imports.
 * Pakette olmayan markalar (Mercedes, Lexus, Land Rover, Jaguar, Cupra, BYD vs.)
 * fallback rozet (3-harf) ile render edilir.
 */
import {
  siAudi,
  siBmw,
  siVolkswagen,
  siSkoda,
  siHyundai,
  siFord,
  siPeugeot,
  siRenault,
  siFiat,
  siToyota,
  siHonda,
  siOpel,
  siVolvo,
  siCitroen,
  siSeat,
  siDacia,
  siKia,
  siNissan,
  siMazda,
  siMini,
  siPorsche,
  siTesla,
  siSubaru,
  siMitsubishi,
  siSuzuki,
  siJeep,
  siChevrolet,
  siIveco,
  siMahindra,
} from 'simple-icons'

type Icon = { path: string; hex: string; title: string }

const REGISTRY: Record<string, Icon> = {
  audi: siAudi,
  bmw: siBmw,
  volkswagen: siVolkswagen,
  skoda: siSkoda,
  hyundai: siHyundai,
  ford: siFord,
  peugeot: siPeugeot,
  renault: siRenault,
  fiat: siFiat,
  toyota: siToyota,
  honda: siHonda,
  opel: siOpel,
  volvo: siVolvo,
  citroen: siCitroen,
  seat: siSeat,
  dacia: siDacia,
  kia: siKia,
  nissan: siNissan,
  mazda: siMazda,
  mini: siMini,
  porsche: siPorsche,
  tesla: siTesla,
  subaru: siSubaru,
  mitsubishi: siMitsubishi,
  suzuki: siSuzuki,
  jeep: siJeep,
  chevrolet: siChevrolet,
  iveco: siIveco,
  mahindra: siMahindra,
}

export default function ClientBrandLogo({
  iconSlug,
  name,
  size = 36,
  color,
  className = '',
}: {
  iconSlug?: string
  name: string
  size?: number
  /** Marka rengi override (varsayılan: simple-icons hex). */
  color?: string
  className?: string
}) {
  const icon = iconSlug ? REGISTRY[iconSlug] : undefined
  const fill = color ?? (icon ? `#${icon.hex}` : 'currentColor')

  if (!icon) {
    return (
      <span
        class={`grid place-items-center font-display font-bold leading-none rounded-md ring-1 ring-current/20 ${className}`}
        style={`width: ${size}px; height: ${size}px; font-size: ${Math.max(9, size * 0.30)}px; color: ${color ?? 'currentColor'};`}
        aria-label={name}
      >
        {name.replace(/-Benz$/, '').replace(/[-\s]/g, '').slice(0, 3).toUpperCase()}
      </span>
    )
  }
  return (
    <svg
      role="img"
      aria-label={name}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      class={className}
      fill={fill}
    >
      <title>{name}</title>
      <path d={icon.path} />
    </svg>
  )
}
