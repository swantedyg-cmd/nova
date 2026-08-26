'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PIECES, COLLECTIONS, COLLECTION_COLORS, type Collection } from '@/data/catalogue'
import { progressToIndex } from './galleryPath'
import ElectricBorder from './ElectricBorder'
import Tilt from './Tilt'
import LazyStrands from './LazyStrands'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useLanguage } from '@/i18n/LanguageContext'
import { useOrderSelection } from '@/context/OrderSelectionContext'

gsap.registerPlugin(ScrollTrigger)

/* ─── Contiguous collection runs, in catalogue order — used to label the
   current "room" of the flythrough and to let filter pills jump-scroll to
   a collection's starting point. ─────────────────────────────────────── */
const COLLECTION_SEGMENTS = (() => {
  const segs: { name: Collection; start: number; end: number }[] = []
  let start = 0
  for (let i = 1; i <= PIECES.length; i++) {
    if (i === PIECES.length || PIECES[i].collection !== PIECES[start].collection) {
      segs.push({ name: PIECES[start].collection, start, end: i - 1 })
      start = i
    }
  }
  return segs
})()

// How many pieces get roughly one screen's worth of scroll — tunes the
// total length of the pinned flythrough (scales with PIECES.length).
const PIECES_PER_VIEWPORT = 5.5

const GalleryScene = dynamic(() => import('./GalleryScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-parchment flex items-center justify-center">
    <p className="text-xs uppercase tracking-[0.25em] text-charcoal/30 font-body">Loading gallery…</p>
  </div>,
})

/* ─── Mobile swipe carousel card ─────────────────────────────────────── */
function MobileCard({ piece, onClick }: { piece: typeof PIECES[0]; onClick: () => void }) {
  const { from, to, accent } = COLLECTION_COLORS[piece.collection]
  const isPortrait = piece.aspect < 1
  return (
    <Tilt className="gallery-card-mobile flex-shrink-0 rounded-xl overflow-hidden shadow-sm border border-charcoal/8 w-56 md:w-64" max={7}>
      <button onClick={onClick} className="block w-full text-left">
        {/* Artwork */}
        <div
          className="w-full"
          style={{
            paddingTop: `${(1 / piece.aspect) * 100}%`,
            background: piece.image ? undefined : `linear-gradient(160deg, ${from} 0%, ${to} 100%)`,
            position: 'relative',
          }}
        >
          {piece.image ? (
            <Image
              src={`/images/${piece.image}`}
              alt={piece.theme}
              fill
              sizes="256px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-3 rounded-lg" style={{ border: `1.5px solid ${accent}35` }} />
          )}
        </div>
        {/* Label */}
        <div className="bg-canvas px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.2em] font-body mb-1" style={{ color: accent }}>
            {piece.collection}
          </p>
          <p className="font-display text-sm font-medium text-charcoal leading-snug">{piece.theme}</p>
          <p className="mt-1.5 text-xs text-charcoal/45 font-body">{piece.width}×{piece.height} cm</p>
          <p className="mt-0.5 font-body text-sm font-medium text-charcoal">{piece.price.toLocaleString('fr-FR')} DH</p>
        </div>
      </button>
    </Tilt>
  )
}

