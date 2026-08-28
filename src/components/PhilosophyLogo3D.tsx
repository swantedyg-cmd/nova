'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

const SIZE = 340

// R3F's own ResizeObserver-driven canvas sizing never resolves this
// canvas past the browser's bare default (300x150) here — this component
// sits inside the Philosophy section's GSAP-pinned, perspective/
// preserve-3d transformed layout, which appears to prevent the observer
// from ever firing. Forcing the size explicitly on mount sidesteps
// whatever's swallowing it, rather than chasing the observer itself.
function ForceSize() {
  const { gl, camera } = useThree()
  // Deliberately NOT depending on `size` — gl.setSize can itself cause R3F
  // to report a new `size` object, which would re-trigger this effect and
  // set the size again in a tight loop, pegging the main thread for as
  // long as the canvas stays mounted. Forcing once on mount is enough:
  // gl/camera are stable across the component's lifetime here.
  useEffect(() => {
    // The `true` here matters: it's what actually sets canvas.style.width/
    // height to SIZE. R3F's own ResizeObserver-driven sizing never resolves
    // this canvas past the browser's bare default (300x150), so leaving
    // this false (as it originally was) only fixed the internal drawing
    // buffer resolution and left the canvas visibly tiny in the corner of
    // its 340x340 container.
    gl.setSize(SIZE, SIZE, true)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = 1
      camera.updateProjectionMatrix()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

/* ─── The gold-leaf NOVA mark as a small 3D framed canvas — ported from
   the claude.ai/design "3D Canvas Oil Painting Model" project
   (nova-canvas.html + three-d-stage.js): the same floater-frame
   construction, dimensions, and PBR materials (gold leaf, cream linen
   edge). Adaptations from the source design:
     - the design's own logo-render.png came back truncated through the
       design MCP's 256 KiB file cap, so the artwork face uses this
       project's own nova-logo-icon.png instead — the same mark,
       extracted from the same source PDF, already used site-wide —
       flattened onto an opaque canvas-linen background first (as
       nova-logo-canvas-texture.png): the source PNG is transparent,
       and an untextured-transparent MeshStandardMaterial shows
       whatever raw RGB sits under the alpha instead of true see-through;
     - double-faced: the artwork is printed on both the front and back
       faces (the source design only printed the front), so it reads as
       a finished piece from any angle while it autorotates. The
       original's back-of-frame stretcher bars and hanging wire are
       dropped as a result — hardware sitting on top of a printed face
       doesn't make sense once the back is art too;
     - no ground plane / shadow-catcher (there's no "floor" in a
       compact embedded card), and shadows are off rather than sizing
       a shadow camera frustum for a presentation this small;
     - a "made by Nour" signature, composited onto the artwork with the
       same technique, font, size, color and position as the source
       design's own artCanvas() (Great Vibes cursive, #0d0c0b, 108px on
       a 2048px canvas, bottom-right at (S-150, S-175) with
       textAlign:'right') — loaded here via a normal <link> + document.
       fonts.load(), same as the design, since this is a client-only
       component anyway. */

const CW = 0.72
const CH = 0.72
const CD = 0.035
const GAP = 0.013
const FB = 0.014
const FD = 0.052

const SIGNATURE_FONT = 'Great Vibes'
const SIGNATURE_TEXT = 'made by Nour'

/** Draws the artwork + signature onto a canvas, matching the source
 *  design's artCanvas() exactly (same size, font, color, position). */
function useSignedArtTexture() {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null)

  useEffect(() => {
    let cancelled = false

    const build = async () => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap'
      document.head.appendChild(link)

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image()
        i.onload = () => resolve(i)
        i.onerror = reject
        i.src = '/nova-logo-canvas-texture.png'
      })

      try {
        await document.fonts.load(`96px "${SIGNATURE_FONT}"`)
        await document.fonts.ready
      } catch {}

      if (cancelled) return

      const S = 2048
      const canvas = document.createElement('canvas')
      canvas.width = S
      canvas.height = S
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, S, S)
      ctx.drawImage(img, 0, 0, S, S)
      ctx.fillStyle = '#0d0c0b'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'alphabetic'
      ctx.font = `108px "${SIGNATURE_FONT}", cursive`
      ctx.fillText(SIGNATURE_TEXT, S - 150, S - 175)

      const tex = new THREE.CanvasTexture(canvas)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 8
      setTexture(tex)
    }

    build()
    return () => {
      cancelled = true
    }
  }, [])

  return texture
}

