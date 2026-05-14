/**
 * MatPreview — Ultra-Realistic 3D CAD EVA Mat Viewer (Performance & Precision Optimized)
 * 
 * Özellikler:
 * - Düzenlenmiş 5'li Layout: Önler üstte, Arkalar ortada, Bagaj altta. (Gerçek araç dizilimi)
 * - Logo Yerleşimleri: Sürücü(Sol-Dikey), Yolcu(Sağ-Dikey), ArkaSol(Sol-Dikey), ArkaSağ(Sağ-Dikey), Bagaj(Alt-Yatay).
 * - Kamera Kontrolleri: Orbit, Pan, Zoom ve "Sıfırla (Reset Default View)" özelliği.
 */
import { useState, useRef, useEffect, useMemo } from 'preact/hooks'
import type { Product, MatColor, BorderColor } from '../../../lib/catalog'
import { getLayoutForProduct } from '../../../lib/vehicleLayouts'

type Props = {
  product: Product
  matColor: MatColor
  borderColor: BorderColor
  hasHeelPad?: boolean
  hasLogo?: boolean
  className?: string
  onCoordinatesChange?: (coords: Record<string, {x: number, y: number, rot: number}>) => void
}

// Default Camera Parameters - adjusted to perfectly frame the Front -> Rear -> Trunk layout
const DEFAULT_CAMERA = { rotX: 65, rotZ: -35, panX: -50, panY: -200, scale: 0.35 }

