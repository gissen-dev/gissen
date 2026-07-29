# Phase 6 — Production renderer (`<GissenRender>`) + SSR

## 2026-07-29 — the render-props type contract contradicted the runtime contract

Manual QA caught it: clearing the number field `badge` on the example's
FeatureCard logged `Invalid prop: type check failed for prop "badge".
Expected Number with value NaN, got Undefined`. Two layers to the bug. The
immediate one: `updateProp` stores `undefined` while keeping the key present,
so Vue treats the prop as *provided* — the required check passes and the
*type* check runs against `undefined` (the odd "value NaN" is Vue casting the
received value to the expected type for display). The component declared
`badge: number` — required — while the editor's own contract says a cleared
field is an absent prop. The deeper one: declaring the prop optional — the
runtime-correct thing — failed `nuxt typecheck`, because `InferRenderProps`
typed every value field as required. The two contracts were contradictory: no
component with a number field could both pass the define-site check and stay
warning-free in the editor. `InferRenderProps` is now `Partial` over the
non-slot fields (only `id` stays guaranteed): absence is a valid render-time
state — cleared fields, hand-authored documents omitting keys, nodes created
without defaults — and neither render path injects values. What the
define-site check keeps and what it loses, verified with scratch typechecks:
wrong prop types and out-of-union `defaultProps` literals still fail to
compile; a component that *omits* a value-field prop declaration now passes
(optional target properties don't require presence) — an accepted loss, and
consistent with a component being free to ignore fields it doesn't render.
FeatureCard's `badge` is optional now — the same class of bug as Container's
phantom `children` prop, just requiredness instead of existence.

## 2026-07-29 — a root component that renders no slot takes the editor down (backlog)

Also from manual QA, worth recording even though the trigger was an invalid
setup: a `root.render` component that renders nothing (here: a
`template`-string component under Nuxt's runtime-only Vue build, which cannot
compile it) means the canvas DnD zone inside GissenRoot's default slot never
mounts. `useDraggable` then receives `null` and Sortable throws during app
init — the entire app dies with ``Sortable: `el` must be an HTMLElement, not
[object Null]``, a cryptic error pointing nowhere near the actual mistake.
Not fixed in this phase (it changes editor behavior): EditorCanvas should
check `innerEl` after mount, log a clear dev error — "does your root.render
component render its default slot?" — and skip DnD init instead of crashing.
Backlogged (see AUDIT_BACKLOG.md).

## 2026-07-29 — addendum: the subpath split fixed the barrel too

The review-gate bundle probe found the first tree-shaking entry's conclusion
partially stale. After the multi-entry build split dist into shared chunks, a
Vite app importing only `GissenRender` *from the barrel* also tree-shakes —
to the same 64 kB with zero editor-stack markers on Vite 8/Rolldown, and to
184 kB on Vite 6/Rollup, which drops Sortable and Reka but keeps zod's
module-scope schemas. The chunk boundaries restored exactly the module
structure consumer tree-shaking needed, so the split fixed the barrel as a
side effect. The 224 kB measurement was real but describes the pre-split,
single-entry build. `gissen/render` stays the documented contract (explicit
and bundler-independent); rendering.md and the subpath's JSDoc were reworded
accordingly — subpath as the guarantee, barrel as bundler-dependent
best-effort.

## 2026-07-21 — a single-file library bundle defeats consumer tree-shaking

The bundle probe (a minimal Vite app importing only `GissenRender` from the
barrel) showed partial tree-shaking: the editor components and Reka UI
vanished (Vue's compiler pure-annotates `defineComponent`), but Sortable and
zod survived — 224 kB for a render-only app. The reason is structural, not a
bundler flag: our dist is one flat module, so the consumer's bundler can only
do statement-level dead-code elimination, and Sortable's module-scope browser
sniffing and zod's top-level `z.object(...)` schema construction are calls it
cannot prove pure. `sideEffects` in package.json doesn't help — that flag
skips whole *modules*, and there are no module boundaries left after
bundling. Shipped the approved fallback: a second build entry and a
`gissen/render` subpath export. The probe importing from the subpath builds
to 64 kB (Vue runtime + ~6 kB renderer), zero editor-stack markers; the
grep's one case-insensitive "draggable" hit is Vue's own handling of the
standard HTML `draggable` attribute. (A later probe showed the split also
fixed barrel imports — see the 2026-07-29 addendum above.)

## 2026-07-21 — the first honestly-typed component exposed two old type holes

`GissenRender` is a plain `.ts` file, so it is the first exported component
whose published types are real. That surfaced two pre-existing problems.
First, `dist/index.d.ts` begins with `import ... from
'./components/GissenEditor.vue'` — a path that does not exist in the
published package, so consumers have always seen `GissenEditor` as `any` and
its `config` prop was never actually type-checked. Second, with a truly
typed `config: GissenConfig` prop, `nuxt typecheck` proved that
`defineGissenConfig(...)`'s return type was **never assignable to
`GissenConfig`**: `Component<P>` is contravariant in its props, so a
registry type that demands `Component<inferred props>` rejects every
concretely-typed component (any required prop breaks it). The editor only
"accepted" configs because of hole number one. Fix: the registry type
(`ComponentConfig.render`) is now deliberately loose (`Component`), and the
precise check lives where it is sound — `defineGissenConfig`, which knows
the literal `fields` and checks the component against `InferRenderProps`.
The `.vue`-import hole in the dts output is a packaging bug that predates
this phase and is flagged, not fixed, here.

## 2026-07-21 — slot fields were typed as props but delivered as slots

The browser hydration check (headless Chrome against `nuxt dev`) logged
`Missing required prop: "children"` on every page load — from the canvas
path too, so it predates the renderer. The type surface required components
to declare their slot fields as props (`InferComponentProps` includes them
for `defaultProps`' sake), but at runtime both the canvas and `GissenRender`
strip slot fields from props and pass children as named slots — a component
declaring the prop never receives it. Added `InferRenderProps` (non-slot
fields plus `id`) as the render-time contract, used it at the define-site
check, and dropped the phantom prop from the example's `Container.vue`. The
dev console of every example page is now clean.
