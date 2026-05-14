/**
 * Vehicle Layout Definitions
 * Defines the physical SVG shapes (paths) and the default overlay coordinates 
 * for Heelpad and Logos. This structure enables "Nike By You" style dynamic configurations.
 */

export type OverlayCoord = {
  x: number
  y: number
  rot: number
}

export type MatShapeDef = {
  id: string
  pathD: string
  transform?: string // Global placement transform
  innerTransform?: string // Specific inner transform for logos (e.g. for flipped mats)
  defaultLogo?: OverlayCoord
  defaultHeelpad?: OverlayCoord
}

export type LayoutDef = {
  name: string
  pieces: MatShapeDef[]
}

// ---------------------------------------------------------------------------------
// Generic Universal Layout (Used as fallback or default representation)
// In a real-world scenario, you would have specific layouts like VW_PASSAT_B8 etc.
// ---------------------------------------------------------------------------------

export const GENERIC_LAYOUTS: Record<number, LayoutDef> = {
  5: {
    name: 'Generic 5-Piece (Include Trunk)',
    pieces: [
      {
        id: 'driver',
        pathD: "M 150 50 L 350 50 L 400 300 L 650 300 Q 700 350 750 550 L 800 900 Q 850 1100 750 1150 L 150 1150 Q 50 1100 80 900 Q 120 400 150 50 Z",
        transform: "translate(200, 100)",
        defaultHeelpad: { x: 350, y: 380, rot: -8 },
        defaultLogo: { x: 140, y: 550, rot: -90 }
      },
      {
        id: 'passenger',
        pathD: "M 200 200 L 700 200 Q 850 300 900 550 L 950 900 Q 950 1100 750 1150 L 200 1150 Q 100 1100 120 900 Q 140 400 200 200 Z",
        transform: "translate(1450, 100)",
        defaultLogo: { x: 800, y: 550, rot: 90 }
      },
      {
        id: 'rear-left',
        pathD: "M 100 50 L 550 50 L 550 250 L 650 250 Q 700 250 700 300 L 700 700 Q 700 800 600 800 L 100 800 Q 30 750 30 650 L 30 100 Q 30 50 100 50 Z",
        transform: "translate(350, 1400)",
        defaultLogo: { x: 80, y: 400, rot: -90 }
      },
      {
        id: 'rear-right',
        pathD: "M 100 50 L 550 50 L 550 250 L 650 250 Q 700 250 700 300 L 700 700 Q 700 800 600 800 L 100 800 Q 30 750 30 650 L 30 100 Q 30 50 100 50 Z",
        transform: "scale(-1, 1) translate(-2350, 1400)", // 1600 - (-750) = 2350 flipped logic
        innerTransform: "translate(480, 700) scale(-1, 1) translate(-160, -700)",
        defaultLogo: { x: -80, y: 400, rot: -90 }
      },
      {
        id: 'trunk',
        pathD: "M 100 100 L 1900 100 Q 2000 150 2000 400 Q 1900 800 1600 800 L 400 800 Q 100 750 0 400 Q 0 150 100 100 Z",
        transform: "translate(600, 2400)",
        defaultLogo: { x: 900, y: 700, rot: 0 }
      }
    ]
  }
}

/**
 * Returns the layout definition based on the selected product parts.
 */
export function getLayoutForProduct(partsCount: number): LayoutDef {
  // For now, return a slice of the generic 5-piece based on partsCount
  const base = GENERIC_LAYOUTS[5]
  let activeIds = ['driver', 'passenger']
  if (partsCount >= 4) activeIds.push('rear-left', 'rear-right')
  if (partsCount >= 5) activeIds.push('trunk')

  return {
    name: `Generic ${partsCount}-Piece`,
    pieces: base.pieces.filter(p => activeIds.includes(p.id))
  }
}
