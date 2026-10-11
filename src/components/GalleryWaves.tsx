'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ─── Silk currents — braided oat-and-gold ribbons flowing down the
   collection corridor.

   Each current is a braid of three ribbons sharing one lane, phased a third
   of a turn apart, so they weave around each other — touching and crossing
   — instead of running in parallel. Every ribbon follows the corridor's
   own sweep and lift (same functions the frames and camera use), so the
   silk belongs to the architecture rather than floating over it.

   Behaviour, all in the shader (one draw call per ribbon, no per-frame
   geometry work on the CPU):
     - flow: the weave travels steadily toward the visitor;
     - surge: scroll speed feeds amplitude, twist and flow speed, so a fast
       scroll makes the silk rush and swell, then settle;
     - presentation glow: the strands light up gold beneath whichever piece
       is currently presented, leading the eye to it;
     - colour: oat silk on the face, turning gold where the ribbon twists
       edge-on, with a travelling gold shimmer and fine thread texture.

   Colours go in as raw sRGB triplets on purpose: a plain ShaderMaterial
   writes straight to the output, so THREE.Color's linear conversion would
   wash them out. */

const TAU = Math.PI * 2

function srgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

const OAT        = '#D6C09A'
const GOLD       = '#D4A42E'
const GOLD_LIGHT = '#F5D07A'

const vertexShader = /* glsl */ `
  uniform float uFlow;
  uniform float uSurge;
  uniform float uLane;
  uniform float uBaseY;
  uniform float uPhase;
  uniform float uWidth;
  uniform float uAmp;
  uniform float uDrift;
  uniform float uSweepAmp;
  uniform float uSweepPeriod;
  uniform float uLiftAmp;
  uniform float uLiftPeriod;
  uniform float uSpacing;
  uniform float uZStart;
  uniform float uZEnd;

  varying float vU;
  varying float vI;
  varying float vTwist;
  varying float vDepth;

  const float TAU = 6.28318530718;

  float sweepX(float i) { return sin(i / uSweepPeriod * TAU) * uSweepAmp; }
  float liftY(float i)  { return sin(i / uLiftPeriod * TAU + 0.6) * uLiftAmp; }

  void main() {
    float z = mix(uZStart, uZEnd, uv.y);
    float i = -z / uSpacing;

    float amp = uAmp * (1.0 + uSurge * 1.1);
    float cx = sweepX(i) + uLane + uDrift * sin(i * 0.85 - uFlow * 0.7 + uPhase);
    float cy = uBaseY + liftY(i) + amp * sin(i * 1.25 - uFlow + uPhase);

    // The ribbon rolls along its length; a surge adds a faster ripple.
    float twist = 1.15 * sin(i * 0.6 - uFlow * 0.45 + uPhase * 1.3)
                + uSurge * 0.7 * sin(i * 2.1 - uFlow * 1.6 + uPhase);

    float across = (uv.x - 0.5) * uWidth;
    vec3 p = vec3(cx + cos(twist) * across, cy + sin(twist) * across, z);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mv.z;
    vU = uv.x;
    vI = i;
    vTwist = twist;
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uOat;
  uniform vec3 uGold;
  uniform vec3 uGoldLight;
  uniform float uFlow;
  uniform float uPresent;
  uniform float uSurge;
  uniform float uOpacity;
  uniform float uDim;
  uniform float uFadeNear;
  uniform float uFadeFar;

  varying float vU;
  varying float vI;
  varying float vTwist;
  varying float vDepth;

  void main() {
    // Soft selvedge edges — silk, not a cut strip.
    float edge = smoothstep(0.0, 0.2, vU) * smoothstep(1.0, 0.8, vU);

    // Face-on reads as oat; turning edge-on catches the gold.
    float facing = abs(cos(vTwist));
    float sheen = pow(1.0 - facing, 1.6);

    // Fine woven threads along the ribbon.
    float threads = 0.96 + 0.04 * sin(vU * 120.0);

    // A gold shimmer travelling down the silk.
    float shimmer = pow(0.5 + 0.5 * sin(vI * 1.7 - uFlow * 2.2), 10.0);

    // Glow beneath the piece currently being presented.
    float d = vI - uPresent;
    float glow = exp(-d * d * 1.2);

    float goldMix = clamp(sheen * 0.62 + glow * 0.6 + uSurge * 0.2, 0.0, 1.0);
    vec3 col = mix(uOat, uGold, goldMix);
    col += uGoldLight * (shimmer * 0.4 + glow * 0.22);
    col *= threads;

    // Matches the scene fog's range, and clears out right at the lens so a
    // ribbon never smears across the camera.
    float fade = smoothstep(uFadeFar, uFadeNear, vDepth) * smoothstep(1.0, 3.4, vDepth);

    float a = uOpacity * edge * fade * (0.55 + 0.45 * facing + glow * 0.35) * uDim;
    if (a < 0.003) discard;
    gl_FragColor = vec4(col, a);
  }
`