export default function MatPreview({ product, matColor, borderColor, hasHeelPad = true, hasLogo = true, className, onCoordinatesChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // --- Environment & Camera State ---
  const [env, setEnv] = useState<'studio' | 'daylight' | 'neon'>('studio')
  const [camera, setCamera] = useState(DEFAULT_CAMERA)
  
  const [isCameraDragging, setIsCameraDragging] = useState(false)
  const [cameraDragMode, setCameraDragMode] = useState<'orbit' | 'pan'>('orbit')
  const cameraDragStart = useRef({ x: 0, y: 0, rotX: 0, rotZ: 0, panX: 0, panY: 0 })

  // --- Dynamic Layout & Attachment States ---
  const layout = useMemo(() => getLayoutForProduct(product.parts), [product.parts])

  const [coords, setCoords] = useState<Record<string, { x: number, y: number, rot: number }>>(() => {
    const initial: Record<string, any> = {}
    layout.pieces.forEach(p => {
      if (p.defaultLogo) initial[`logo_${p.id}`] = p.defaultLogo
      if (p.defaultHeelpad) initial[`heelpad_${p.id}`] = p.defaultHeelpad
    })
    return initial
  })

  // Whenever product layout changes, reset coords if new pieces exist
  useEffect(() => {
    setCoords(prev => {
      const next = { ...prev }
      layout.pieces.forEach(p => {
        if (p.defaultLogo && !next[`logo_${p.id}`]) next[`logo_${p.id}`] = p.defaultLogo
        if (p.defaultHeelpad && !next[`heelpad_${p.id}`]) next[`heelpad_${p.id}`] = p.defaultHeelpad
      })
      return next
    })
  }, [layout])

  // Sync coords upward
  useEffect(() => {
    onCoordinatesChange?.(coords)
  }, [coords])

  const [activeDrag, setActiveDrag] = useState<{ id: string, type: 'move' | 'rotate' } | null>(null)
  const attachmentDragStart = useRef({ x: 0, y: 0, objX: 0, objY: 0, objRot: 0 })

  // --- Reset View Action ---
  const resetCamera = () => {
    setCamera(DEFAULT_CAMERA)
  }

  // --- Global Event Listeners ---
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (activeDrag) {
        e.preventDefault()
        const sensitivity = 1.5 / camera.scale
        const dx = (e.clientX - attachmentDragStart.current.x) * sensitivity
        const dy = (e.clientY - attachmentDragStart.current.y) * sensitivity
        
        const updateState = (setter: any) => {
          setCoords((prev) => {
            const current = prev[activeDrag.id]
            if (!current) return prev
            
            if (activeDrag.type === 'move') {
              return { ...prev, [activeDrag.id]: { ...current, x: attachmentDragStart.current.objX + dx, y: attachmentDragStart.current.objY + dy } }
            } else if (activeDrag.type === 'rotate') {
              return { ...prev, [activeDrag.id]: { ...current, rot: attachmentDragStart.current.objRot + (e.clientX - attachmentDragStart.current.x) * 0.5 } }
            }
            return prev
          })
        }

        updateState(null) // Generic update applied via activeDrag.id
        
        return
      }

      if (isCameraDragging) {
        e.preventDefault()
        const dx = e.clientX - cameraDragStart.current.x
        const dy = e.clientY - cameraDragStart.current.y

        if (cameraDragMode === 'orbit') {
          setCamera(prev => ({
            ...prev,
            rotX: Math.max(0, Math.min(85, cameraDragStart.current.rotX - dy * 0.4)),
            rotZ: cameraDragStart.current.rotZ - dx * 0.4
          }))
        } else if (cameraDragMode === 'pan') {
          setCamera(prev => ({
            ...prev,
            panX: cameraDragStart.current.panX + dx,
            panY: cameraDragStart.current.panY + dy
          }))
        }
      }
    }

    const handleGlobalMouseUp = () => {
      setActiveDrag(null)
      setIsCameraDragging(false)
    }

    if (activeDrag || isCameraDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove, { passive: false })
      window.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [activeDrag, isCameraDragging, camera.scale, cameraDragMode])

  // --- Wheel Zoom ---
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    setCamera(prev => ({
      ...prev,
      scale: Math.max(0.15, Math.min(3.0, prev.scale - e.deltaY * 0.001))
    }))
  }

  useEffect(() => {
    const el = containerRef.current
    if (el) el.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      if (el) el.removeEventListener('wheel', handleWheel)
    }
  }, [])

  // --- Camera Mouse Handlers ---
  const handleStageMouseDown = (e: any) => {
    if (activeDrag) return
    setIsCameraDragging(true)
    setCameraDragMode(e.button === 2 || e.button === 1 ? 'pan' : 'orbit')
    cameraDragStart.current = { 
      x: e.clientX, y: e.clientY, 
      rotX: camera.rotX, rotZ: camera.rotZ, 
      panX: camera.panX, panY: camera.panY 
    }
  }

  const handleStageContextMenu = (e: any) => {
    e.preventDefault()
  }

  const startAttachmentDrag = (id: string, type: 'move' | 'rotate', e: any, currentState: any) => {
    e.stopPropagation()
    e.preventDefault()
    setActiveDrag({ id, type })
    attachmentDragStart.current = { x: e.clientX, y: e.clientY, objX: currentState.x, objY: currentState.y, objRot: currentState.rot }
  }

  return (
    <div class={`fixed inset-0 w-full h-full z-0 overflow-hidden flex flex-col pointer-events-auto transition-colors duration-1000 ${env === 'daylight' ? 'bg-[#d6d9df]' : env === 'neon' ? 'bg-[#0a0514]' : 'bg-[#040404]'} ${className ?? ''}`}>
      
      {/* Background Vignette & Ambient Glow */}
      <div 
        class={`absolute inset-0 pointer-events-none transition-all duration-1000 ${env === 'daylight' ? 'mix-blend-multiply opacity-50' : 'mix-blend-screen opacity-100'}`}
        style={{ background: `radial-gradient(circle at 50% 50%, ${env === 'neon' ? '#8a2be240' : env === 'daylight' ? '#ffffff00' : borderColor.hex + '15'} 0%, transparent 60%)` }}
      />
      <div class={`absolute inset-0 pointer-events-none opacity-95 transition-all duration-1000 ${env === 'daylight' ? 'bg-[radial-gradient(circle_at_center,transparent_0%,#a0a5b0_100%)]' : env === 'neon' ? 'bg-[radial-gradient(circle_at_center,transparent_10%,#000000_100%)]' : 'bg-[radial-gradient(circle_at_center,transparent_10%,#000000_100%)]'}`} />

      {/* 3D Stage */}
      <div 
        ref={containerRef}
        class="flex-1 w-full h-full perspective-[2000px] cursor-grab active:cursor-grabbing flex items-center justify-center relative"
        onMouseDown={handleStageMouseDown}
        onContextMenu={handleStageContextMenu}
      >
        <div 
          class="relative w-[3000px] h-[3500px] transform-style-3d will-change-transform"
          style={{ 
            transform: `translate3d(${camera.panX}px, ${camera.panY}px, 0) rotateX(${camera.rotX}deg) rotateZ(${camera.rotZ}deg) scale(${camera.scale})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Engineering Floor Grid */}
          <div class={`absolute inset-0 border-[1px] transition-colors duration-1000 ${env === 'daylight' ? 'border-black/[0.05] bg-[linear-gradient(to_right,#00000008_2px,transparent_2px),linear-gradient(to_bottom,#00000008_2px,transparent_2px)]' : env === 'neon' ? 'border-[#8a2be2]/[0.1] bg-[linear-gradient(to_right,#8a2be215_2px,transparent_2px),linear-gradient(to_bottom,#8a2be215_2px,transparent_2px)]' : 'border-white/[0.03] bg-[linear-gradient(to_right,#ffffff08_2px,transparent_2px),linear-gradient(to_bottom,#ffffff08_2px,transparent_2px)]'} bg-[size:100px_100px]`} />
          
          <svg viewBox="0 0 3000 3500" class="absolute inset-0 w-full h-full overflow-visible">
            <Defs matColor={matColor} borderColor={borderColor} env={env} />

            <g transform="translate(100, 100)">
              {/* Massive Floor Reflection Glow */}
              <ellipse cx="1500" cy="1800" rx="1800" ry="1800" fill={env === 'daylight' ? 'rgba(0,0,0,0.1)' : env === 'neon' ? 'rgba(138, 43, 226, 0.2)' : 'rgba(0,0,0,0.6)'} filter="blur(150px)" class="transition-colors duration-1000 pointer-events-none" />

              {/* DYNAMIC PIECES RENDERED FROM vehicleLayouts */}
              {layout.pieces.map(piece => {
                const logoKey = `logo_${piece.id}`
                const hpKey = `heelpad_${piece.id}`
                const logoState = coords[logoKey]
                const hpState = coords[hpKey]
                const isDriver = piece.id === 'driver'

                return (
                  <g key={piece.id} transform={piece.transform}>
                    <MatLayerStack pathD={piece.pathD} matHex={matColor.hex} borderHex={borderColor.hex} isDriver={isDriver}>
                      {hasHeelPad && piece.defaultHeelpad && hpState && (
                        <InteractiveAttachment 
                          w={280} h={160} state={hpState} isActive={activeDrag?.id === hpKey}
                          onMoveStart={(e) => startAttachmentDrag(hpKey, 'move', e, hpState)}
                          onRotateStart={(e) => startAttachmentDrag(hpKey, 'rotate', e, hpState)}
                        >
                          <HeelPadVisual />
                        </InteractiveAttachment>
                      )}
                      
                      {hasLogo && piece.defaultLogo && logoState && (
                        <g transform={piece.innerTransform || ""}>
                          <InteractiveAttachment 
                            w={160} h={55} state={logoState} isActive={activeDrag?.id === logoKey}
                            onMoveStart={(e) => startAttachmentDrag(logoKey, 'move', e, logoState)}
                            onRotateStart={(e) => startAttachmentDrag(logoKey, 'rotate', e, logoState)}
                          >
                            <LogoVisual />
                          </InteractiveAttachment>
                        </g>
                      )}
                    </MatLayerStack>
                  </g>
                )
              })}
            </g>
          </svg>
        </div>
      </div>

      {/* Floating HUD Controls */}
      <div class="absolute bottom-10 inset-x-10 flex items-end justify-between pointer-events-none z-50">
        
        {/* Environment Selector */}
        <div class="flex flex-col gap-2 pointer-events-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          <span class={`text-[9px] uppercase tracking-[0.3em] font-bold ${env === 'daylight' ? 'text-black/50' : 'text-white/30'}`}>Ortam / Işık</span>
          <div class={`flex bg-black/40 backdrop-blur-xl border p-1 rounded-2xl ${env === 'daylight' ? 'border-black/10' : 'border-white/10'}`}>
            <button onClick={() => setEnv('studio')} class={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all duration-300 ${env === 'studio' ? 'bg-amber-500 text-black shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>Stüdyo</button>
            <button onClick={() => setEnv('daylight')} class={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all duration-300 ${env === 'daylight' ? 'bg-amber-500 text-black shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>Gün Işığı</button>
            <button onClick={() => setEnv('neon')} class={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all duration-300 ${env === 'neon' ? 'bg-[#8a2be2] text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>Neon Garaj</button>
          </div>
        </div>

        {/* Camera Controls */}
        <div class={`flex items-center gap-6 px-8 py-4 rounded-full backdrop-blur-2xl border pointer-events-auto shadow-2xl ${env === 'daylight' ? 'bg-white/80 border-black/10' : 'bg-[#0a0a0a]/90 border-white/10'}`}>
          <span class={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold ${env === 'daylight' ? 'text-black/60' : 'text-white/50'}`}><kbd class={`px-2 py-1 rounded ${env === 'daylight' ? 'bg-black/5' : 'bg-white/10'}`}>Sol Tık</kbd> Döndür</span>
          <span class={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold ${env === 'daylight' ? 'text-black/60' : 'text-white/50'}`}><kbd class={`px-2 py-1 rounded ${env === 'daylight' ? 'bg-black/5' : 'bg-white/10'}`}>Sağ Tık</kbd> Kaydır</span>
          <span class={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold ${env === 'daylight' ? 'text-black/60' : 'text-white/50'}`}><kbd class={`px-2 py-1 rounded ${env === 'daylight' ? 'bg-black/5' : 'bg-white/10'}`}>Scroll</kbd> Yakınlaş</span>
          <div class={`h-4 w-px mx-2 ${env === 'daylight' ? 'bg-black/10' : 'bg-white/10'}`} />
          <button 
            onClick={resetCamera}
            class={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded transition-colors ${env === 'neon' ? 'text-[#00ffff] hover:bg-[#00ffff]/10' : 'text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'}`}
          >
            Sıfırla (Varsayılan)
          </button>
        </div>
      </div>

    </div>
  )
}

/**
 * -------------------------------------------------------------
 * INTERACTIVE ATTACHMENT WRAPPER
 * -------------------------------------------------------------
 */
function InteractiveAttachment({ w, h, state, isActive, onMoveStart, onRotateStart, children }: any) {
  return (
    <g 
      transform={`translate(${state.x}, ${state.y}) rotate(${state.rot}, ${w/2}, ${h/2})`} 
      style={{ pointerEvents: 'all' }}
      class="group transition-transform duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] animate-in zoom-in-50 slide-in-from-top-10"
    >
      <rect x="-20" y="-20" width={w+40} height={h+40} fill="transparent" class="cursor-move" onMouseDown={onMoveStart} />
      <g class="pointer-events-none">{children}</g>
      
      <g class={`transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <rect x="0" y="0" width={w} height={h} fill="none" stroke="#f59e0b" stroke-width="4" stroke-dasharray="10 6" class="pointer-events-none" />
        <g transform={`translate(${w/2}, -40)`} class="cursor-ew-resize" onMouseDown={onRotateStart}>
          <circle cx="0" cy="0" r="25" fill="rgba(0,0,0,0.8)" stroke="#f59e0b" stroke-width="3" />
          <path d="M -10 -5 Q 0 -10 10 -5 M 10 -5 L 10 0 M -10 -5 L -10 0" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" />
        </g>
      </g>
    </g>
  )
}

/**
 * -------------------------------------------------------------
 * VISUAL ASSETS (HEELPAD & LOGO)
 * -------------------------------------------------------------
 */
function HeelPadVisual() {
  const W = 280
  const H = 160
  const RX = 20
  return (
    <g filter="url(#drop-shadow-heavy)">
      {/* Base Rubber Thick Body */}
      <rect x="0" y="0" width={W} height={H} rx={RX} fill="#1a1a1a" stroke="#0a0a0a" stroke-width="6" />
      {/* Ribbed Rubber Surface */}
      <rect x="10" y="10" width={W-20} height={H-20} rx={RX-5} fill="url(#ribbed-rubber)" />
      {/* Outer Bevel Highlight */}
      <rect x="2" y="2" width={W-4} height={H-4} rx={RX-2} fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" />
      {/* Inner Bevel Shadow */}
      <rect x="10" y="10" width={W-20} height={H-20} rx={RX-5} fill="none" stroke="rgba(0,0,0,0.8)" stroke-width="4" />
      {/* Softbox Glare over the entire heelpad */}
      <rect x="0" y="0" width={W} height={H} rx={RX} fill="url(#curved-glare)" style={{ mixBlendMode: 'screen' }} opacity="0.4" />
    </g>
  )
}

function LogoVisual() {
  return (
    <g filter="url(#drop-shadow-heavy)">
      {/* Base Plastic/Metal Plate */}
      <rect x="0" y="0" width="160" height="55" rx="10" fill="#111" stroke="#333" stroke-width="4" />
      {/* Inner Carbon/Black core */}
      <rect x="5" y="5" width="150" height="45" rx="6" fill="#000" />
      
      {/* Metallic Logo Text with deeply embossed shadow */}
      <text x="80" y="37" fill="url(#brushed-metal)" font-size="26" font-family="sans-serif" font-weight="900" font-style="italic" letter-spacing="3" text-anchor="middle" filter="url(#text-shadow)">CARMAT</text>
      <text x="80" y="36" fill="url(#brushed-metal-light)" font-size="26" font-family="sans-serif" font-weight="900" font-style="italic" letter-spacing="3" text-anchor="middle">CARMAT</text>

      {/* Epoxy Resin Dome Effect (Extreme Photorealism) */}
      <rect x="0" y="0" width="160" height="55" rx="10" fill="url(#epoxy-dome)" style={{ mixBlendMode: 'screen' }} opacity="0.9" />
      <path d="M 5 5 L 155 5 Q 155 25 80 25 Q 5 25 5 5 Z" fill="rgba(255,255,255,0.25)" />
    </g>
  )
}

function MetallicEyelet({ cx, cy }: { cx: number, cy: number }) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {/* Deep hole shadow */}
      <circle cx="0" cy="0" r="32" fill="#000" filter="url(#drop-shadow-heavy)" />
      {/* Outer Brushed Steel Ring */}
      <circle cx="0" cy="0" r="30" fill="url(#brushed-metal)" stroke="#111" stroke-width="2" />
      {/* Inner Ring Bevel */}
      <circle cx="0" cy="0" r="22" fill="url(#brushed-metal-inv)" />
      {/* Floor Pin / Gap */}
      <circle cx="0" cy="0" r="14" fill="#050505" />
      {/* Pin Highlight */}
      <circle cx="0" cy="0" r="14" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" />
      {/* Specular Glare across the metal */}
      <circle cx="0" cy="0" r="30" fill="url(#studio-glare)" style={{ mixBlendMode: 'screen' }} opacity="0.7" />
    </g>
  )
}

