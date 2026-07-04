# Audit Backlog

Findings from `CODE_AUDIT_PHASE4.md` that are **not** addressed in the current
fix batch (which covered C-1, H-1, H-2, H-3, H-4, M-1, M-4, and the docs-level
parts of M-2/M-3, plus L-9 and L-10). Kept here so they aren't lost.

## LOW

- **L-1 — Stale selection when removing an ancestor of the selected node.**
  `removeComponent` clears selection only on an exact id match, not when the
  selected node is inside the removed subtree. Currently unreachable via the UI
  (only the selected node is deletable) but latent for the store API / future
  per-node delete. _Status: open, latent._
- **L-2 — Internal `id` falls through to user-component DOM.** `CanvasNode`
  passes `id` to the rendered component; a component that doesn't declare an
  `id` prop gets it as a fallthrough DOM attribute. _Status: open; consider
  `data-gissen-*` or documenting that components should declare `id`._
- **L-3 — `validateData` strips unknown envelope keys.** Zod strip mode drops
  extra top-level keys (e.g. `meta`) from the returned object. Harmless today
  (the editor discards the return), but the "returns typed data" contract loses
  caller metadata. _Status: open; use `.passthrough()` or document._
- **L-4 — Delete guard misses shadow-DOM editables.** `useSelection` inspects
  `e.target`; a web component with an internal input reports the host element,
  so Backspace can delete a node mid-typing. `event.composedPath()[0]` closes
  it. _Status: open._
- **L-5 — Negative numbers hard to type on iOS; `Number()` coercions.**
  `inputmode="decimal"` has no minus key on iOS; `Number()` also accepts
  `"0x10"`→16 and `"1e3"`→1000. _Status: open._
- **L-6 — Garbage number drafts persist with no visual signal.** Pasting `abc`
  leaves the input showing `abc` while the model keeps the prior value. Blur now
  normalizes _valid_ numbers (H-2) but invalid drafts still have no invalid
  styling / cue. _Status: partially mitigated (valid values clamp on blur);
  invalid-state styling still open._
- **L-7 — Async-component workaround has runtime cost.** `defineAsyncComponent`
  for `CanvasSlot` ships a separate chunk and makes first slot render async. A
  plain circular import between the two SFCs resolves fine. _Status: open._
- **L-8 — `structuredClone(defaultProps)` throws for non-cloneable defaults.**
  Config validation permits `z.unknown()` defaults, so a function/Component
  default passes validation then throws `DataCloneError` on first insert.
  _Status: open; validate cloneability at config time._

## NIT

- **N-1 — Dead refine on the render schema.** The `null`/`undefined` refine is
  already covered by the union; meanwhile `render: {}` passes as a "component."
  _Status: open._
- **N-2 — Dead optional chain.** `component.props?.id` in `validate-data.ts` is
  unreachable after the preceding props guard. _Status: open._
- **N-3 — Misleading test name.** `tests/placeholder.test.ts` actually tests
  `defineGissenConfig`. _Status: open._
- **N-4 — Wrong empty-state message.** `EditorPanel` shows "no editable
  properties" for unknown-type components too (e.g. after a config swap), which
  is the wrong message for that state. _Status: open._
- **N-5 — Select option key collision.** `SelectInput` keys options by
  `String(opt.value)`, so `1` and `'1'` collide. _Status: open._
- **N-6 — Redundant `update:data` on intermediate drafts.** Typing `1.` after
  `1` re-commits the same value, emitting a no-op `update:data`. Harmless but
  hosts persisting on every emit see no-op saves. _Status: open._
- **N-7 — Lint formatting warnings in the example.** 18
  `vue/singleline-html-element-content-newline` warnings in
  `examples/basic-nuxt/components/*.vue` (fixable with `pnpm lint:fix`).
  _Status: open (warnings only, lint still passes)._
- **N-8 — Tagline vs. stubs.** `packages/mcp` and `packages/create-gissen-app`
  are "not implemented" stubs while the README leads with "Agent-native."
  _Status: open (acceptable for pre-alpha)._
