'use client'

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { PIECES, COLLECTION_COLORS, type Collection } from '@/data/catalogue'
import { SPACING, ENTRY_LEAD, progressToIndex as progressToIndexShared } from './galleryPath'

/* ─── Procedural gradient texture ────────────────────────────────────── */
function makeArtTexture(from: string, to: string, aspect: number): THREE.CanvasTexture {
  const w = 512
  const h = Math.round(w / aspect)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, w * 0.45, h)
  g.addColorStop(0, from)
  g.addColorStop(1, to)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  // vignette
  const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.12, w / 2, h / 2, h * 0.72)
  v.addColorStop(0, 'rgba(255,255,255,0.05)')
  v.addColorStop(1, 'rgba(0,0,0,0.22)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, w, h)
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

/* ─── Corridor path — pieces alternate left/right along a slow-winding
   hallway, in exact catalogue order (which is already grouped by
   collection). The camera travels a damped, smoothed version of this same
   sweep, so it always "walks" past pieces in sequence instead of a static
   cloud everything is crammed into. Both piece placement and the camera
   rail are pure functions of index, so the layout can never fall out of
   sync with PIECES, however long the catalogue grows. ──────────────────── */
// Since the camera tracks the sweep centerline 1:1, WALL_OFFSET is also the
// closest lateral distance the camera ever passes a piece at (when their z
// aligns). Frames are up to ~1.23 units wide at the half — anything much
// smaller than that here means the camera grazes right past the lit
// metallic mesh at point-blank range, blowing out into a solid gold glare
// (this shipped broken once already; keep well clear of that radius).
const WALL_OFFSET = 2.6
const SWEEP_AMPLITUDE = 1.1  // how far the whole corridor bends left/right
const SWEEP_PERIOD = 16      // pieces per full bend cycle
const LIFT_AMPLITUDE = 0.4   // gentle vertical rise/fall of the corridor
const LIFT_PERIOD = 12
// The camera tracks the sweep centerline 1:1 — with any damping, a piece's
// lateral offset from camera compounds with the sweep's own phase, and can
// swing it outside the frustum entirely (this shipped broken once already).
const CAMERA_SWEEP_DAMP = 1
const CAMERA_LIFT_DAMP = 1
const LOOKAHEAD = 2.0            // how many piece-units ahead the camera looks
// Reveal (brightness/scale) is a function of signed distance ahead of the
// camera, not raw distance — a piece level with or behind the camera is
// beside it, near the edge of (or outside) the frustum, so a *symmetric*
// falloff keeps it looking "revealed" well past the point it's actually
// visible, leaving nothing bright on screen. Peaking a bit ahead and then
// fading QUICKLY as it's approached (vs. gradually while still distant)
// keeps brightness and on-screen visibility in sync.
const REVEAL_PEAK_AHEAD  = 1.8 * SPACING // world units ahead of camera at peak brightness — far
                                          // enough that WALL_OFFSET still sits inside the FOV cone
const REVEAL_PLATEAU     = 0.75 * SPACING // half-width of the "stays fully bright" dwell around the peak
const REVEAL_APPROACH    = 3.2 * SPACING // gradual brighten-up as a piece is approached from afar
// Fades out just as gradually as it brightens. A quick, narrow exit fade
// looks fine everywhere a *next* piece is simultaneously brightening to take
// over — but the last piece in the catalogue has no successor, so a narrow
// exit window leaves it (and the screen) dark well before the camera ever
// finishes approaching it. A wide, symmetric exit costs nothing mid-corridor
// (frustum culling already hides anything behind the camera regardless of
// its opacity) and gives the last piece — and the pin's exit buffer after it
// — a graceful, gradual fade instead of an abrupt one.
const REVEAL_EXIT        = REVEAL_APPROACH

function sweepX(i: number) {
  return Math.sin((i / SWEEP_PERIOD) * Math.PI * 2) * SWEEP_AMPLITUDE
}
function liftY(i: number) {
  return Math.sin((i / LIFT_PERIOD) * Math.PI * 2 + 0.6) * LIFT_AMPLITUDE
}

function generatePathPositions(count: number): [number, number, number][] {
  const positions: [number, number, number][] = []
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? 1 : -1
    positions.push([sweepX(i) + side * WALL_OFFSET, liftY(i), -i * SPACING])
  }
  return positions
}

/** Point along the camera's smoothed rail, at a (possibly fractional) piece index. */
function railPoint(index: number, out: THREE.Vector3) {
  out.set(sweepX(index) * CAMERA_SWEEP_DAMP, liftY(index) * CAMERA_LIFT_DAMP, -index * SPACING)
  return out
}

const BASE: [number, number, number][] = generatePathPositions(PIECES.length)