function MatLayerStack({ pathD, matHex, borderHex, transform, isDriver, children }: { pathD: string, matHex: string, borderHex: string, transform?: string, isDriver?: boolean, children?: any }) {
  return (
    <g transform={transform} style={{ filter: 'drop-shadow(30px 50px 40px rgba(0,0,0,0.7)) drop-shadow(0px 15px 20px rgba(0,0,0,0.6))' }}>
      
      {/* 1. Base Color Layer (Vivid and 100% Visible) */}
      <path d={pathD} fill={matHex} />

      {/* 2. True EVA Diamond Texture Layer (Uses RGBA, no blend modes that crush highlights) */}
      <path d={pathD} fill="url(#fast-eva-texture)" />

      {/* 3. Studio Softbox Reflection (Hardware Accelerated Gradient, 60 FPS) */}
      <path d={pathD} fill="url(#curved-glare)" style={{ mixBlendMode: 'overlay' }} opacity="0.6" />
      <path d={pathD} fill="url(#studio-glare)" style={{ mixBlendMode: 'screen' }} opacity="0.8" />
      
      {/* 4. Realistic Deep Border System (Leather Texture + Double Stitching) */}
      {/* Inner Depth */}
      <path d={pathD} fill="none" stroke="rgba(0,0,0,0.9)" stroke-width="55" stroke-linejoin="round" />
      
      {/* True Border Color with Leather Pattern overlay */}
      <g stroke-linejoin="round">
        <path d={pathD} fill="none" stroke={borderHex} stroke-width="45" />
        <path d={pathD} fill="none" stroke="url(#leather-pattern)" stroke-width="45" style={{ mixBlendMode: 'multiply' }} opacity="0.6" />
        <path d={pathD} fill="none" stroke="url(#studio-glare)" stroke-width="45" style={{ mixBlendMode: 'screen' }} opacity="0.5" />
      </g>

      {/* Double Stitching (Dış ve İç İplikler) */}
      <path d={pathD} fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="4" stroke-dasharray="18 12" stroke-linejoin="round" transform="scale(0.98) translate(10, 10)" filter="url(#stitch-shadow)" />
      <path d={pathD} fill="none" stroke="rgba(0,0,0,0.8)" stroke-width="2" stroke-dasharray="18 12" stroke-linejoin="round" transform="scale(0.98) translate(12, 12)" />

      <path d={pathD} fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="3" stroke-dasharray="14 10" stroke-linejoin="round" transform="scale(0.95) translate(25, 25)" filter="url(#stitch-shadow)" />
      <path d={pathD} fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="1.5" stroke-dasharray="14 10" stroke-linejoin="round" transform="scale(0.95) translate(26, 26)" />

      {/* Sharp Rim Highlight */}
      <path d={pathD} fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3" stroke-linejoin="round" />

      {/* Metallic Fastening Eyelets (Only on Driver Mat) */}
      {isDriver && (
        <g>
          <MetallicEyelet cx={250} cy={1050} />
          <MetallicEyelet cx={650} cy={1050} />
        </g>
      )}

      {children}
    </g>
  )
}