/* ─── Focused piece detail panel ─────────────────────────────────────── */
function DetailPanel({
  piece,
  onClose,
  onOrder,
  commander,
}: {
  piece: typeof PIECES[0]
  onClose: () => void
  onOrder: () => void
  commander: string
}) {
  const { from, to, accent } = COLLECTION_COLORS[piece.collection]
  const { lang } = useLanguage()

  return (
    <div className="detail-panel fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-80 max-w-[90vw]">
      <ElectricBorder
        color="var(--color-electric-gold)"
        chaos={0.08}
        speed={0.6}
        borderRadius={16}
        style={{ display: 'block' }}
      >
        <div className="rounded-2xl bg-canvas/95 backdrop-blur-md shadow-2xl overflow-hidden">
          {/* Color strip */}
          <div className="h-1.5 w-full" style={{ background: `linear-gradient(to right, ${from}, ${to})` }} />
          <div className="p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] font-body mb-1.5" style={{ color: accent }}>
              {piece.collection}
            </p>
            <h3 className="font-display text-xl font-medium text-charcoal leading-snug">
              {piece.theme}
            </h3>
            <p className="mt-2 text-[13px] italic text-charcoal/55 font-body leading-relaxed">
              {piece.philosophy[lang]}
            </p>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-charcoal/50 font-body">{piece.width}×{piece.height} cm</span>
              <span className="font-body font-medium text-charcoal">{piece.price.toLocaleString('fr-FR')} DH</span>
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-charcoal/35 font-body">
              {piece.quantity} pièces disponibles
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onOrder() }}
                className="flex-1 rounded-full bg-charcoal py-2.5 text-xs text-center font-medium tracking-wide text-canvas transition-all duration-150 active:scale-[0.97] hover:bg-charcoal-mid"
              >
                {commander}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onClose() }}
                className="rounded-full border border-charcoal/20 px-4 py-2.5 text-xs text-charcoal/60 hover:border-charcoal/40 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </ElectricBorder>
    </div>
  )
}

/* ─── Mobile focus lightbox — the phone equivalent of the desktop
   DetailPanel, since there's no 3D frame to zoom in on there. ─────────── */