function NovaPaintingModel() {
  const texture = useSignedArtTexture()

  const model = useMemo(() => {
    if (!texture) return null
    const M = {
      linenEdge: new THREE.MeshStandardMaterial({ color: 0xf1e4cf, roughness: 0.95, metalness: 0.0 }),
      art: new THREE.MeshStandardMaterial({
        map: texture,
        color: 0xffffff,
        roughness: 0.6,
        metalness: 0.0,
        emissive: 0xffffff,
        emissiveMap: texture,
        emissiveIntensity: 0.22,
      }),
      gold: new THREE.MeshStandardMaterial({ color: 0xe8bf5c, roughness: 0.26, metalness: 0.4 }),
    }

    const group = new THREE.Group()
    group.name = 'nova_canvas_painting'

    const add = (
      geo: THREE.BufferGeometry,
      mat: THREE.Material | THREE.Material[],
      pos?: [number, number, number],
    ) => {
      const mesh = new THREE.Mesh(geo, mat)
      if (pos) mesh.position.set(pos[0], pos[1], pos[2])
      group.add(mesh)
      return mesh
    }

    // Stretched canvas — the printed artwork sits on both the front and
    // back faces, so the piece reads as a finished print from any angle
    // while it autorotates, rather than showing bare canvas/hardware on
    // the reverse for half the turn.
    add(
      new THREE.BoxGeometry(CW, CH, CD, 1, 1, 1),
      [M.linenEdge, M.linenEdge, M.linenEdge, M.linenEdge, M.art, M.art],
      [0, 0, 0],
    )

    // Floater frame.
    const OW = CW + 2 * (GAP + FB)
    const OH = CH + 2 * (GAP + FB)
    const barV = new THREE.BoxGeometry(FB, OH, FD)
    const barH = new THREE.BoxGeometry(OW - 2 * FB, FB, FD)
    add(barV, M.gold, [-(OW - FB) / 2, 0, 0])
    add(barV, M.gold, [(OW - FB) / 2, 0, 0])
    add(barH, M.gold, [0, (OH - FB) / 2, 0])
    add(barH, M.gold, [0, -(OH - FB) / 2, 0])

    return group
  }, [texture])

  if (!model) return null
  return <primitive object={model} />
}

export default function PhilosophyLogo3D() {
  return (
    <div style={{ width: SIZE, height: SIZE, position: 'relative' }} className="mx-auto">
      <Canvas
        style={{ width: SIZE, height: SIZE }}
        resize={{ scroll: false, debounce: 0 }}
        dpr={1}
        gl={{ antialias: true }}
        camera={{ position: [1.3, 0.75, 1.65], fov: 40 }}
        shadows={false}
      >
        <ForceSize />
        <hemisphereLight args={[0xffffff, 0xd8d2c4, 1.0]} />
        <directionalLight color={0xffffff} intensity={2.2} position={[4, 7, 5]} />
        <directionalLight color={0xfff4e6} intensity={0.5} position={[-5, 3, -4]} />
        <Suspense fallback={null}>
          <NovaPaintingModel />
        </Suspense>
        <OrbitControls
          target={[0, 0, 0]}
          autoRotate
          autoRotateSpeed={1.2}
          enableDamping
          dampingFactor={0.08}
          enableZoom={false}
          enablePan={false}
        />
      </Canvas>
    </div>
  )
}
