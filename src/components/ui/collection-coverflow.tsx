// Save as: components/ui/collection-coverflow.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { PhilosophyReveal } from "@/components/ui/philosophy-reveal";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export interface CollectionPiece {
  /** Stable id — also used as the React key. */
  id: string;
  /** Public path to the artwork image, e.g. "/images/JYO38053-N.jpg". */
  src: string;
  alt: string;
  title: string;
  category: string;
  /** e.g. "70 × 100 cm" */
  size?: string;
  /** Price in the given currency, as a plain number. */
  price: number;
  /** Pieces currently available. 1 renders as "Pièce unique". */
  quantity: number;
  /** One or two sentences in the curator's voice — shown on the reveal. */
  philosophy: string;
}

/** All user-facing strings — override to localize; defaults are French. */
export interface CollectionCoverflowLabels {
  uniquePiece: string;
  soldOut: string;
  availableSuffix: string;
  price: string;
  edition: string;
  prevAria: string;
  nextAria: string;
  goToPrefix: string;
  numberPrefix: string;
  revealAria: string;
  hideAria: string;
}

const DEFAULT_LABELS: CollectionCoverflowLabels = {
  uniquePiece: "Pièce unique",
  soldOut: "Épuisé",
  availableSuffix: "exemplaires disponibles",
  price: "Prix",
  edition: "Édition",
  prevAria: "Œuvre précédente",
  nextAria: "Œuvre suivante",
  goToPrefix: "Aller à",
  numberPrefix: "N°",
  revealAria: "Voir la philosophie, le prix et la quantité",
  hideAria: "Masquer les informations",
};

export interface CollectionCoverflowProps {
  pieces: CollectionPiece[];
  currency?: string;
  rotate?: number;
  depth?: number;
  perspective?: number;
  falloff?: number;
  fade?: number;
  cardWidth?: string;
  gap?: number;
  loop?: boolean;
  showNavigation?: boolean;
  showPagination?: boolean;
  label?: string;
  labels?: Partial<CollectionCoverflowLabels>;
  className?: string;
  cardClassName?: string;
  onActiveChange?: (piece: CollectionPiece, index: number) => void;
}

function quantityLabel(quantity: number, labels: CollectionCoverflowLabels) {
  if (quantity <= 0) return labels.soldOut;
  if (quantity === 1) return labels.uniquePiece;
  return `${quantity} ${labels.availableSuffix}`;
}

// Gold-framed pill for the card back's quantity line — border/background/text
// colors shift by availability, matching the rest of the Nova palette.
function quantityPillClass(quantity: number) {
  if (quantity <= 0) return "border-[#2C1810]/20 text-[#2C1810]/35 line-through";
  if (quantity === 1) return "border-[#D4A42E] text-[#D4A42E] bg-[rgba(212,164,46,0.08)]";
  return "border-[#2C1810]/15 text-[#2C1810]/50";
}

