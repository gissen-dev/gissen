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
          ] as const,
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

TypeScript infers prop types from `fields`. `Hero`'s `cta` prop is narrowed to `'signup' | 'buy'`; `PricingCard`'s `features` prop is typed as `ComponentData[]`. Setting `defaultProps` to a value incompatible with the inferred type is a compile-time error.

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

Use `as const` on the options array to preserve literal value types for TypeScript narrowing:

```ts
const variantField = {
  type: 'select' as const,
  options: [
    { label: 'Primary', value: 'primary' },
    { label: 'Secondary', value: 'secondary' },
  ] as const,
}
```

### `slot`

Optionally restrict which component types may appear as children:

```ts
const childrenField = { type: 'slot' as const, allow: ['Card', 'Text'] }
```

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