- **N-9 — Reserved-`id` refine does not cover `root.fields`.** The H-3 fix
  rejects a component field named `id`, but the root schema
  (`config-schemas.ts`, `gissenConfigSchema.root.fields`) accepts one. Root has
  no node identity and no panel editing, so nothing corrupts today — asymmetry
  only. _Status: open._

## MEDIUM (deferred by design)

- **M-2 / M-3 — Deep-reactivity requirement & external-`data` re-validation.**
  The fix batch shipped only a dev-mode `console.warn` when the bound `data` is
  not a deeply reactive proxy (`toRaw(x) === x`) — an earlier revision of this
  entry overstated that the docs-level parts existed. They were added by the
  validation-tolerance follow-up: `apps/docs/editor.md` now documents the
  deep-reactivity requirement on `v-model:data` and the external-replacement
  policy (validated once at mount; swapping documents in is on the caller's
  honor). The full fixes (normalizing input, watching external `data`
  replacement for re-validation) remain **deferred to the undo/redo phase by
  design** — they interact with the variant-A immutable-update plan noted in
  `GissenEditor.vue`. _Status: warn + docs done; normalization/re-validation
  intentionally deferred._

## Surfaced during this fix batch (not in the original audit)

- **`defineGissenConfig` result is not assignable to `GissenConfig`.** Passing a
  `defineGissenConfig(...)` result directly to `validateData(data, config)` or
  `createComponent(type, config)` fails to typecheck: the narrowly-inferred
  config type is not assignable to the wide `GissenConfig` parameter because
  `render: Component<SpecificProps>` is not assignable to
  `Component<genericProps>` (variance). The `:config="config"` → `<GissenEditor>`
  binding works (Vue template checking is lenient), so real apps rarely hit it,
  but the docs' Utilities snippet is technically affected. Surfaced by the new
  docs typecheck (Phase 2). _Status: open; fix requires changing the public
  `defineGissenConfig` / `createComponent` / `validateData` type signatures —
  out of scope for the version-contract fix._
- **Number-input caret / IME behavior is unverified in CI.** The Phase 4 tests
  assert model/draft-string state in jsdom; caret position and IME composition
  are not exercised (no browser-level test harness). _Status: open._

## Fixed by the validation-tolerance follow-up (2026-07-04)

Policy (locked): `validateData` must accept every state reachable through
legitimate editor operations. Structural corruption stays strictly rejected
(unknown types, malformed tree, wrong value types, `allow` violations);
value-level incompleteness is tolerated — absent/`undefined` props are valid,
for components and root alike, since `JSON.stringify` drops `undefined` and
round-tripped documents lack cleared keys.

- **P1 — Clearing a number field produced an invalid document.** Clearing
  stores `undefined` (locked decision, never 0), which the required-prop check
  rejected on the next load. _Fixed: absent/undefined props validate; pinned in
  `tests/store/invariants.test.ts` incl. a JSON round-trip._
- **D-1 — Mid-typing out-of-range numbers reached the model.** `onInput`
  committed values as-typed while the new range checks reject them, so a host
  persisting `update:data` mid-type saved an unloadable document. _Fixed: a
  parsed-but-out-of-range draft is treated like an unparseable intermediate —
  the model keeps its last valid value, no clamping in `onInput`, blur
  normalizes (clamp → step-snap). Pinned in invariants + fields tests._
- **D-2 — Configs with `root.fields` could not mount an empty document.** Every
  configured root field was required while `root.defaultProps` was never
  applied and no root editing UI exists. _Fixed: absent root props validate,
  and `createEmptyData(config)` now applies `root.defaultProps` (cloned,
  mirroring `createComponent`)._
- **Editor-output invariant assumed complete `defaultProps`.** Inserting a
  component whose non-slot field has no default yielded a "required prop
  missing" tree. _Fixed by the same tolerance: absent props validate._
