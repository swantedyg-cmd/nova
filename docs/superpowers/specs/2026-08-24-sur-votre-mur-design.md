# "Sur votre mur" — Wall-Scale Preview

## Problem

The #1 hesitation buying wall art online is "will this actually fit and look
right where I want it." Every piece already has real cm dimensions in
`src/data/catalogue.ts` (`width`, `height`) — this feature is the payoff for
data already stored but not used visually.

## Scope

In scope: upload/capture a wall photo, one explicit calibration step, a
canvas-composited preview of the piece at its true size (draggable, not
resizable), save/share via Web Share API with a WhatsApp-text fallback.

Explicitly out of scope for this pass: live-camera AR (WebXR/ARKit/ARCore),
multi-piece wall arrangement, upload persistence/accounts, any new backend
endpoint. All state is session-only and client-side.

## Entry points

Three existing "piece detail" surfaces get a `"Voir sur votre mur"` button —
this app has no per-SKU product pages, so all three that currently show a
single piece up close get it, per stakeholder decision:

1. `CollectionCoverflow` card back (`src/components/ui/collection-coverflow.tsx`)
   — inside `CollectionShowcaseSection`, next to the philosophy/price/edition
   text. This is the dark-ink/antique-brass "Collection Signée" surface whose
   palette the whole feature borrows.
2. `DetailPanel` — desktop 3D gallery focus overlay, in
   `src/components/GallerySection.tsx`, next to the existing price/quantity/
   Commander button.
3. `MobileLightbox` — the mobile equivalent in the same file.

Each trigger calls `openWallPreview(piece.id)` from `useWallPreview()` (the
new context below), the same way `GallerySection.tsx` already calls
`selectPieceForOrder(piece.id)` from `useOrderSelection()`. None of the three
duplicate the modal's own logic.

**Required fix in `collection-coverflow.tsx` before entry point 1 can work:**
the entire flip-card — front *and* back — is currently one `<button>`
(lines 366–476, `onClick={() => handleCardTap(index)}` toggles the flip).
Putting a real `<button>` for "Voir sur votre mur" on the card back, as the
brief asks, means nesting a `<button>` inside a `<button>` — invalid HTML;
browsers auto-close the outer one early, which breaks the card's own flip
interaction. Fix: change that outer control from `<button type="button">` to
`<div role="button" tabIndex={isActive ? 0 : -1} onClick={...} onKeyDown={...}>`
carrying the same `aria-pressed`/`aria-label` it has today — identical a11y
semantics, just not a real `<button>` element — so a genuine nested
`<button onClick={(e) => { e.stopPropagation(); openWallPreview(piece.id) }}>`
can live on the card back. Scoped to this one element; nothing else in that
component changes.

`collection-coverflow.tsx` has no `useLanguage` of its own — like the rest of
its labels, the new button's text comes in through the existing `labels`
prop (add `wallPreviewCta: string` to `CollectionCoverflowLabels`), passed
from `CollectionShowcaseSection` as `t.wallPreview.triggerCta`.

## Architecture

### New files

- `src/context/WallPreviewContext.tsx`
- `src/components/WallPreview/WallPreviewModal.tsx`
- `src/components/WallPreview/CalibrationOverlay.tsx`
- `src/components/WallPreview/WallCanvas.tsx`

### `WallPreviewContext`

Session-scoped state, mirroring the existing `OrderSelectionContext` pattern
(`src/context/OrderSelectionContext.tsx`) already in this codebase. Wrapped
once in `src/app/layout.tsx` alongside `OrderSelectionProvider`.

```ts
interface WallPreviewContextValue {
  activePieceId: string | null      // which piece the modal is showing, or null = closed
  wallPhoto: HTMLImageElement | null // decoded once on upload, reused across pieces
  pxPerCm: number | null             // set once per wall photo, reused across pieces
  openWallPreview: (pieceId: string) => void
  closeWallPreview: () => void
  setWallPhoto: (img: HTMLImageElement) => void
  setCalibration: (pxPerCm: number) => void
  resetWallPhoto: () => void         // explicit "use a different photo" action
}
```

Rationale for context over local state: the spec requires calibration to
persist "when switching between pieces on the same wall photo." Since a user
can reach this feature from three different components, `wallPhoto` and
`pxPerCm` must live above all three trigger points, not inside one of them.

Nothing here is persisted beyond the page session (no `localStorage`, no
server round-trip) — the uploaded photo lives only as an in-memory
`HTMLImageElement` / object URL, revoked on unmount or `resetWallPhoto`.

### `WallPreviewModal`

The full-screen (mobile) / centered-modal (desktop) shell. Reads
`activePieceId` from context; renders nothing when `null`. Internal step
state: `'upload' | 'calibrate' | 'place'`. On open, if `wallPhoto` and
`pxPerCm` already exist in context, it skips straight to `'place'` — this is
what satisfies "trying a second piece on the same wall photo doesn't require
recalibrating."

Steps:

1. **Upload** — `<input type="file" accept="image/*" capture="environment">`
   for mobile camera access, drag/drop or click for desktop. On file select,
   decode into an `HTMLImageElement`, store via `setWallPhoto`, advance to
   `'calibrate'`.