/* Lanes are relative to the corridor centreline (sweepX). */
const CURRENTS = [
  // The river: a wide braid along the floor, leading the eye forward.
  { lane: 0,    baseY: -1.6,  width: 0.46, amp: 0.24, drift: 0.5,  opacity: 0.92 },
  // Under each wall of canvases, cradling the frames from below.
  { lane: 2.6,  baseY: -1.32, width: 0.24, amp: 0.13, drift: 0.2,  opacity: 0.7 },
  { lane: -2.6, baseY: -1.32, width: 0.24, amp: 0.13, drift: 0.2,  opacity: 0.7 },
  // A faint canopy overhead, closing the space.
  { lane: 0,    baseY: 2.45,  width: 0.22, amp: 0.16, drift: 0.7,  opacity: 0.22 },
]
const STRANDS = 3

interface GalleryWavesProps {
  progressRef: React.MutableRefObject<number>
  progressToIndex: (t: number) => number
  peakIndexAhead: number
  count: number
  spacing: number
  entryLead: number
  sweepAmplitude: number
  sweepPeriod: number
  liftAmplitude: number
  liftPeriod: number
  fadeNear: number
  fadeFar: number
  dimmed: boolean
}

export default function GalleryWaves({
  progressRef, progressToIndex, peakIndexAhead, count, spacing, entryLead,
  sweepAmplitude, sweepPeriod, liftAmplitude, liftPeriod, fadeNear, fadeFar, dimmed,
}: GalleryWavesProps) {
  // Long in z, few segments across — the silk only ever bends along its run.
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 8, 700), [])

  // Shared uniforms (one object, referenced by every ribbon) for everything
  // that changes per frame; per-ribbon shape values live on each material.
  const shared = useMemo(() => ({
    uFlow:        { value: 0 },
    uSurge:       { value: 0 },
    uPresent:     { value: 0 },
    uDim:         { value: 1 },
    uOat:         { value: srgb(OAT) },
    uGold:        { value: srgb(GOLD) },
    uGoldLight:   { value: srgb(GOLD_LIGHT) },
    uSweepAmp:    { value: sweepAmplitude },
    uSweepPeriod: { value: sweepPeriod },
    uLiftAmp:     { value: liftAmplitude },
    uLiftPeriod:  { value: liftPeriod },
    uSpacing:     { value: spacing },
    uZStart:      { value: (entryLead + 1) * spacing },
    uZEnd:        { value: -(count - 1 + 3) * spacing },
    uFadeNear:    { value: fadeNear },
    uFadeFar:     { value: fadeFar },
  }), [sweepAmplitude, sweepPeriod, liftAmplitude, liftPeriod, spacing, entryLead, count, fadeNear, fadeFar])

  const materials = useMemo(() => {
    const list: THREE.ShaderMaterial[] = []
    CURRENTS.forEach((c, ci) => {
      for (let s = 0; s < STRANDS; s++) {
        list.push(new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          uniforms: {
            ...shared,
            uLane:    { value: c.lane },
            uBaseY:   { value: c.baseY },
            uPhase:   { value: (s / STRANDS) * TAU + ci * 0.9 },
            uWidth:   { value: c.width },
            uAmp:     { value: c.amp },
            uDrift:   { value: c.drift },
            uOpacity: { value: c.opacity },
          },
        }))
      }
    })
    return list
  }, [shared])

  const groupRef = useRef<THREE.Group>(null)
  const lastIndex = useRef<number | null>(null)
  const surge = useRef(0)

  useFrame((_, delta) => {
    const first = groupRef.current?.children[0] as THREE.Mesh | undefined
    if (!first) return
    // Per-frame values are shared by every ribbon, so updating them through
    // any one material updates the whole weave.
    const u = (first.material as THREE.ShaderMaterial).uniforms

    const dt = Math.min(delta, 0.05)
    const index = progressToIndex(progressRef.current)

    // Scroll speed in pieces/second → a surge that rises fast, settles slow.
    const speed = lastIndex.current === null ? 0 : Math.abs(index - lastIndex.current) / Math.max(dt, 1e-3)
    lastIndex.current = index
    const target = Math.min(speed * 0.45, 1.6)
    const rate = target > surge.current ? 6 : 1.6
    surge.current += (target - surge.current) * (1 - Math.exp(-dt * rate))

    u.uSurge.value = surge.current
    u.uFlow.value += dt * (0.55 + surge.current * 2.8)
    u.uPresent.value = index + peakIndexAhead
    u.uDim.value += ((dimmed ? 0.22 : 1) - u.uDim.value) * (1 - Math.exp(-dt * 5))
  })

  return (
    <group ref={groupRef}>
      {materials.map((m, i) => (
        // The plane's own bounds are meaningless once the shader places it,
        // so culling is off — the ribbons span the whole corridor anyway.
        <mesh key={i} geometry={geometry} material={m} frustumCulled={false} renderOrder={-1} />
      ))}
    </group>
  )
}