/**
 * -------------------------------------------------------------
 * TRUE EVA MAT PATTERN & SHOWROOM SHADERS (60 FPS OPTIMIZED)
 * -------------------------------------------------------------
 */
function Defs({ matColor, borderColor, env }: { matColor: MatColor, borderColor: BorderColor, env: 'studio' | 'daylight' | 'neon' }) {
  const isLight = env === 'daylight'
  const isNeon = env === 'neon'

  return (
    <defs>
      {/* 
        TRUE EVA DIAMOND TEXTURE 
        Instead of mix-blend-mode which crushes colors, this uses purely transparent 
        black & white geometric highlights over the vivid base matHex.
      */}
      <pattern id="fast-eva-texture" patternUnits="userSpaceOnUse" width="48" height="48" patternTransform="rotate(45)">
        <rect x="0" y="0" width="48" height="48" fill="transparent" />
        
        {/* Deep, thick walls (Dirt traps characteristics of EVA) */}
        <path d="M0 0 L48 0 L48 48 L0 48 Z" fill="none" stroke="rgba(0,0,0,0.85)" stroke-width="14" />
        
        {/* Wall inner shadow (bottom/right depth) */}
        <path d="M 7 41 L 41 41 L 41 7" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="4" />
        
        {/* Inner Bevel Highlight (light hitting top/left inside wall) */}
        <path d="M 7 7 L 41 7 L 7 41 Z" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="4" />
        
        {/* Raised Center Bump (The shiny 3D bubble in the middle of the cell) */}
        <rect x="14" y="14" width="20" height="20" rx="8" fill="url(#eva-bump-gradient)" />
      </pattern>

      <radialGradient id="eva-bump-gradient" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.6)" />
        <stop offset="40%" stop-color="transparent" />
        <stop offset="100%" stop-color="rgba(0,0,0,0.4)" />
      </radialGradient>

      {/* LEATHER BORDER TEXTURE */}
      <pattern id="leather-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
        <rect width="20" height="20" fill="#888" />
        <path d="M 0 10 Q 5 15 10 10 T 20 10" stroke="#666" fill="none" stroke-width="1" opacity="0.5" />
        <path d="M 10 0 Q 15 5 10 10 T 10 20" stroke="#aaa" fill="none" stroke-width="1" opacity="0.3" />
        <circle cx="5" cy="5" r="1" fill="#444" opacity="0.4" />
        <circle cx="15" cy="15" r="1.5" fill="#bbb" opacity="0.3" />
      </pattern>

      {/* RIBBED RUBBER HEELPAD TEXTURE */}
      <linearGradient id="ribbed-rubber" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#111" />
        <stop offset="10%" stop-color="#333" />
        <stop offset="20%" stop-color="#0a0a0a" />
        <stop offset="30%" stop-color="#111" />
        <stop offset="40%" stop-color="#333" />
        <stop offset="50%" stop-color="#0a0a0a" />
        <stop offset="60%" stop-color="#111" />
        <stop offset="70%" stop-color="#333" />
        <stop offset="80%" stop-color="#0a0a0a" />
        <stop offset="90%" stop-color="#111" />
        <stop offset="100%" stop-color="#333" />
      </linearGradient>

      {/* EPOXY DOME LOGO GLARE */}
      <radialGradient id="epoxy-dome" cx="50%" cy="10%" r="90%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.9)" />
        <stop offset="30%" stop-color="rgba(255,255,255,0.1)" />
        <stop offset="100%" stop-color="rgba(0,0,0,0.6)" />
      </radialGradient>

      {/* METALLIC EYELETS & LOGO BRUSHED STEEL */}
      <linearGradient id="brushed-metal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#555" />
        <stop offset="30%" stop-color="#ddd" />
        <stop offset="50%" stop-color="#888" />
        <stop offset="70%" stop-color="#eee" />
        <stop offset="100%" stop-color="#444" />
      </linearGradient>
      <linearGradient id="brushed-metal-light" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#999" />
        <stop offset="50%" stop-color="#fff" />
        <stop offset="100%" stop-color="#777" />
      </linearGradient>
      <linearGradient id="brushed-metal-inv" x1="100%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="#333" />
        <stop offset="50%" stop-color="#aaa" />
        <stop offset="100%" stop-color="#222" />
      </linearGradient>

      {/* PORSCHE-STYLE STUDIO SOFTBOX GLARE (HARDWARE ACCELERATED) */}
      <linearGradient id="studio-glare" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color={isNeon ? 'rgba(255, 0, 255, 0.4)' : isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)'} />
        <stop offset="25%" stop-color="rgba(255,255,255,0.1)" />
        <stop offset="50%" stop-color="rgba(0,0,0,0)" />
        <stop offset="75%" stop-color="rgba(0,0,0,0.2)" />
        <stop offset="100%" stop-color={isNeon ? 'rgba(0, 255, 255, 0.4)' : 'rgba(0,0,0,0.8)'} />
      </linearGradient>
      
      {/* Curved Softbox Reflection */}
      <radialGradient id="curved-glare" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.5)" />
        <stop offset="40%" stop-color="rgba(255,255,255,0.05)" />
        <stop offset="100%" stop-color="rgba(0,0,0,0.8)" />
      </radialGradient>
      
      <filter id="logo-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="15" stdDeviation="12" flood-color="#000" flood-opacity="0.9" />
      </filter>
      
      {/* Heavy shadow for Eyelets and Heelpad */}
      <filter id="drop-shadow-heavy" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="25" stdDeviation="20" flood-color="#000" flood-opacity="0.95" />
      </filter>

      {/* Crisp shadow for stitching & text */}
      <filter id="text-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="1" flood-color="#000" flood-opacity="1" />
      </filter>
      <filter id="stitch-shadow">
        <feDropShadow dx="0" dy="1" stdDeviation="0.5" flood-color="#000" flood-opacity="0.8" />
      </filter>
    </defs>
  )
}


