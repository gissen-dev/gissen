# Config API

Gissen is configured by calling `defineGissenConfig` and passing a components map. The function returns the config unchanged — it exists purely for type inference.

## Defining a config

```ts
import { defineGissenConfig } from 'gissen'
import Hero from './components/Hero.vue'
import PricingCard from './components/PricingCard.vue'

const config = defineGissenConfig({
  components: {
    Hero: {
      fields: {
        title: { type: 'text' },
        count: { type: 'number' },
        cta: {
          type: 'select',
          options: [
            { label: 'Sign up', value: 'signup' },
            { label: 'Buy now', value: 'buy' },
          ],
        },
      },
      defaultProps: { title: 'Hello', count: 0, cta: 'signup' },
      render: Hero,
    },
    PricingCard: {
      fields: {
        name: { type: 'text' },
        featured: { type: 'boolean' },
        features: { type: 'slot' },
      },
      defaultProps: { name: '', featured: false, features: [] },
      render: PricingCard,
    },
  },
})
```

TypeScript infers prop types from `fields`. `Hero`'s `cta` prop is narrowed to `'signup' | 'buy'`; `PricingCard`'s `features` entry in `defaultProps` is typed as `ComponentData[]`. Setting `defaultProps` to a value incompatible with the inferred type is a compile-time error, and each `render` component is checked against the props it will actually receive — the non-slot fields plus `id` (slot children arrive as [named slots](#slot-convention), not props).

## Field types

| Type | Description | Inferred prop type |
|---|---|---|
| `text` | Single-line text input | `string` |
| `textarea` | Multi-line text input | `string` |
| `number` | Numeric input | `number` |
| `boolean` | Toggle / checkbox | `boolean` |
| `select` | Dropdown with fixed options | Union of option value literals |
| `slot` | Nested child components | `ComponentData[]` |

### `text`

```ts
const titleField = { type: 'text' as const, label: 'Title' }
```

### `textarea`

```ts
const bioField = { type: 'textarea' as const, label: 'Bio', rows: 4 }
```

### `number`

```ts
const countField = { type: 'number' as const, label: 'Count', min: 0, max: 100 }
```

### `boolean`

```ts
const activeField = { type: 'boolean' as const, label: 'Active' }
```

### `select`

```ts
const variantField = {
  type: 'select' as const,
  options: [
    { label: 'Primary', value: 'primary' },
    { label: 'Secondary', value: 'secondary' },
  ],
}
```

Option value literals are inferred automatically when the config is written
inline in `defineGissenConfig` — no `as const` on the options array is needed.

### `slot`

Optionally restrict which component types may appear as children:

```ts
const childrenField = { type: 'slot' as const, allow: ['Card', 'Text'] }
```

### Slot convention

A component that declares a `slot` field **must** expose a named slot in its template using the exact field name:

```vue
<!-- PricingCard.vue — field: features: { type: 'slot' } -->
<template>
  <div class="pricing-card">
    <h2>{{ name }}</h2>
    <ul>
      <slot name="features" />
    </ul>
  </div>
</template>
```

During editing, `<GissenEditor>` injects a drop zone into each named slot so child components can be placed there visually. During production rendering ([`<GissenRender>`](./rendering)) the slot receives the rendered children.

If the slot field is named `children`, the component must have `<slot name="children" />`. The slot name and the field name must match exactly.

Slot fields are **not props**: both the editor canvas and `<GissenRender>`
strip them from the props they pass and deliver the children through the
named slot instead. Your component should not declare the slot field in
`defineProps` — the props it receives are the non-slot fields plus `id`
(the exported `InferRenderProps` type).

## Root

The optional `root` entry configures the page's root container:

```ts
import { defineGissenConfig } from 'gissen'
import PageShell from './components/PageShell.vue'

const config = defineGissenConfig({
  components: { /* ... */ },
  root: {
    fields: { theme: { type: 'text' } },
    defaultProps: { theme: 'light' },
    render: PageShell,
  },
})
```

| Key | Description |
|---|---|
| `fields` | Field configs for the root's own props. When set, `validateData` checks `data.root.props` against them. |
| `defaultProps` | Applied to `root.props` by `createEmptyData(config)`. |
| `render` | A component wrapping the page content — in the editor canvas and in `<GissenRender>` alike. It receives `data.root.props` as props and the content through its default slot. See [Root rendering](./rendering#root-rendering). |

Without `root.render`, content renders bare — no wrapper element. The root is
not selectable on the canvas and its props have no panel UI yet; set them via
`defaultProps` or in the document.

## Runtime validation

Use `validateConfig` to check a config object at runtime — for example when loading a config from an external source:

```ts
import { GissenValidationError, validateConfig } from 'gissen'

try {
  const config = validateConfig(rawConfig)
}
catch (error) {
  if (error instanceof GissenValidationError) {
    console.error(error.issues) // ZodIssue[]
  }
}
```

Use `validateData` to check a saved page tree against a config before rendering:

```ts
import { GissenValidationError, validateData } from 'gissen'

try {
  const data = validateData(rawData, config)
}
catch (error) {
  if (error instanceof GissenValidationError) {
    // error.message contains paths like content[0].props.title
    console.error(error.message)
  }
}
```

## Utilities

```ts
import { createComponent, createEmptyData, ensureId, generateId } from 'gissen'

// Create a blank page
const page = createEmptyData()

// Create a component instance with defaultProps and a generated id
const hero = createComponent('Hero', config)

// Generate a short random id (nanoid, 10 chars)
const id = generateId()

// Fill in an id if one is missing
const component = ensureId({ type: 'Hero', props: { id: '', title: 'Hello' } })
```
