# Manual QA checklist — drag under viewport scale-to-fit

**Status: UNVERIFIED in a real browser.** The Phase-5 fallback (drags force
scale back to 1 because Sortable hit-tests in untransformed coordinates —
documented-broken upstream under a `transform: scale()` ancestor) shipped on
reasoning alone: jsdom cannot produce real pointer drags, and no browser pass
has been done since (`docs/devlog/phase-5.md`, 2026-07-06, "shipping the
drag/scale fallback without browser proof"). This checklist makes the gap
explicit; run it in a real browser and record the result at the bottom to
close it.

Mechanism under test: `useSidebarDnD`/`useCanvasZoneDnD` set a per-editor
`dragging` flag in `onStart`/`onEnd`; `viewportScale()`
(`packages/core/src/utils/viewport.ts`) returns 1 while it is up. The frame
width constraint (768 px tablet / 375 px mobile) stays applied during the
drag, so drops must land in the true layout. Expected cosmetic cost: a
visible scale jump at drag start when the pane is narrower than the preset,
and a jump back on drop.

## Setup

```bash
pnpm --filter basic-nuxt dev
```

Open the example in Chrome (primary) — repeat in Firefox and Safari if
touching this area seriously. Use a document with a `Container` (slot
component) plus a few leaf components on the canvas.

## Checklist

For every drag below verify all of: no console errors; the drop lands at the
indicated position in the *data* (check the rendered order after drop, not
the mid-drag ghost); the node is selectable and editable afterwards.

### 1. Drag at each viewport preset, pane wide enough (scale stays 1)

With the editor pane wider than the preset (no `transform` on
`.gissen-canvas__viewport` — verify in devtools):

- [ ] **Desktop**: sidebar → empty canvas top-level; sidebar → between two
      existing nodes; reorder two top-level nodes.
- [ ] **Tablet (768 px)**: same three drags.
- [ ] **Mobile (375 px)**: same three drags.

### 2. Narrow pane forcing scale-to-fit (the actual fallback)

Shrink the browser window (or open devtools docked right) until the pane is
narrower than 768 px and select **Tablet** — `.gissen-canvas__viewport` must
show `transform: scale(<1)`.

- [ ] At drag **start** (from sidebar and from a canvas node): the frame
      visibly snaps to scale 1 while keeping its constrained width — this
      jump is the accepted trade-off, not a bug. It must snap *before* the
      ghost starts tracking wrongly.
- [ ] During the drag: the drop indicator/ghost tracks the pointer correctly
      (this is exactly what breaks under a scaled ancestor upstream).
- [ ] On **drop**: node lands where the indicator showed; scale returns to
      fit; the negative `margin-bottom` scroll-extent compensation comes back
      (no dead scroll space below the frame).
- [ ] On **cancelled** drag (press `Esc` mid-drag / drop outside any zone):
      scale returns, document unchanged.
- [ ] Repeat the block with **Mobile** in a pane narrower than 375 px
      (very narrow window or aggressive devtools dock).

### 3. Cross-slot drop while scaled

Still scaled (narrow pane + tablet preset):

- [ ] Drag a leaf node from top level **into** a `Container` slot.
- [ ] Drag a node **out of** the slot back to top level.
- [ ] Drag **between two slots** (two Containers).
- [ ] Slot `allow`-list rejection still works while scaled (e.g. a
      disallowed type shows no drop indicator and does not insert).

### 4. Regression sanity while unscaled

- [ ] After all of the above, one plain drag at Desktop still behaves
      (flag properly cleared — `store.dragging` stuck `true` would freeze
      scale at 1 permanently, which looks like "scale-to-fit stopped
      working").

## Result log

| Date | Browser(s) | Commit | Result / notes | Who |
| ---- | ---------- | ------ | -------------- | --- |
| —    | —          | —      | not yet run    | —   |
