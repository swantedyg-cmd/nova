'use client'

import { Suspense, useEffect, useMemo } from 'react'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

const SIZE = 280

// R3F's own ResizeObserver-driven canvas sizing never resolves this
// canvas past the browser's bare default (300x150) here — this component
// sits inside the Philosophy section's GSAP-pinned, perspective/
// preserve-3d transformed layout, which appears to prevent the observer
// from ever firing. Forcing the size explicitly on mount sidesteps
// whatever's swallowing it, rather than chasing the observer itself.
function ForceSize() {
  const { gl, camera, size } = useThree()
  useEffect(() => {
    gl.setSize(SIZE, SIZE, false)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = 1
      camera.updateProjectionMatrix()
    }
  }, [gl, camera, size])
  return null
}

/* ─── The gold-leaf NOVA mark as a small 3D framed canvas — ported from
   the claude.ai/design "3D Canvas Oil Painting Model" project
   (nova-canvas.html + three-d-stage.js): the same floater-frame
   construction, dimensions, and PBR materials (gold leaf, burnished
   gold, walnut stretcher, linen edge). Two adaptations for embedding
   here rather than as a standalone full-viewport piece:
     - the design's own logo-render.png came back truncated through the
       design MCP's 256 KiB file cap, so the artwork face uses this
       project's own nova-logo-icon.png instead — the same mark,
       extracted from the same source PDF, already used site-wide —
       flattened onto an opaque canvas-linen background first (as
       nova-logo-canvas-texture.png): the source PNG is transparent,
       and an untextured-transparent MeshStandardMaterial shows
       whatever raw RGB sits under the alpha instead of true see-through;
     - no ground plane / shadow-catcher (there's no "floor" in a
       compact embedded card), and shadows are off rather than sizing
       a shadow camera frustum for a presentation this small. */

const CW = 0.72
const CH = 0.72
const CD = 0.035
const GAP = 0.013
const FB = 0.014
const FD = 0.052

function NovaPaintingModel() {
  const texture = useLoader(THREE.TextureLoader, '/nova-logo-canvas-texture.png')
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8

  const model = useMemo(() => {
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
      goldDeep: new THREE.MeshStandardMaterial({ color: 0xc08a33, roughness: 0.38, metalness: 0.34 }),
      walnut: new THREE.MeshStandardMaterial({ color: 0x6a4a30, roughness: 0.72, metalness: 0.0 }),
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

    // Stretched canvas — the printed artwork sits on the front face.
    add(
      new THREE.BoxGeometry(CW, CH, CD, 1, 1, 1),
      [M.linenEdge, M.linenEdge, M.linenEdge, M.linenEdge, M.art, M.linenEdge],
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

    // Stretcher bars + brace on the back.
    const SB = 0.038
    const ST = 0.018
    const sz = -CD / 2 - ST / 2 + 0.001
    add(new THREE.BoxGeometry(SB, CH - 0.02, ST), M.walnut, [-(CW / 2 - SB / 2 - 0.014), 0, sz])
    add(new THREE.BoxGeometry(SB, CH - 0.02, ST), M.walnut, [CW / 2 - SB / 2 - 0.014, 0, sz])
    add(new THREE.BoxGeometry(CW - 0.028 - 2 * SB, SB, ST), M.walnut, [0, CH / 2 - SB / 2 - 0.014, sz])
    add(new THREE.BoxGeometry(CW - 0.028 - 2 * SB, SB, ST), M.walnut, [0, -(CH / 2 - SB / 2 - 0.014), sz])
    add(new THREE.BoxGeometry(CW - 0.028 - 2 * SB, 0.028, ST * 0.8), M.walnut, [0, 0, sz])

    // Hanging wire.
    const wireCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-(CW / 2 - SB / 2 - 0.014), CH * 0.22, sz - ST / 2),
      new THREE.Vector3(0, CH * 0.14, sz - ST / 2),
      new THREE.Vector3(CW / 2 - SB / 2 - 0.014, CH * 0.22, sz - ST / 2),
    ])
    add(new THREE.TubeGeometry(wireCurve, 40, 0.0016, 10, false), M.goldDeep)

    return group
  }, [texture])

  return <primitive object={model} />
}

export default function PhilosophyLogo3D() {
  return (
    <div style={{ width: SIZE, height: SIZE, position: 'relative' }} className="mx-auto">
      <Canvas
        style={{ width: SIZE, height: SIZE }}
        resize={{ scroll: false, debounce: 0 }}
        dpr={[1, 1.5]}
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