2. **Calibrate** — renders `CalibrationOverlay` over the uploaded photo (see
   below). On confirm, computes `pxPerCm` and calls `setCalibration`, then
   advances to `'place'`.
3. **Place** — renders `WallCanvas` with the active piece. Save/share actions
   live in this step's footer.

Closing the modal (X button, backdrop click) clears `activePieceId` only —
`wallPhoto`/`pxPerCm` stay in context for next time. A separate, explicit
"utiliser une autre photo" control (in the place step's footer) calls
`resetWallPhoto`.

### `CalibrationOverlay`

Reference-object picker, exactly as specified — four options, first three
with editable-but-prefilled cm values, fourth is a free numeric input:

| Label | Default cm | Editable |
|---|---|---|
| Porte standard | 204 | yes |
| Interrupteur (bas) | 90 | yes |
| Prise électrique | 30 | yes |
| Je connais la hauteur exacte | — | required input, no default |

Below the picker: the uploaded photo with a vertical line overlay with two
draggable circular handles (top, bottom), implemented as absolutely
positioned elements over an `<img>` (not canvas — this step is pure UI
interaction, no compositing happens yet, so DOM drag is simpler and this is
exactly the "pick whichever is less code" case going the other way from the
placement step).

```
pxPerCm = abs(handleBottom.y - handleTop.y) / referenceCm
```

"Confirm calibration" is disabled when the handle distance is below a
sanity-check floor (20px) — prevents a near-zero denominator producing an
absurd `pxPerCm`. No other validation; the user can always redo it by
re-opening calibration from the place step if the result looks wrong.

### `WallCanvas`

A single `<canvas>`, sized to the wall photo's natural dimensions (scaled
down for display via CSS, coordinates always computed in true photo-pixel
space so drag math and the final export match 1:1).

Render sequence on every frame (initial mount, drag move, or piece switch):

1. `drawImage` the wall photo, full canvas.
2. Compute `widthPx = piece.width * pxPerCm`, `heightPx = piece.height * pxPerCm`
   (`piece.width`/`piece.height` read directly from `PIECES` in
   `src/data/catalogue.ts` — already present for every piece, no new data
   field needed).
3. Before drawing anything else, sample average luminance of the wall pixels
   in the shadow's own footprint — the offset rect it's about to occupy
   (frame rect shifted down-right by the shadow offset), via `getImageData`
   over that rect, average RGB → luminance. Sampled *before* any drawing so
   these are real wall pixels, not something already painted this frame. Map
   to shadow alpha: darker sampled region → lower shadow opacity (a shadow
   barely reads against an already-dark wall), lighter region → higher
   opacity, clamped to a sane range so it never disappears or turns into a
   black block.
