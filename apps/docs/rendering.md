# Rendering

`<GissenRender>` is the production renderer: it takes the same `config` the
editor takes and the JSON document the editor produced, and renders the page
with your components alone — no editor chrome, no wrapper elements, safe on
the server.

## Basic usage

```vue
<script setup lang="ts">
import type { GissenData } from 'gissen/render'
import { GissenRender } from 'gissen/render'
import config from './gissen.config'

// In a real app this comes from your storage / API.
const data: GissenData = { root: { props: {} }, content: [] }
</script>

<template>
  <GissenRender :config="config" :data="data" />
</template>
```

## Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `config` | `GissenConfig` | ✓ | The component registry — the same object you pass to `<GissenEditor>`. |
| `data` | `GissenData` | ✓ | The document to render, as produced by the editor. One-way: the renderer never mutates it. |

Both props are reactive: replacing either re-renders the page.

## `gissen/render` vs the main package

`GissenRender` is exported from both `gissen` and the `gissen/render`
subpath. **Apps that only render should import from `gissen/render`**: the
subpath contains only the renderer, so an editor-free bundle is guaranteed
by construction — a render-only page costs roughly the Vue runtime plus a
few kilobytes, on any bundler. Importing `GissenRender` from the main
package also tree-shakes clean on modern bundlers (Vite 7+ / Rolldown
produce the same output), but older Rollup-based ones keep the validation
stack (zod) in the bundle — the subpath is the contract, the barrel is a
best-effort.

The subpath also exports every public type and `defineGissenConfig`, so a
config module shared between your editor app and a render-only app can avoid
the main package entirely:

```ts
// gissen.config.ts — importable from both apps
import { defineGissenConfig } from 'gissen/render'
```

The editor app keeps importing `GissenEditor` from `gissen`; both packages'
exports resolve to the same implementations.

## Zero wrapper elements

The editor canvas wraps every node in a `<div class="gissen-node">` for
selection and drag-and-drop. `<GissenRender>` emits **none of that** — the
output is your components' own DOM, composed with Vue fragments at every
nesting level. What you see in your HTML is exactly what your components
render.

One consequence: `<GissenRender>` has no root element of its own, so a
`class` or `style` placed on it goes nowhere. Put page-level styling on a
surrounding element or on the [root component](#root-rendering).

## Slots

Slot fields follow the same convention as in the editor: a component that
declares `features: { type: 'slot' }` receives its children through
`<slot name="features" />`. Slot fields are **not props** — the renderer
(and the editor canvas) strips them from the props it passes and delivers
the rendered children as named slots instead. The props your component
receives are the non-slot fields plus `id` (the `InferRenderProps` type).

## Resilience

`<GissenRender>` is best-effort by design — a bad document must not take
down the page that renders it:

- **Unknown component types are skipped.** A node whose `type` is not in the
  config renders nothing; its siblings and the rest of the tree render
  normally. Development builds log a console warning with the node's type
  and id; production builds are silent.
- **Absent props stay absent.** A cleared field round-trips through JSON as
  a missing key and is passed as `undefined` — your components own their
  defaults (via `defineProps` defaults, or `defaultProps` applied when the
  node was created in the editor). The renderer never injects values.
- **The envelope `version` is ignored.**

No validation runs during rendering. If you want strictness — for example,
rejecting a document whose types no longer exist in the config — validate
explicitly before rendering:

```ts
import { validateData } from 'gissen'

// Throws GissenValidationError with issue paths on malformed input.
const data = validateData(rawData, config)
```

## Root rendering

`config.root.render` is an optional component that wraps the whole page —
a layout shell, a themed background, a width container. It receives
`data.root.props` as props and the page content through its **default
slot**:

```ts
import { defineGissenConfig } from 'gissen/render'
import PageShell from './components/PageShell.vue'

export default defineGissenConfig({
  components: { /* ... */ },
  root: {
    fields: { theme: { type: 'text' } },
    defaultProps: { theme: 'light' },
    render: PageShell,
  },
})
```

```vue
<!-- PageShell.vue -->
<template>
  <main :data-theme="theme">
    <slot />
  </main>
</template>
```

The editor canvas renders the same wrapper around the page content (inside
the editor chrome), so editing stays WYSIWYG. Without `root.render`, content
renders as a bare fragment in both places.

Root props have no editing UI in the properties panel yet — set them via
`root.defaultProps` (applied by `createEmptyData`) or directly in the
document.

## Live preview

`<GissenRender>` re-renders when its props change, so binding it to the same
ref the editor mutates gives you a live preview for free:

```vue
<script setup lang="ts">
import type { GissenData } from 'gissen'
import { GissenEditor, GissenRender } from 'gissen'
import { ref } from 'vue'
import config from './gissen.config'

const data = ref<GissenData>({ root: { props: {} }, content: [] })
</script>

<template>
  <div class="split">
    <GissenEditor v-model:data="data" :config="config" />
    <GissenRender :config="config" :data="data" />
  </div>
</template>
```

Every canvas drop, property edit, and undo/redo shows up in the rendered
output immediately. (This page imports both components, so it uses the main
`gissen` package — the subpath matters only for bundles that must exclude
the editor.)

## SSR and Nuxt

`<GissenRender>` is SSR-safe by construction: it touches no browser APIs at
render time, and its output is a pure function of `(config, data)` — the
server HTML hydrates without mismatches. In Nuxt, use it on a server-rendered
page directly, no `<ClientOnly>` needed:

```vue
<!-- pages/[slug].vue -->
<script setup lang="ts">
import { GissenRender } from 'gissen/render'
import config from '../gissen.config'

const { data } = await useFetch(`/api/pages/${useRoute().params.slug}`)
</script>

<template>
  <GissenRender v-if="data" :config="config" :data="data" />
</template>
```

`<GissenEditor>` also renders on the server (the canvas guards its
browser-only observers), so an editor route works without `<ClientOnly>`
too. Wrapping the editor in `<ClientOnly>` remains a fine choice when you
prefer to keep editing strictly client-side — it does not crash either way.
The [basic-nuxt example](https://github.com/gissen-dev/gissen/tree/main/examples/basic-nuxt)
has both pages: `/` edits a sample document, `/render` server-renders it.