function progressToIndex(t: number) {
  return progressToIndexShared(t, PIECES.length)
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/* ─── Real photo texture (falls back handled by caller via Suspense) ── */
function RealArtworkMesh({ image, frameW, frameH, visible }: { image: string; frameW: number; frameH: number; visible: boolean }) {
  const texture = useLoader(THREE.TextureLoader, `/images/${image}`)
  texture.colorSpace = THREE.SRGBColorSpace
  return (
    <mesh position={[0, 0, 0.04]}>
      <planeGeometry args={[frameW, frameH]} />
      <meshStandardMaterial map={texture} roughness={0.82} transparent opacity={visible ? 1 : 0} />
    </mesh>
  )
}

/* ─── Procedural gradient fallback mesh ──────────────────────────────── */
function GradientArtworkMesh({ from, to, aspect, frameW, frameH, visible }: { from: string; to: string; aspect: number; frameW: number; frameH: number; visible: boolean }) {
  const artTex = useMemo(() => makeArtTexture(from, to, aspect), [from, to, aspect])
  return (
    <mesh position={[0, 0, 0.04]}>
      <planeGeometry args={[frameW, frameH]} />
      <meshStandardMaterial map={artTex} roughness={0.82} transparent opacity={visible ? 1 : 0} />
    </mesh>
  )
}

/* ─── Single floating framed canvas ─────────────────────────────────── */
interface FrameProps {
  idx: number
  collection: (typeof PIECES)[0]['collection']
  aspect: number
  image?: string
  isFocused: boolean
  anyFocused: boolean
  visible: boolean
  progressRef: React.MutableRefObject<number>
  onFocus: () => void
}

function FloatingFrame({ idx, collection, aspect, image, isFocused, anyFocused, visible, progressRef, onFocus }: FrameProps) {
  const groupRef  = useRef<THREE.Group>(null)
  const targetPos = useRef(new THREE.Vector3(...BASE[idx]))
  const basePos   = BASE[idx]
  const { camera } = useThree()
  const forward   = useRef(new THREE.Vector3())

  const { from, to } = COLLECTION_COLORS[collection]
  const frameH = 1.55
  const frameW = frameH * aspect

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return

    const t  = state.clock.elapsedTime
    const lf = 1 - Math.pow(0.005, delta)

    // Idle float
    const floatY = Math.sin(t * 0.48 + idx * 0.74) * 0.055
    const floatX = Math.cos(t * 0.36 + idx * 0.95) * 0.028

    // Signed distance ahead of the camera (positive = ahead, negative =
    // behind) — see REVEAL_PEAK_AHEAD above for why this fades asymmetrically.
    const cameraIndex = progressToIndex(progressRef.current)
    const signedZ = (idx - cameraIndex) * SPACING
    const past = signedZ - REVEAL_PEAK_AHEAD
    const absPast = Math.abs(past)
    const reveal = absPast <= REVEAL_PLATEAU
      ? 1 // dwelling at full brightness around the peak
      : 1 - smoothstep(REVEAL_PLATEAU, REVEAL_PLATEAU + (past > 0 ? REVEAL_APPROACH : REVEAL_EXIT), absPast)
    const revealOpacity = 0.16 + reveal * 0.84
    const revealScale   = 1 + reveal * 0.14

    let targetOpacityMul = 1

    if (isFocused) {
      camera.getWorldDirection(forward.current)
      targetPos.current.copy(camera.position).addScaledVector(forward.current, 3.4)
    } else if (anyFocused) {
      targetPos.current.set(basePos[0] + floatX, basePos[1] + floatY, basePos[2])
      targetOpacityMul = 0.06
    } else {
      targetPos.current.set(basePos[0] + floatX, basePos[1] + floatY, basePos[2])
    }

    group.position.lerp(targetPos.current, lf)

    const ts = isFocused ? 1.95 : anyFocused ? 0.85 : revealScale
    const s  = group.scale.x
    group.scale.setScalar(s + (ts - s) * lf)

    const baseTarget = !visible ? 0 : isFocused ? 1 : revealOpacity
    const targetOp = baseTarget * targetOpacityMul
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mat = obj.material as THREE.MeshStandardMaterial
        if (mat && typeof mat.opacity === 'number') {
          mat.opacity += (targetOp - mat.opacity) * lf
        }
      }
    })
  })

  return (
    <group ref={groupRef} position={BASE[idx]}>
      {/* Gold outer frame */}
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          // Also stop the underlying native DOM click — otherwise it keeps
          // bubbling to the <Canvas onClick> wrapper (onCanvasClick), which
          // clears focus in the same tick and cancels this selection.
          e.nativeEvent.stopPropagation()
          if (visible) onFocus()
        }}
        onPointerEnter={() => { if (visible) document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { document.body.style.cursor = 'default' }}
      >
        <boxGeometry args={[frameW + 0.09, frameH + 0.09, 0.05]} />
        <meshStandardMaterial color="#C89B3C" roughness={0.22} metalness={0.65} transparent opacity={visible ? 1 : 0} />
      </mesh>

      {/* Cream mat */}
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[frameW + 0.025, frameH + 0.025]} />
        <meshStandardMaterial color="#F4E9D2" roughness={0.95} transparent opacity={visible ? 1 : 0} />
      </mesh>

      {/* Artwork */}
      <Suspense fallback={<GradientArtworkMesh from={from} to={to} aspect={aspect} frameW={frameW} frameH={frameH} visible={visible} />}>
        {image
          ? <RealArtworkMesh image={image} frameW={frameW} frameH={frameH} visible={visible} />
          : <GradientArtworkMesh from={from} to={to} aspect={aspect} frameW={frameW} frameH={frameH} visible={visible} />}
      </Suspense>
    </group>
  )
}