4. Draw the shadow (that same offset, blurred rect, behind the frame).
5. Draw the gold outer frame: solid `#C89B3C` (this project's
   `--color-gold` token — the same value used for frame borders in
   `GalleryScene.tsx`'s 3D frames and `HeroGallery.tsx`'s masonry frames,
   reused directly, not reinvented) with a thin cream (`#F5F1EB`, this
   project's `--color-canvas` token) mat inset, matching the two-layer frame
   look used elsewhere on the site — **but scaled by calibration, not the
   fixed 6px/8px those other two spots use.** Those are pure decoration with
   no real-world size to respect; this preview's whole point is physical
   accuracy, so a fixed pixel border would read wrong at both ends (chunky
   on a small far-wall shot, invisible on a close one) and would technically
   poke outside the piece's true cm footprint. Instead: gold band = 1.5cm ×
   `pxPerCm`, cream mat = 1cm × `pxPerCm`, both drawn **inset** within
   `widthPx`/`heightPx` (border-box, not additive) — so the on-screen
   footprint always equals exactly `piece.width * pxPerCm` ×
   `piece.height * pxPerCm`, frame included, matching the accuracy
   acceptance criterion.
6. `drawImage` the piece's own image (`/images/${piece.image}`) inside the
   mat inset, `object-fit: cover` semantics implemented manually (crop to
   the target aspect ratio before drawing, since canvas has no native
   object-fit).

Drag: `pointerdown` on the frame rect starts tracking; `pointermove` updates
an `{x, y}` offset in state and triggers a redraw at the new position; no
resize handles are rendered anywhere — the only way size changes is a
different piece (different cm data), never user interaction. Position clamps
so at least 25% of the frame stays within the canvas bounds (prevents
dragging it fully off-screen and "losing" it).

## Save / share

```
canvas.toBlob(blob => { ... }, 'image/jpeg', 0.92)
```

1. **Primary path** — if
   `navigator.canShare?.({ files: [file] })` returns true (file built from
   the blob): call `navigator.share({ files: [file], text: shareText })`.
   On mobile with WhatsApp installed, this surfaces WhatsApp in the native
   share sheet with the image already attached — no wa.me text-only
   limitation applies here since this is a file share, not a URL scheme.
   A user-cancelled share (`AbortError`) is treated as a no-op, not an
   error — just return to the place step silently.
2. **Fallback path** (desktop, or `canShare` unsupported/returns false) —
   trigger a browser download of the blob as `<piece.id>-sur-votre-mur.jpg`,
   then `window.open` the existing WhatsApp ordering link pattern already
   used in `CommandeSection.tsx`
   (`https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(text)}`) with
   prefilled text naming the piece. UI copy states plainly, via
   `t.wallPreview.downloadFallbackNote` (see Internationalisation below) —
   no claim of one-tap attachment on desktop.

`shareText` / the fallback prefilled text both follow the existing message
format from `CommandeSection.tsx`'s `handleSubmit` (piece id + theme line),
for consistency with the order flow's own WhatsApp messages; the surrounding
UI copy (button labels, the fallback note) comes from `t.wallPreview.*`.

## Internationalisation (fr/en/ar)

The rest of the site is fully trilingual with RTL for Arabic (`src/i18n/
translations.ts`, `LanguageContext.tsx` sets `document.documentElement.dir`
globally) — this feature follows the same convention rather than shipping
French-only, per stakeholder decision. A new `wallPreview` block is added to
each of the `fr`/`en`/`ar` top-level objects in `translations.ts`, same shape
in all three (mirroring how `showcase`/`gallery`/`commande` already work):

```ts
wallPreview: {
  triggerCta: string           // the entry-point button, e.g. "Voir sur votre mur"
  eyebrow: string
  heading: string
  closeAria: string
  uploadHeading: string
  uploadBody: string
  uploadCta: string
  calibrateHeading: string
  calibrateBody: string
  referenceLabel: string
  referenceDoor: string        // "Porte standard" — 204cm default
  referenceSwitch: string      // "Interrupteur (bas)" — 90cm default
  referenceOutlet: string      // "Prise électrique" — 30cm default
  referenceCustom: string      // "Je connais la hauteur exacte" — free input
  referenceCustomPlaceholder: string
  calibrateConfirmCta: string
  calibrateTooShort: string    // shown when handles are <20px apart
  placeDragHint: string
  changePhotoCta: string
  shareCta: string
  downloadFallbackNote: string // "Image enregistrée — joignez-la dans WhatsApp."
  whatsappFallbackCta: string
  backCta: string
}
```

All calibration/modal UI text and layout follow `document.dir` automatically
since that's set at the document root already — no per-component RTL
handling needed beyond normal logical CSS (`ms-`/`me-` over `ml-`/`mr-`
where the modal adds new spacing, matching how `CommandeSection.tsx` already
sets `dir` explicitly on its own form as an extra safety net). The
calibration line itself is vertical (top/bottom handles, not left/right), so
RTL doesn't affect its geometry — only the surrounding labels and buttons
mirror.

`collection-coverflow.tsx`'s `CollectionCoverflowLabels` interface gains
`wallPreviewCta: string`, populated from `CollectionShowcaseSection` as
`t.wallPreview.triggerCta` (see Entry points above).

## Visual theme

The modal, in all three entry contexts, always renders in the "Collection
Signée" palette — not the palette of whichever surface it was opened from.
Scoped CSS variables copied from `CollectionShowcaseSection`'s existing
`THEME` object (`src/components/CollectionShowcaseSection.tsx`):

```
--rq-ink, --rq-ink-soft, --rq-parchment, --rq-gold, --rq-gold-deep, --font-serif
```

applied via the same `style={THEME}` scoping technique already used there —
no new color or font tokens introduced anywhere in the project.

## Error handling

| Case | Behavior |
|---|---|
| File input cancelled / no file chosen | Stay on upload step, no error shown |
| Camera/file permission denied (mobile) | Stay on upload step; browser's own permission-denied UI covers this, no custom handling needed |
| Calibration handles dragged to <20px apart | "Confirm" button disabled |
| `navigator.share` throws/rejects (user cancel) | Silent return to place step |
| `navigator.share` throws for a real reason (rare) | Falls through to the download+wa.me fallback path |
| Piece missing `width`/`height` in data | N/A today — every current `PIECES` entry has both; not defensively handled beyond TypeScript's existing non-optional typing on those fields |

## Explicitly not built in this pass

- No live camera AR (WebXR/ARKit/ARCore)
- No multi-piece "design your wall" mode
- No upload persistence — nothing saved server-side; no accounts exist in
  this codebase to hook into
- No new backend/API route — 100% client-side, matches the rest of this
  project's architecture (static Next.js app, no server actions currently
  in use for anything else either)

## Acceptance criteria (unchanged from the original brief)

- [ ] Calibration produces a visibly correct px-per-cm value (manual test:
      calibrate against a door, confirm a piece with known cm size renders
      at a plausible fraction of that door's height)
- [ ] Piece is draggable but never resizable by the user
- [ ] Calibration persists in session when switching between pieces on the
      same wall photo, across all three entry points
- [ ] Web Share API path works on a real mobile device with WhatsApp
      installed; desktop fallback downloads image + opens WhatsApp text link
      with clear instructions
- [ ] Visual style matches the Collection Signée palette/type, no new design
      language introduced
- [ ] Fully responsive, mobile-first
- [ ] No new backend endpoints; no data persisted outside the session
