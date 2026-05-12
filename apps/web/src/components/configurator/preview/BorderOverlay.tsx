/**
 * BorderOverlay — SVG vektör paspas kenarlık (biye) — mix-blend-mode: multiply
 * Stroke rengi dinamik, altındaki EVA petek dokusu görünmeye devam eder.
 */
import { useEffect, useState } from 'preact/hooks'

export type BorderOverlayProps = {
  setSlug: string
  borderHex: string
  strokeWidth?: number
  blendMode?: 'multiply' | 'overlay' | 'screen' | 'normal'
}

export default function BorderOverlay({
  setSlug,
  borderHex,
  strokeWidth = 24,
  blendMode = 'multiply',
}: BorderOverlayProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [hasFile, setHasFile] = useState<boolean | null>(null)

  useEffect(() => {
    const url = `/assets/borders/${setSlug}.svg`
    fetch(url, { method: 'HEAD' })
      .then((r) => {
        if (r.ok) {
          setHasFile(true)
          fetch(url)
            .then((res) => res.text())
            .then(setSvgContent)
        } else {
          setHasFile(false)
        }
      })
      .catch(() => setHasFile(false))
  }, [setSlug])

  const key = `border-${setSlug}-${borderHex}`

  return (
    <div
      key={key}
      class="preview-fade absolute inset-0 pointer-events-none"
      style={{ mixBlendMode: blendMode }}
    >
      {hasFile && svgContent ? (
        <div
          class="size-full"
          style={{ color: borderHex }}
          dangerouslySetInnerHTML={{
            __html: svgContent.replace(
              /stroke="[^"]*"/g,
              `stroke="${borderHex}" stroke-width="${strokeWidth}" stroke-linejoin="round" fill="none"`,
            ),
          }}
        />
      ) : (
        <svg
          viewBox="0 0 1600 900"
          class="size-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <rect
            x="60"
            y="60"
            width="1480"
            height="780"
            rx="40"
            ry="40"
            fill="none"
            stroke={borderHex}
            stroke-width={strokeWidth}
            stroke-linejoin="round"
          />
        </svg>
      )}
    </div>
  )
}
