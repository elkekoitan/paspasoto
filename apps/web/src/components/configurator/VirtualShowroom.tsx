import { useEffect, useRef } from 'preact/hooks'
import * as THREE from 'three'

export default function VirtualShowroom({ imageUrl }: { imageUrl: string }) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0b0b0f')

    // Camera
    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 0, 0)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountRef.current.appendChild(renderer.domElement)

    // Cinematic Curved Screen
    // Create a large cylinder section representing the driver's POV
    const radius = 60
    const height = 80
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 64, 1, true, -Math.PI / 2.5, Math.PI / 1.25)
    geometry.scale(-1, 1, 1) // Invert so we are inside looking out

    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: false })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(0, 0, -10)
    scene.add(mesh)

    // Load Texture
    const textureLoader = new THREE.TextureLoader()
    textureLoader.load(imageUrl, (texture) => {
      texture.minFilter = THREE.LinearFilter
      material.map = texture
      material.needsUpdate = true
    })

    // Interactive Controls
    let isDragging = false
    let previousMousePosition = { x: 0, y: 0 }
    let cameraRotation = { x: 0, y: 0 }
    let cameraZoom = 65 // FOV

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true
      previousMousePosition = { x: e.clientX, y: e.clientY }
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return
      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      }
      cameraRotation.y += deltaMove.x * 0.0015
      cameraRotation.x += deltaMove.y * 0.0015
      
      cameraRotation.x = Math.max(-0.4, Math.min(0.4, cameraRotation.x))
      cameraRotation.y = Math.max(-0.5, Math.min(0.5, cameraRotation.y))
      previousMousePosition = { x: e.clientX, y: e.clientY }
    }
    const onPointerUp = () => { isDragging = false }
    const onWheel = (e: WheelEvent) => {
      cameraZoom += e.deltaY * 0.05
      cameraZoom = Math.max(30, Math.min(90, cameraZoom))
      camera.fov = cameraZoom
      camera.updateProjectionMatrix()
    }

    const domElement = mountRef.current
    domElement.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    domElement.addEventListener('wheel', onWheel, { passive: true })

    // Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // Animation Loop
    let animationFrameId: number
    const animate = () => {
      // Smooth interpolation
      camera.rotation.y += (cameraRotation.y - camera.rotation.y) * 0.08
      camera.rotation.x += (cameraRotation.x - camera.rotation.x) * 0.08
      renderer.render(scene, camera)
      animationFrameId = requestAnimationFrame(animate)
    }
    animate()

    // Intro pan effect (simulate entering the car)
    cameraRotation.y = -0.3
    cameraRotation.x = -0.2
    setTimeout(() => {
      cameraRotation.y = 0
      cameraRotation.x = 0
    }, 500)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
      domElement.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      domElement.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', onResize)
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [imageUrl])

  return (
    <div
      ref={mountRef}
      class="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0"
    >
      {/* 2D fallback — Three.js init edilmeden veya texture yüklenmeden önce görünür.
          Canvas appendChild'den sonra üstüne gelir; canvas saydam değilse IMG gizlenmiş gibi olur. */}
      <img
        src={imageUrl}
        alt=""
        aria-hidden="true"
        draggable={false}
        class="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        style="z-index: 0;"
      />
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl text-[10px] text-white font-bold tracking-widest uppercase ring-1 ring-white/20 pointer-events-none flex items-center gap-2 z-20 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 9l5-5 5 5M5 15l5 5 5-5M2 12h20" /></svg>
        3D İnceleme: Sürükle ve Yakınlaş
      </div>
    </div>
  )
}
