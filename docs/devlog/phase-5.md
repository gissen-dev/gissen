# Phase 5 — Undo/Redo history + viewport preview

## 2026-07-07 — a width-constrained preview can't trigger media queries

While fixing oversized paddings in the mobile preview we hit the fundamental
limit of an iframe-less viewport switcher: media queries watch the browser
window, and the preview constrains a frame without resizing anything — so
`@media (max-width: …)` in user components simply never fires there. We
declared the preview frame `container-type: inline-size` instead: container
queries and cq units respond to the frame, and per spec cq units fall back to
viewport units when no ancestor container exists, so the same component CSS
behaves in production. Intrinsic layout (flex wrap, min(), percentages) was
never affected. Media-query-based components remain blind to the preview —
documented rather than worked around.

## 2026-07-07 — chrome that lives inside a draggable node

The node-action toolbar (delete button) sits inside `.gissen-node`, which is
itself the Sortable draggable — so pressing the button and twitching the
pointer started a node drag. Fixed via Sortable's `filter` option rather than
stopPropagation gymnastics. Anchoring was a trade-off: placing the chip above
the node clips at the canvas top for the first node (the exact discoverability
case the feature exists for), so it overlays the node's top-right corner
inside the box instead — never clipped, inherits viewport scale, but covers a
sliver of content. Delete also hands focus to the canvas root first, because
the button unmounts with the node and focus would otherwise fall to `<body>`,
silently breaking the follow-up undo shortcut.

## 2026-07-07 — the internalWrite flag was a lie under defineModel

Manual testing in the Nuxt example found undo permanently disabled — while all
261 jsdom tests passed. Cause: with a parent `v-model` listener bound,
`defineModel` does not apply a set locally; it only emits, and the value comes
back through the prop one tick later. Our sync watch saw that echo after the
`internalWrite` flag was already cleared and classified every commit as an
external document replacement — resetting history after each edit. No test
had bound a live parent listener, so the deferred path never ran in CI.
Fixed by comparing object identity of the last written document instead of a
flag (`toRaw` on the watched value — a deep ref hands the watcher a proxy,
which cost us a second round of 30 red tests). Added an end-to-end test that
mounts GissenEditor with a real v-model round-trip; it fails on the old code.

## 2026-07-06 — structuredClone exploded on Vue proxies two edits in

First snapshot implementation (`structuredClone(toRaw(data.value))`) threw
`DataCloneError` in every component-mounted test — but only from the second
mutation onward, which is what made it confusing. Root cause: the pre-existing
`commit()` spread `{ ...data.value }` reads `root`/`content` **through the
reactive proxy**, so every committed top-level object carried proxy-wrapped
members; `toRaw` unwraps only one level, and structuredClone refuses proxies.
Fix: spread `toRaw(data.value)` instead. The whole snapshot design now rests on
an invariant worth knowing: the raw document graph stays proxy-free because
commit spreads raw and Vue's set traps store assigned values raw.

## 2026-07-06 — our unmount listener cleanup had never worked

A new test ("dispatch keydown on the root after unmount") failed: undo still
fired. Turns out `onUnmounted(() => el.value?.removeEventListener(...))` was a
silent no-op since the day it was written — Vue resets template refs to null
*before* `onUnmounted` runs, so `el.value` was always null and every editor
leaked its keydown listener onto the detached element. Delete/Escape were
affected all along, not just the new shortcuts. Fixed by capturing the element
in the `onMounted` closure and registering `onUnmounted` inside it.

## 2026-07-06 — detecting an external document swap with nothing to hook

History must reset when the host replaces its own `v-model:data` ref — but that
write bypasses every store method, and a deep watcher for history is off the
table. Solution: a *shallow* watch on the ref with `flush: 'sync'`, paired with
an `internalWrite` flag set around the store's own assignments. Sync flush is
load-bearing: the callback runs inside the flagged assignment, so the flag is
trustworthy. Accepted downside: a host that clones every emission before
writing it back looks like an external swap on each edit and resets history
every time. Plain `v-model` is unaffected (same object identity flows back).

## 2026-07-06 — every coalescing boundary already passes through the history module

Property-edit runs must split on: different field/component, structural op,
undo/redo, external reset, and ~600ms idle. We expected to track run state in
the store, then noticed all five boundaries already flow through the history
module (`record`, `undo`, `redo`, `reset`, and the key comparison itself), so
the run state lives entirely there and the store carries none. Idle detection
is a timestamp comparison at the *next* edit rather than a `setTimeout` —
observably identical, and there is no timer to clean up or leak.

## 2026-07-06 — snapshot before the op, record after it

Store ops validate and throw mid-body (disallowed placement, unknown id), so
capture ordering matters: we take the clone before mutating but push it onto
the stack only after the op succeeds. Cost: a wasted deep clone on the failure
path. Gain: history can never hold an entry for a mutation that never happened,
which would otherwise surface as a no-op undo step. We took the wasted clone.

## 2026-07-06 — shipping the drag/scale fallback without browser proof

Sortable's hit-testing under a `transform: scale()` ancestor is
documented-broken upstream, and we had no way to verify real pointer drags in
this environment (jsdom can't do them). Rather than ship scale-to-fit and hope,
we pre-emptively wired the fallback: `onStart`/`onEnd` on the source lists set
a per-editor `dragging` flag, and the scale computation returns 1 while it's
up — the width constraint stays, so drops land in the true layout. Accepted
downside: a visible scale jump at drag start when the pane is narrower than
the preset. Needs a manual browser pass before anyone trusts it further.

## 2026-07-06 — transform: scale() doesn't shrink the scroll extent

A scaled-down preview frame keeps its untransformed layout height, leaving
blank scrollable space below equal to `(1 - scale) × height`. Compensated with
a negative `margin-bottom` computed from a ResizeObserver-measured frame
height. Same observer also measures the pane width that decides whether to
scale at all; where ResizeObserver doesn't exist (SSR, jsdom) both readings
stay null and the scale stays 1 by construction, so tests exercise the width
constraint without faking observers.
