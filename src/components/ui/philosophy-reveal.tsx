'use client'

import * as React from 'react'

import BlurText from '@/components/BlurText'
import { cn } from '@/lib/utils'

// Card flip is 700ms (duration-700 on the coverflow's flip button) — wait
// for it to settle, then a short beat, before the words start arriving.
const FLIP_DURATION_MS = 700
const BEAT_MS = 150
const REVEAL_DELAY_MS = FLIP_DURATION_MS + BEAT_MS

const TEXT_CLASS =
  'font-serif text-[13px] italic leading-relaxed text-[var(--rq-ink)]/80'

export interface PhilosophyRevealProps {
  text: string
  /** Pass the coverflow's `isRevealed` for the centered card. */
  active: boolean
  className?: string
}

export function PhilosophyReveal({ text, active, className }: PhilosophyRevealProps) {
  const [reducedMotion, setReducedMotion] = React.useState(false)
  const [ready, setReady] = React.useState(false)
  const [sweep, setSweep] = React.useState(false)
  const runId = React.useRef(0)

  React.useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mql.matches)
    const onChange = () => setReducedMotion(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  React.useEffect(() => {
    if (!active) {
      setReady(false)
      setSweep(false)
      // Invalidates the in-flight timer below and forces a fresh BlurText
      // mount (fresh IntersectionObserver, fresh stagger) next reveal.
      runId.current += 1
      return
    }
    if (reducedMotion) return // static branch below handles this case directly

    const id = runId.current
    const timer = setTimeout(() => {
      if (runId.current === id) setReady(true)
    }, REVEAL_DELAY_MS)
    return () => clearTimeout(timer)
  }, [active, reducedMotion])

  // Reduced motion: no stagger, no sweep — the settled state, immediately.
  if (reducedMotion) {
    return (
      <p className={cn(TEXT_CLASS, !active && 'invisible', className)}>
        {text}
      </p>
    )
  }

  // Not revealed yet — invisible but same box, so the card never reflows
  // between the closed and open states.
  if (!active || !ready) {
    return (
      <p className={cn(TEXT_CLASS, 'text-transparent select-none', className)}>
        {text}
      </p>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <BlurText
        key={runId.current}
        text={text}
        animateBy="words"
        direction="top"
        delay={32}
        stepDuration={0.275}
        animationFrom={{ filter: 'blur(10px)', opacity: 0, y: -8 }}
        animationTo={[
          { filter: 'blur(4px)', opacity: 0.6, y: 2 },
          { filter: 'blur(0px)', opacity: 1, y: 0 },
        ]}
        className={TEXT_CLASS}
        onAnimationComplete={() => setSweep(true)}
      />
      {sweep && (
        <p
          key={`sweep-${runId.current}`}
          aria-hidden="true"
          className={cn(TEXT_CLASS, 'philosophy-gold-sweep absolute inset-0')}
          onAnimationEnd={() => setSweep(false)}
        >
          {text}
        </p>
      )}
    </div>
  )
}
