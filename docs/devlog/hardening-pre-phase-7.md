# Pre-Phase-7 hardening — published types, root.render degradation, QA debt

## 2026-07-30 — the dts hole was two silent failures stacked

The `.vue` import in `dist/index.d.ts` (flagged in Phase 6, shipped in every
alpha ≤ 0.1.0-alpha.5) turned out to be two independent failures, both
silent. First: vite-plugin-dts/unplugin-dts auto-detects whether to use its
Vue processor by scanning **two directory levels** for `.vue` files — ours
live at `src/components/**`, one level too deep — so it quietly fell back to
the plain-ts processor and emitted *no declarations for SFCs at all*. (The
plugin's "detected .vue but processor is ts" warning only fires when the
processor was set to `'ts'` explicitly; auto-detected misses say nothing.)
Second: with the entry re-exporting from `./components/GissenEditor.vue`, a
specifier api-extractor cannot resolve, the bundling step classified the
import as *external* and emitted it verbatim instead of failing the build.
Fix is two config lines in `vite.config.ts`: `processor: 'vue'` (generate
real SFC declarations via @vue/language-core) and `cleanVueFileName: true`
(rewrite `.vue` specifiers extension-less in the interim dts so api-extractor
resolves and inlines them). The bundled `index.d.ts` now declares
`GissenEditor` inline with real `config: GissenConfig` / `data: GissenData` /
`update:data` types and has zero relative or `.vue` imports.

## 2026-07-30 — consumer probe: the monorepo cannot see its own packaging bugs

Verified the fix the only way that means anything — from outside. `npm pack`,
tarball installed into a scratch Vue+TS app in `$TMPDIR`, `vue-tsc` over
fixture code (`scripts/consumer-probe/`). Evidence, both directions: with the
fix, all four criteria pass (components not `any`; malformed `config`
rejected in plain TS **and** in a template via `@vue-expect-error`;
`defineGissenConfig` literal inference + `GissenConfig`-assignability intact
across the boundary; `gissen/render` subpath resolves). With the fix reverted,
the probe fails at two independent layers: the structural check catches the
`.vue` specifier in the tarball, and — with that check bypassed — vue-tsc
fails with 5 errors (implicit-`any` on the `update:data` payload, four
now-unused `@ts-expect-error`/`@vue-expect-error` directives). The unused-
directive trick is the load-bearing design: every negative test doubles as a
tripwire that fires when types regress to `any`, so the probe cannot rot into
green-by-vacuity. `pnpm probe:consumer` is wired into `pnpm release` between
build and publish and documented in CONTRIBUTING.md as a required step —
this class of bug (workspace aliases resolve types from `src/`, so the
monorepo never exercises what ships) is now caught by process, not luck.

## 2026-07-30 — DnD init is now deferred and null-safe (root.render crash)

The backlogged app-killer — a `root.render` component that never renders its
default slot leaves the canvas zone element unmounted, `useDraggable` hands
Sortable a `null` and app init dies — is fixed by inverting init:
`useCanvasZoneDnD` passes `immediate: false` to `useDraggable` and starts
Sortable itself in `onMounted`, only when the element exists. Missing element
→ skip DnD entirely + a dev-mode `console.error` naming the likely cause
("does your `root.render` component render its default slot?"); production
stays silent and the editor degrades to editing-without-drag instead of
taking the host app down. CanvasSlot zones can't hit the path (their element
is in their own template), so the normal init just moved from the library's
`onMounted` to ours — same hook position, verified by the unmocked test.
The new suite (`tests/components/canvas-degradation.test.ts`) deliberately
does **not** mock vue-draggable-plus, unlike every other component test: on
the pre-fix code it reproduces the exact shipped crash (``Sortable: `el` must
be an HTMLElement, not [object Null]``), and its control case asserts real
Sortable still attaches (checks the `Sortable`-prefixed expando on the zone
element) so the deferred init can't silently become never-init.

## 2026-07-30 — manual drag/scale pass done; the mobile leg is practically unreachable

The browser pass from `docs/manual-qa/drag-under-scale.md` was run and the
fallback held — with one finding about the checklist itself, recorded here
rather than fixed. The "repeat with Mobile in a pane narrower than 375 px"
item cannot be executed the way its wording suggests: the editor layout is a
fixed grid of `260px | 1fr | 300px` (`editor.css` — sidebar and properties
panel never shrink or collapse), so shrinking the window toward 375 px doesn't
narrow the preview pane proportionally — the fixed 560 px of chrome eats
everything and the pane collapses to zero. The pane only drops below 375 px in
a window narrower than ~935 px, at which point chrome dominates the screen and
the "mobile preview scaled to fit" state is not something a user would ever
meaningfully be in. Two things worth doing about it eventually, neither done
now: reword that checklist item with the real threshold (window < ~935 px,
not 375), and — the actual issue underneath — give the editor a responsive
layout (collapsible/overlay sidebars below a width threshold), because right
now any narrow host (split pane, half-screen laptop, embedded editor) gets
fixed chrome and a crushed canvas. Until then, the tablet leg exercises the
same scale-to-fit code path (`viewportScale` doesn't care which preset set
the width), so the fallback itself counts as browser-verified.

## 2026-07-30 — Phase-5 drag/scale fallback: debt made explicit, not paid

No behavior change. The scale-under-drag fallback still has zero browser
verification (jsdom can't do real pointer drags — see phase-5.md). Wrote the
manual pass as a concrete checklist with a result log:
`docs/manual-qa/drag-under-scale.md` — drags at each preset, the narrow-pane
scale-to-fit path (including the accepted scale-jump-at-drag-start), cross-
slot drops while scaled, and a stuck-`dragging`-flag regression check. The
gap is now closable by anyone with a browser and an hour, and visibly open
until the result log says otherwise.