/* ─── Scroll-driven camera rail, with mouse parallax and a soft
   headlight that travels with the camera (the "gallery spotlight"). ──── */
function CameraRig({ progressRef, mouseRef }: { progressRef: React.MutableRefObject<number>; mouseRef: React.MutableRefObject<{ x: number; y: number }> }) {
  const { camera } = useThree()
  const posTmp    = useRef(new THREE.Vector3())
  const lookTmp   = useRef(new THREE.Vector3())
  const lightRef  = useRef<THREE.PointLight>(null)

  useFrame(() => {
    // Positioned directly from scroll progress every frame — GSAP's own
    // `scrub` already smooths the progress value, so an additional lerp here
    // would just be a second, independent smoothing pass on top of it. Under
    // fast or bursty scrolling the two lags compound and the camera drifts
    // away from wherever the "revealed" pieces actually are (which read
    // progress instantly) — pieces vanish off to the side, and the whole
    // scene reads as blank. Direct positioning keeps camera and pieces
    // perfectly in sync at every progress value.
    const index = progressToIndex(progressRef.current)

    railPoint(index, posTmp.current)
    posTmp.current.x += mouseRef.current.x * 0.35
    posTmp.current.y += mouseRef.current.y * 0.22 + 0.15
    camera.position.copy(posTmp.current)

    railPoint(index + LOOKAHEAD, lookTmp.current)
    lookTmp.current.x += mouseRef.current.x * 0.5
    lookTmp.current.y += mouseRef.current.y * 0.3
    camera.lookAt(lookTmp.current)

    if (lightRef.current) {
      lightRef.current.position.set(camera.position.x, camera.position.y + 0.4, camera.position.z + 1.2)
    }
  })

  return <pointLight ref={lightRef} intensity={0.55} color="#FFEFD2" distance={9} decay={2} />
}

/* ─── Full scene ─────────────────────────────────────────────────────── */
interface SceneProps {
  focusedId: string | null
  activeCollection: Collection | 'All'
  onFocus: (id: string | null) => void
  progressRef: React.MutableRefObject<number>
  mouseRef: React.MutableRefObject<{ x: number; y: number }>
}

function Scene({ focusedId, activeCollection, onFocus, progressRef, mouseRef }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.7} color="#F9F0E5" />
      <directionalLight position={[5, 8, 5]}  intensity={1.1} color="#FFF8EE" />
      <directionalLight position={[-6, 2, -4]} intensity={0.3} color="#E8C880" />

      <Suspense fallback={null}>
        {PIECES.map((piece, i) => (
          <FloatingFrame
            key={piece.id}
            idx={i}
            collection={piece.collection}
            aspect={piece.aspect}
            image={piece.image}
            isFocused={focusedId === piece.id}
            anyFocused={focusedId !== null}
            visible={activeCollection === 'All' || piece.collection === activeCollection}
            progressRef={progressRef}
            onFocus={() => onFocus(focusedId === piece.id ? null : piece.id)}
          />
        ))}
      </Suspense>

      <CameraRig progressRef={progressRef} mouseRef={mouseRef} />
    </>
  )
}

/* ─── Exported Canvas wrapper ────────────────────────────────────────── */
interface GallerySceneProps extends SceneProps {
  onCanvasClick: () => void
}

export default function GalleryScene({ focusedId, activeCollection, onFocus, onCanvasClick, progressRef, mouseRef }: GallerySceneProps) {
  return (
    <Canvas
      style={{ width: '100%', height: '100%' }}
      camera={{ position: [0, 0.15, ENTRY_LEAD * SPACING], fov: 60, near: 0.1, far: 60 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
      dpr={[1, 1.5]}
      onClick={onCanvasClick}
      onPointerMove={(e) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2
        mouseRef.current.y = ((e.clientY - rect.top)  / rect.height - 0.5) * -2
      }}
    >
      <color attach="background" args={['#F1E3C8']} />
      <fog attach="fog" args={['#F1E3C8', SPACING * 3.5, SPACING * 9]} />
      <Scene focusedId={focusedId} activeCollection={activeCollection} onFocus={onFocus} progressRef={progressRef} mouseRef={mouseRef} />
    </Canvas>
  )
}