export function CollectionCoverflow({
  pieces,
  currency = "DH",
  rotate = 40,
  depth = 0.62,
  perspective = 2.6,
  falloff = 0.56,
  fade = 0.12,
  cardWidth = "clamp(190px, 26vw, 300px)",
  gap = 0.16,
  loop = true,
  showNavigation = true,
  showPagination = true,
  label = "La collection",
  labels: labelsProp,
  className,
  cardClassName,
  onActiveChange,
}: CollectionCoverflowProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const count = pieces.length;

  const frameRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const frontRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const badgeRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  /** Fractional card index at the centre — single source of truth. */
  const posRef = React.useRef(0);
  const targetRef = React.useRef(0);
  const widthRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  /** True once a pointer-down has moved past the tap threshold, so a drag
      release never gets mistaken for a tap-to-flip. */
  const draggedRef = React.useRef(false);
  const dragRef = React.useRef<{
    id: number;
    x: number;
    pos: number;
    v: number;
    t: number;
  } | null>(null);

  const [selected, setSelected] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  // Fade each artwork in only once its own <Image> has actually decoded —
  // otherwise a card that's mid-transition into view can briefly show as a
  // flat grey box while its (still lazy-loading) image is in flight.
  const [loadedIds, setLoadedIds] = React.useState<Set<string>>(new Set());
  const markLoaded = React.useCallback((id: string) => {
    setLoadedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  // Single source of truth for closing the label: whatever caused `selected`
  // to change — drag, arrow keys, dots, nav buttons — a new piece never
  // inherits the last one's reveal state.
  React.useEffect(() => {
    setRevealed(false);
  }, [selected]);

  const indexAt = React.useCallback(
    (pos: number) => ((Math.round(pos) % count) + count) % count,
    [count],
  );

  const paint = React.useCallback(() => {
    const width = widthRef.current;
    if (!width) return;
    const pitch = width * (1 + gap);
    const pos = posRef.current;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      let offset = index - pos;
      if (loop) {
        offset = ((offset % count) + count) % count;
        if (offset > count / 2) offset -= count;
      }

      const distance = Math.abs(offset);
      const ramp = Math.pow(distance, falloff);
      const tilt = Math.min(rotate * ramp, 80) * Math.sign(offset);
      // Subtle wave float, phase-shifted per card position, so the whole
      // carousel breathes gently rather than sitting dead still between
      // drags — same rAF loop, no extra listeners.
      const floatY = Math.sin((offset + pos) * 0.8) * 8;

      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) ` +
        `translateZ(${-depth * width * ramp}px) ` +
        `rotateY(${-tilt}deg) ` +
        `translateY(${floatY}px)`;

      const edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
      card.style.opacity = String(Math.max(0, 1 - fade * distance) * edge);
      card.style.zIndex = String(100 - Math.round(distance));
      // Cards far enough from center are visually irrelevant (buried under
      // the perspective falloff) — dropping them from the compositor/paint
      // tree here is cheap insurance against a wide, image-heavy carousel
      // ever taxing the GPU the way the site's WebGL sections once did.
      card.style.visibility = distance > 2 ? "hidden" : "visible";

      const front = frontRefs.current[index];
      if (front) {
        front.style.boxShadow =
          distance < 0.5
            ? "0 0 0 2px #D4A42E, 0 0 0 4px rgba(212,164,46,0.3), 0 40px 80px rgba(0,0,0,0.5)"
            : "0 20px 40px rgba(0,0,0,0.35)";
      }

      // Driven imperatively in lockstep with position (like the transform
      // above) rather than from React state — otherwise, on a fast fling,
      // the badge would jump to the destination card several re-renders
      // before it's actually visible there. Uses visibility, not opacity —
      // the badge's own pulse animation keyframes opacity, which would
      // otherwise override a plain opacity toggle while the animation runs.
      const badge = badgeRefs.current[index];
      if (badge) badge.style.visibility = distance < 0.5 ? "visible" : "hidden";
    });
  }, [count, depth, fade, falloff, gap, loop, rotate]);

  const settle = React.useCallback(
    (target: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      targetRef.current = target;
      setSelected(indexAt(target));

      let lastTime: number | null = null;
      const step = (time: number) => {
        const dt = lastTime === null ? 1000 / 60 : time - lastTime;
        lastTime = time;

        const remaining = target - posRef.current;
        if (Math.abs(remaining) < 0.0004) {
          posRef.current = target;
          paint();
          rafRef.current = null;
          return;
        }
        // Exponential ease-out, normalized to a 60fps baseline so a dropped
        // frame (e.g. while a large image decodes) can't make the carousel
        // visibly hitch — it keeps the same real-time settle speed either way.
        const decay = 1 - Math.pow(1 - 0.16, dt / (1000 / 60));
        posRef.current += remaining * decay;
        paint();
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [indexAt, paint],
  );

  const clamp = React.useCallback(
    (pos: number) => (loop ? pos : Math.max(0, Math.min(count - 1, pos))),
    [count, loop],
  );

  const goTo = React.useCallback(
    (index: number) => {
      const target = loop
        ? index + Math.round((targetRef.current - index) / count) * count
        : index;
      settle(clamp(target));
    },
    [clamp, count, loop, settle],
  );

  const nudge = React.useCallback(
    (by: number) => settle(clamp(Math.round(targetRef.current) + by)),
    [clamp, settle],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    draggedRef.current = false;
    targetRef.current = posRef.current;
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      pos: posRef.current,
      v: 0,
      t: performance.now(),
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;

    const pitch = widthRef.current * (1 + gap);
    if (!pitch) return;

    if (Math.abs(event.clientX - drag.x) > 6) draggedRef.current = true;

    const now = performance.now();
    const previous = posRef.current;
    posRef.current = clamp(drag.pos - (event.clientX - drag.x) / pitch);
    drag.v = ((posRef.current - previous) / Math.max(now - drag.t, 1)) * 1000;
    drag.t = now;

    paint();
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    const carried = Math.max(-2, Math.min(2, drag.v * 0.18));
    settle(clamp(Math.round(posRef.current + carried)));
  };

  const handleCardTap = React.useCallback(
    (index: number) => {
      if (draggedRef.current) return;
      if (index === selected) {
        setRevealed((value) => !value);
      } else {
        goTo(index);
      }
    },
    [goTo, selected],
  );

  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      const card = cardRefs.current[0];
      if (!card) return;
      widthRef.current = card.offsetWidth;
      paint();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [paint]);

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  React.useEffect(() => {
    const piece = pieces[selected];
    if (piece) onActiveChange?.(piece, selected);
  }, [pieces, selected, onActiveChange]);

  const activePiece = pieces[selected];

  return (
    <div
      className={cn("w-full", className)}
      style={{ ["--cf-card" as string]: cardWidth }}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      {activePiece && (
        <div className="mb-5 px-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#D4A42E]">
                {activePiece.category}
              </p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-[#2C1810]/45">
                {labels.numberPrefix} {String(selected + 1).padStart(2, "0")} / {count}
              </p>
            </motion.div>
          </AnimatePresence>
          <div className="mt-2 h-px w-8 bg-[#D4A42E]" />
        </div>
      )}

      <div className="relative">
        <div
          ref={frameRef}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              nudge(-1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              nudge(1);
            } else if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setRevealed((value) => !value);
            } else if (event.key === "Escape") {
              setRevealed(false);
            }
          }}
          className="cursor-grab overflow-hidden py-12 outline-none active:cursor-grabbing"
          style={{
            perspective: `calc(var(--cf-card) * ${perspective})`,
            touchAction: "pan-y",
          }}
        >
          <div
            className="relative select-none"
            style={{
              height: "calc(var(--cf-card) * 5 / 4)",
              transformStyle: "preserve-3d",
            }}
          >
            {pieces.map((piece, index) => {
              const isActive = index === selected;
              const isRevealed = isActive && revealed;
              const isLoaded = loadedIds.has(piece.id);

              return (
                <div
                  key={piece.id}
                  ref={(node) => {
                    cardRefs.current[index] = node;
                  }}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${count}: ${piece.title}`}
                  className="absolute left-1/2 top-0 will-change-transform"
                  style={{
                    width: "var(--cf-card)",
                    aspectRatio: "4 / 5",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <button
                    type="button"
                    tabIndex={isActive ? 0 : -1}
                    aria-pressed={isRevealed}
                    aria-label={
                      isActive
                        ? isRevealed
                          ? `${labels.hideAria} — ${piece.title}`
                          : `${labels.revealAria} — ${piece.title}`
                        : piece.title
                    }
                    onClick={() => handleCardTap(index)}
                    className={cn(
                      "group relative h-full w-full rounded-[2px] text-left transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
                      cardClassName,
                    )}
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isRevealed
                        ? "rotateY(180deg)"
                        : "rotateY(0deg)",
                      willChange: "transform",
                    }}
                  >
                    {/* Front — the artwork */}
                    <div
                      ref={(node) => {
                        frontRefs.current[index] = node;
                      }}
                      aria-hidden={isRevealed}
                      className="absolute inset-0 overflow-hidden rounded-[2px] bg-[#2C1810]"
                      style={{ backfaceVisibility: "hidden", transition: "box-shadow 0.4s ease" }}
                    >
                      <Image
                        src={piece.src}
                        alt={piece.alt}
                        fill
                        draggable={false}
                        priority={index === 0}
                        loading={index === 0 ? "eager" : "lazy"}
                        quality={75}
                        sizes="(max-width: 640px) 85vw, (max-width: 1024px) 40vw, 300px"
                        onLoad={() => markLoaded(piece.id)}
                        className="select-none object-cover"
                        style={{
                          opacity: isLoaded ? 1 : 0,
                          transition: "opacity 0.4s ease",
                        }}
                      />
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to top, rgba(44,24,16,0.88) 0%, rgba(44,24,16,0.4) 35%, transparent 65%)",
                        }}
                      />

                      {isActive && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
                        >
                          <div
                            className="absolute inset-y-0 -left-1/2 w-1/3"
                            style={{
                              background:
                                "linear-gradient(105deg, transparent 40%, rgba(245,208,122,0.25) 50%, transparent 60%)",
                              animation: "coverflowShimmer 3s ease-in-out infinite",
                            }}
                          />
                        </div>
                      )}

                      {piece.quantity === 1 && (
                        <span className="absolute left-3 top-3 rounded-full border border-[#D4A42E]/50 bg-black/40 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-[#D4A42E] backdrop-blur-sm">
                          {labels.uniquePiece}
                        </span>
                      )}

                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#D4A42E]">
                          {piece.category}
                        </p>
                        <p className="mt-1 font-serif text-base italic leading-snug text-[#F5EDD6]">
                          {piece.title}
                        </p>
                      </div>

                      <span
                        ref={(node) => {
                          badgeRefs.current[index] = node;
                        }}
                        aria-hidden={!isActive}
                        className="pointer-events-none absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-[3px] border-[1.5px] border-[#D4A42E] bg-[rgba(212,164,46,0.15)] text-[#D4A42E] backdrop-blur-sm before:absolute before:inset-0 before:rounded-full before:border before:border-[rgba(212,164,46,0.4)] before:content-[''] before:animate-[coverflowRingPulse_2s_ease-out_infinite] motion-reduce:before:animate-none"
                        style={{ visibility: isActive ? "visible" : "hidden", transform: "rotate(45deg)" }}
                      >
                        <Plus className="size-4" style={{ transform: "rotate(-45deg)" }} />
                      </span>
                    </div>

                    {/* Back — the gallery label */}
                    <div
                      aria-hidden={!isRevealed}
                      className="absolute inset-0 flex flex-col overflow-hidden rounded-[2px] border border-[#D4A42E]/40 p-5 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.65)]"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        background: "linear-gradient(160deg, #F5EDD6 0%, #EDE0C4 100%)",
                      }}
                    >
                      <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-[#D4A42E]">
                        {piece.category}
                      </p>
                      <h3 className="mt-2 font-serif text-[18px] italic leading-snug text-[#2C1810]">
                        {piece.title}
                      </h3>

                      <div
                        className="mt-3 h-px bg-[#D4A42E]"
                        style={{
                          width: isRevealed ? 40 : 0,
                          transition: "width 0.5s ease 0.3s",
                        }}
                      />

                      <PhilosophyReveal
                        text={piece.philosophy}
                        active={isRevealed}
                        className="mt-3 line-clamp-3 text-[11px] leading-[1.6] text-[#2C1810]/65"
                      />

                      <div className="flex-1" />

                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[8px] uppercase tracking-[0.2em] text-[#2C1810]/40">
                            {labels.price}
                          </p>
                          <p className="font-serif text-base text-[#D4A42E]">
                            {piece.price.toLocaleString("en-US")}{" "}
                            <span className="text-[10px]">{currency}</span>
                          </p>
                          {piece.size && (
                            <p className="mt-0.5 text-[11px] text-[#2C1810]/60">{piece.size}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] uppercase tracking-[0.2em] text-[#2C1810]/40">
                            DIMENSIONS
                          </p>
                          <p className="text-[11px] leading-snug text-[#2C1810]/60">
                            {piece.size ?? "—"}
                          </p>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "mt-3 w-full rounded-full border px-3 py-1.5 text-center text-[8px] uppercase tracking-[0.2em]",
                          quantityPillClass(piece.quantity),
                        )}
                      >
                        {quantityLabel(piece.quantity, labels)}
                      </div>

                      <a
                        href={`https://wa.me/212710260501?text=${encodeURIComponent(
                          `Bonjour, je suis intéressé(e) par "${piece.title}" — ${piece.size} — ${piece.price} DH (N° ${String(index + 1).padStart(2, "0")} / ${count})`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-sm py-2.5 text-[9px] font-medium uppercase tracking-[0.2em] text-[#2C1810] transition-[filter,transform] duration-200 hover:scale-[1.01] hover:brightness-110"
                        style={{ background: "linear-gradient(135deg, #D4A42E, #A67C00)" }}
                      >
                        Commander sur WhatsApp
                      </a>

                      <p className="mt-2 text-center text-[8px] uppercase tracking-[0.2em] text-[#2C1810]/30">
                        {labels.numberPrefix} {String(index + 1).padStart(2, "0")} / {count}
                      </p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {showNavigation && (
          <>
            <button
              type="button"
              aria-label={labels.prevAria}
              onClick={() => nudge(-1)}
              className="absolute left-1 top-1/2 z-[200] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[2px] border border-[#D4A42E]/40 bg-[rgba(245,237,214,0.8)] text-[#D4A42E] backdrop-blur-sm transition hover:border-[#D4A42E] hover:bg-[#D4A42E] hover:text-[#2C1810] sm:left-3"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label={labels.nextAria}
              onClick={() => nudge(1)}
              className="absolute right-1 top-1/2 z-[200] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[2px] border border-[#D4A42E]/40 bg-[rgba(245,237,214,0.8)] text-[#D4A42E] backdrop-blur-sm transition hover:border-[#D4A42E] hover:bg-[#D4A42E] hover:text-[#2C1810] sm:right-3"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {showPagination && (
        <div className="mt-8 flex items-center justify-center gap-1.5">
          {pieces.map((piece, index) => (
            <button
              key={piece.id}
              type="button"
              aria-label={`${labels.goToPrefix} ${piece.title}`}
              aria-current={index === selected}
              onClick={() => goTo(index)}
              className={cn(
                "rounded-full transition-all duration-300",
                index === selected
                  ? "h-[3px] w-6"
                  : "h-1 w-1 bg-[rgba(212,164,46,0.3)] hover:bg-[rgba(212,164,46,0.6)]",
              )}
              style={
                index === selected
                  ? { background: "linear-gradient(90deg, #D4A42E, #F5D07A)" }
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