function MobileLightbox({
  piece,
  onClose,
  onOrder,
  commander,
}: {
  piece: typeof PIECES[0]
  onClose: () => void
  onOrder: () => void
  commander: string
}) {
  const { from, to, accent } = COLLECTION_COLORS[piece.collection]
  const { lang } = useLanguage()

  return (
    <div
      className="md:hidden fixed inset-0 z-50 flex items-center justify-center p-5 bg-charcoal/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="detail-panel w-full max-w-sm rounded-2xl bg-canvas shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative w-full"
          style={{
            paddingTop: `${(1 / piece.aspect) * 100}%`,
            background: piece.image ? undefined : `linear-gradient(160deg, ${from} 0%, ${to} 100%)`,
          }}
        >
          {piece.image && (
            <Image
              src={`/images/${piece.image}`}
              alt={piece.theme}
              fill
              sizes="384px"
              className="object-cover"
            />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-charcoal/60 text-sm text-canvas backdrop-blur-sm"
          >
            ✕
          </button>
        </div>
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(to right, ${from}, ${to})` }} />
        <div className="p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] font-body mb-1.5" style={{ color: accent }}>
            {piece.collection}
          </p>
          <h3 className="font-display text-xl font-medium text-charcoal leading-snug">
            {piece.theme}
          </h3>
          <p className="mt-2 text-[13px] italic text-charcoal/55 font-body leading-relaxed">
            {piece.philosophy[lang]}
          </p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-charcoal/50 font-body">{piece.width}×{piece.height} cm</span>
            <span className="font-body font-medium text-charcoal">{piece.price.toLocaleString('fr-FR')} DH</span>
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-charcoal/35 font-body">
            {piece.quantity} pièces disponibles
          </p>
          <button
            type="button"
            onClick={onOrder}
            className="mt-4 w-full rounded-full bg-charcoal py-3 text-xs text-center font-medium tracking-wide text-canvas transition-all duration-150 active:scale-[0.97] hover:bg-charcoal-mid"
          >
            {commander}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main gallery section ───────────────────────────────────────────── */
export default function GallerySection() {
  const sectionRef       = useRef<HTMLDivElement>(null)
  const headRef          = useRef<HTMLDivElement>(null)
  const stageRef         = useRef<HTMLDivElement>(null)
  const mouseRef         = useRef({ x: 0, y: 0 })
  const progressRef      = useRef(0)
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null)
  const lastIndexRef     = useRef(0)
  const [focusedId,      setFocusedId]      = useState<string | null>(null)
  const [activeCol,      setActiveCol]      = useState<Collection | 'All'>('All')
  const [reducedMotion,  setReducedMotion]  = useState(false)
  const isMobile = useIsMobile()
  const [currentIndex,   setCurrentIndex]   = useState(0)
  const [started,        setStarted]        = useState(false)
  const [stageVisible,   setStageVisible]   = useState(false)
  const { t } = useLanguage()
  const { selectPieceForOrder } = useOrderSelection()

  const currentSegment = useMemo(
    () => COLLECTION_SEGMENTS.find((s) => currentIndex >= s.start && currentIndex <= s.end) ?? COLLECTION_SEGMENTS[0],
    [currentIndex]
  )

  const focusedPiece = focusedId ? PIECES.find((p) => p.id === focusedId) ?? null : null

  const handleFocus = useCallback((id: string | null) => setFocusedId(id), [])
  const clearFocus  = useCallback(() => setFocusedId(null), [])

  // Escape key clears focus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') clearFocus() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [clearFocus])

  // Detect reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
  }, [])

  // The 3D scene (43 pieces, each with its own per-frame animation loop and
  // a loaded photo texture) otherwise mounts the instant this section
  // renders — i.e. immediately on page load, well before anyone scrolls
  // near it — stacking on top of the Hero's own WebGL background and
  // running full-tilt for however long it takes to actually scroll here.
  // Deferring the mount until the stage is nearly in view means that cost
  // is only ever paid once a visitor is actually about to see it.
  useEffect(() => {
    if (isMobile || reducedMotion || !stageRef.current) return
    const el = stageRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStageVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isMobile, reducedMotion])

  // Heading scroll reveal
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headRef.current,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: headRef.current, start: 'top 88%', once: true },
        }
      )
      setTimeout(() => ScrollTrigger.refresh(), 400)
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  // Pin the 3D stage and drive the camera flythrough from scroll progress —
  // this is what replaces the old static cramped cloud with pieces that
  // travel past in exact collection order, one clear "room" at a time.
  useEffect(() => {
    if (isMobile || reducedMotion || !stageRef.current) return
    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: stageRef.current,
        start: 'top top+=76',
        end: () => `+=${(PIECES.length / PIECES_PER_VIEWPORT) * 100}%`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        onUpdate: (self) => {
          progressRef.current = self.progress
          if (self.progress > 0.005) setStarted(true)
          // Shares the camera's own entry/exit-buffered mapping (galleryPath.ts) rather
          // than a naive linear one — otherwise the counter drifts away from what's
          // actually on screen, worst near either end.
          const idx = Math.min(PIECES.length - 1, Math.max(0, Math.round(progressToIndex(self.progress, PIECES.length))))
          if (idx !== lastIndexRef.current) {
            lastIndexRef.current = idx
            setCurrentIndex(idx)
          }
        },
      })
      scrollTriggerRef.current = st
      setTimeout(() => ScrollTrigger.refresh(), 400)
    }, sectionRef)
    return () => { ctx.revert(); scrollTriggerRef.current = null }
  }, [isMobile, reducedMotion])

  // Filter pills also jump-scroll to that collection's starting point,
  // since it may now be several viewport-heights down the flythrough.
  const jumpToCollection = useCallback((col: Collection | 'All') => {
    setActiveCol(col)
    clearFocus()
    const st = scrollTriggerRef.current
    if (col === 'All' || !st) return
    const seg = COLLECTION_SEGMENTS.find((s) => s.name === col)
    if (!seg) return
    const frac = seg.start / (PIECES.length - 1)
    const y = st.start + frac * (st.end - st.start)
    // Native scrollTo, not GSAP's ScrollToPlugin — this project already sets
    // `scroll-behavior: smooth` globally (globals.css), so this animates on
    // its own and matches how the rest of the site scrolls.
    window.scrollTo({ top: y, behavior: 'smooth' })
  }, [clearFocus])

  const filtered = activeCol === 'All' ? PIECES : PIECES.filter((p) => p.collection === activeCol)

  return (
    <section
      id="gallery"
      ref={sectionRef}
      className="relative bg-parchment/80 pt-20 md:pt-28 pb-0 scroll-mt-20"
    >
      {/* ── Heading ── */}
      <div ref={headRef} className="text-center px-6 mb-10 md:mb-12">
        <div className="relative inline-block">
          {!isMobile && (
            <LazyStrands
              className="absolute -inset-x-10 -inset-y-4 pointer-events-none"
              colors={['#C89B3C', '#B0557A', '#5A7AAA']}
              count={3}
              speed={0.35}
              amplitude={0.7}
              waviness={0.9}
              thickness={0.5}
              glow={1.8}
              taper={4}
              spread={1.2}
              intensity={0.4}
              saturation={0.9}
              opacity={0.4}
              scale={2.2}
            />
          )}
          <p className="relative z-10 text-xs uppercase tracking-[0.38em] text-gold font-body mb-2">
            {t.gallery.eyebrow}
          </p>
        </div>
        <h2 className="font-display text-4xl md:text-5xl font-medium text-charcoal">
          {t.gallery.heading}
        </h2>
        <p className="mt-4 text-charcoal/50 font-body font-light max-w-sm mx-auto leading-relaxed text-sm md:text-base">
          {filteredCount(activeCol)} · {focusedId ? t.gallery.subFocused : t.gallery.subDefault}
        </p>
      </div>

      {/* ── Collection filter pills ── */}
      <div className="flex items-center justify-center gap-2 flex-wrap px-6 mb-8 md:mb-10">
        <button
          className={`pill rounded-full px-4 py-1.5 text-xs font-body uppercase tracking-[0.16em] cursor-pointer ${activeCol === 'All' ? 'active' : ''}`}
          onClick={() => jumpToCollection('All')}
        >
          {t.gallery.filterAll}
        </button>
        {COLLECTIONS.map((col) => (
          <button
            key={col}
            className={`pill rounded-full px-4 py-1.5 text-xs font-body uppercase tracking-[0.16em] cursor-pointer ${activeCol === col ? 'active' : ''}`}
            onClick={() => jumpToCollection(col)}
          >
            {col}
          </button>
        ))}
      </div>

      {/* ── 3D flythrough gallery (desktop) — pinned in place while scroll
           drives the camera down a winding corridor past all the pieces in
           collection order. ── */}
      {!reducedMotion && !isMobile && (
        <>
          <div
            ref={stageRef}
            className="hidden md:block relative w-full overflow-hidden"
            style={{ height: '100vh' }}
            role="region"
            aria-label={`3D gallery flythrough — piece ${currentIndex + 1} of ${PIECES.length}, click a frame to focus`}
          >
            {stageVisible ? (
              <GalleryScene
                focusedId={focusedId}
                activeCollection={activeCol}
                onFocus={handleFocus}
                onCanvasClick={clearFocus}
                progressRef={progressRef}
                mouseRef={mouseRef}
              />
            ) : (
              <div className="w-full h-full bg-parchment" />
            )}

            {/* Waypoint — current collection + progress through the pieces */}
            <div className="pointer-events-none absolute top-6 left-6 z-10 md:top-8 md:left-10">
              <p key={currentSegment.name} className="gallery-waypoint font-display text-lg md:text-xl text-charcoal/85 leading-none">
                {currentSegment.name}
              </p>
              <p className="mt-1.5 text-[11px] tracking-[0.2em] uppercase text-charcoal/40 font-body">
                {String(currentIndex + 1).padStart(2, '0')} / {PIECES.length}
              </p>
              <div className="mt-2 h-px w-28 bg-charcoal/12 overflow-hidden">
                <div
                  className="h-full bg-gold transition-[width] duration-150 ease-linear"
                  style={{ width: `${((currentIndex + 1) / PIECES.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Click-outside hint */}
            {focusedId && (
              <button
                className="absolute top-4 right-4 z-20 rounded-full bg-charcoal/8 px-3 py-1.5 text-[11px] font-body text-charcoal/50 hover:bg-charcoal/14 transition-colors"
                onClick={clearFocus}
              >
                {t.gallery.close}
              </button>
            )}
          </div>

          {/* Scroll-to-explore hint, fades once the flythrough begins — rendered
              outside the pinned stage, `fixed` to the true viewport. GSAP pins
              that stage via a CSS transform (not plain position:fixed), and any
              transform on an ancestor becomes the containing block for `fixed`
              descendants, so anything meant to track the real viewport has to
              live outside that subtree. */}
          <div
            className="pointer-events-none fixed inset-x-0 bottom-8 z-10 hidden md:flex flex-col items-center gap-2 transition-opacity duration-500"
            style={{ opacity: started ? 0 : 1 }}
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-charcoal/40 font-body">Scroll</span>
            <svg className="gallery-scroll-hint" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 5L8 11L14 5" stroke="#C89B3C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Focused piece detail overlay — same reasoning: fixed to the true
              viewport, not the pinned (transformed) stage, so the commander
              button and info are never pushed below the visible screen. */}
          {focusedPiece && (
            <DetailPanel
              piece={focusedPiece}
              onClose={clearFocus}
              onOrder={() => { selectPieceForOrder(focusedPiece.id); clearFocus() }}
              commander={t.gallery.commander}
            />
          )}
        </>
      )}

      {/* ── Mobile / reduced-motion carousel ── */}
      <div
        className={`${!reducedMotion ? 'md:hidden' : ''} px-6 pb-24 overflow-x-auto`}
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex gap-4 w-max pb-2">
          {filtered.map((piece) => (
            <div key={piece.id} style={{ scrollSnapAlign: 'start' }}>
              <MobileCard piece={piece} onClick={() => handleFocus(piece.id)} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile focus lightbox */}
      {focusedPiece && (
        <MobileLightbox
          piece={focusedPiece}
          onClose={clearFocus}
          onOrder={() => { selectPieceForOrder(focusedPiece.id); clearFocus() }}
          commander={t.gallery.commander}
        />
      )}

      {/* Reduced-motion static grid (additional fallback) */}
      {reducedMotion && (
        <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-6 px-8 md:px-16 pb-24 max-w-6xl mx-auto">
          {filtered.map((piece) => {
            const { from, to, accent } = COLLECTION_COLORS[piece.collection]
            return (
              <button
                key={piece.id}
                type="button"
                onClick={() => selectPieceForOrder(piece.id)}
                className="gallery-card-mobile rounded-xl overflow-hidden shadow-sm border border-charcoal/8 text-left"
              >
                <div
                  className="w-full"
                  style={{
                    paddingTop: `${(1 / piece.aspect) * 100}%`,
                    background: piece.image ? undefined : `linear-gradient(160deg, ${from} 0%, ${to} 100%)`,
                    position: 'relative',
                  }}
                >
                  {piece.image && (
                    <Image
                      src={`/images/${piece.image}`}
                      alt={piece.theme}
                      fill
                      sizes="300px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="bg-canvas px-4 py-3.5">
                  <p className="text-[10px] uppercase tracking-[0.18em] font-body mb-1" style={{ color: accent }}>
                    {piece.collection}
                  </p>
                  <p className="font-display text-sm font-medium text-charcoal">{piece.theme}</p>
                  <p className="mt-1 text-xs text-charcoal/45 font-body">{piece.width}×{piece.height} cm · {piece.price.toLocaleString('fr-FR')} DH</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

function filteredCount(col: Collection | 'All') {
  if (col === 'All') return PIECES.length
  return PIECES.filter((p) => p.collection === col).length
}
