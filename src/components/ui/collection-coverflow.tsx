// Save as: components/ui/collection-coverflow.tsx
"use client";

import * as React from "react";
import Image from "next/image";
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

function formatPrice(value: number, currency: string) {
  return `${value.toLocaleString("en-US")} ${currency}`;
}

function quantityLabel(quantity: number, labels: CollectionCoverflowLabels) {
  if (quantity <= 0) return labels.soldOut;
  if (quantity === 1) return labels.uniquePiece;
  return `${quantity} ${labels.availableSuffix}`;
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

      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) ` +
        `translateZ(${-depth * width * ramp}px) rotateY(${-tilt}deg)`;

      const edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
      card.style.opacity = String(Math.max(0, 1 - fade * distance) * edge);
      card.style.zIndex = String(100 - Math.round(distance));

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

  return (
    <div
      className={cn("w-full", className)}
      style={{ ["--cf-card" as string]: cardWidth }}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
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
                    contain: "layout style",
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
                      contain: "layout style",
                    }}
                  >
                    {/* Front — the artwork */}
                    <div
                      aria-hidden={isRevealed}
                      className="absolute inset-0 overflow-hidden rounded-[2px] bg-[var(--rq-ink-soft)] shadow-[0_30px_60px_-25px_rgba(0,0,0,0.65)]"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <Image
                        src={piece.src}
                        alt={piece.alt}
                        fill
                        draggable={false}
                        priority={index === 0}
                        loading={index === 0 ? "eager" : "lazy"}
                        quality={65}
                        sizes="(max-width: 768px) 280px, 380px"
                        className="select-none object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-black/0" />

                      {piece.quantity === 1 && (
                        <span className="absolute left-3 top-3 rounded-full border border-[var(--rq-gold)]/50 bg-black/40 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-[var(--rq-gold)] backdrop-blur-sm">
                          {labels.uniquePiece}
                        </span>
                      )}

                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--rq-gold)]">
                          {piece.category}
                        </p>
                        <p className="mt-1 font-serif text-[15px] italic leading-snug text-[var(--rq-parchment)]">
                          {piece.title}
                        </p>
                      </div>

                      <span
                        ref={(node) => {
                          badgeRefs.current[index] = node;
                        }}
                        aria-hidden={!isActive}
                        className="pointer-events-none absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--rq-gold)]/60 bg-black/40 text-[var(--rq-gold)] backdrop-blur-sm animate-[pulse_2.6s_ease-in-out_infinite] motion-reduce:animate-none"
                        style={{ visibility: isActive ? "visible" : "hidden" }}
                      >
                        <Plus className="size-4" />
                      </span>
                    </div>

                    {/* Back — the gallery label */}
                    <div
                      aria-hidden={!isRevealed}
                      className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-[2px] border border-[var(--rq-gold)]/40 bg-[var(--rq-parchment)] p-5 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.65)]"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--rq-gold-deep)]">
                          {piece.category}
                        </p>
                        <h3 className="mt-2 font-serif text-lg italic leading-snug text-[var(--rq-ink)]">
                          {piece.title}
                        </h3>
                      </div>

                      <PhilosophyReveal text={piece.philosophy} active={isRevealed} />

                      <div>
                        <div className="h-px w-full bg-[var(--rq-gold)]/35" />
                        <div className="mt-3 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--rq-ink)]/45">
                              {labels.price}
                            </p>
                            <p className="font-serif text-base text-[var(--rq-ink)]">
                              {formatPrice(piece.price, currency)}
                            </p>
                            {piece.size && (
                              <p className="mt-0.5 text-[10px] text-[var(--rq-ink)]/45">
                                {piece.size}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--rq-ink)]/45">
                              {labels.edition}
                            </p>
                            <p className="text-[12px] leading-snug text-[var(--rq-ink)]/75">
                              {quantityLabel(piece.quantity, labels)}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-center text-[9px] uppercase tracking-[0.18em] text-[var(--rq-ink)]/35">
                          {labels.numberPrefix} {String(index + 1).padStart(2, "0")} / {count}
                        </p>
                        <a
                          href={`https://wa.me/212710260501?text=${encodeURIComponent(
                            `Bonjour, je suis intéressé(e) par "${piece.title}" — ${piece.size} — ${piece.price} DH (N° ${String(index + 1).padStart(2, "0")} / 43)`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-sm bg-[var(--rq-gold)] py-2 text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--rq-ink)]"
                        >
                          Commander sur WhatsApp
                        </a>
                      </div>
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
              className="absolute left-1 top-1/2 z-[200] -translate-y-1/2 rounded-full border border-[var(--rq-gold)]/30 bg-black/30 p-2.5 text-[var(--rq-gold)] backdrop-blur transition hover:border-[var(--rq-gold)]/60 hover:bg-black/50 sm:left-3"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label={labels.nextAria}
              onClick={() => nudge(1)}
              className="absolute right-1 top-1/2 z-[200] -translate-y-1/2 rounded-full border border-[var(--rq-gold)]/30 bg-black/30 p-2.5 text-[var(--rq-gold)] backdrop-blur transition hover:border-[var(--rq-gold)]/60 hover:bg-black/50 sm:right-3"
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
                "h-[3px] rounded-full bg-[var(--rq-gold)] transition-all duration-300",
                index === selected ? "w-6 opacity-100" : "w-[3px] opacity-30",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
