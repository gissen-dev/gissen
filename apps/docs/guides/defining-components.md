# Defining components

<GissenStatus />

A config is a map from component names to three things: the editable `fields`, the `defaultProps` for new instances, and the Vue component to `render`.

<<< @/snippets/guides/defining-components/config.ts [gissen.config.ts]

`defineGissenConfig` returns the object you give it. It exists so TypeScript can check the config and infer types from it.

## What TypeScript checks

- `defaultProps` must match the types inferred from `fields`. Here `cta` is `'signup' | 'buy'`, so any other value is an error.
- The `render` component must accept the props it will receive.

<<< @/snippets/guides/defining-components/type-errors.ts [type-errors.ts]

## The component

The component receives every non-slot field as a prop, plus `id`. It must declare `id`, or the type check fails. Gissen sets the id of every node.

<<< @/snippets/guides/defining-components/components/Hero.vue [Hero.vue]

Declare the field props as optional. A cleared field is missing from the saved JSON, and Gissen passes `undefined`. Your component owns its fallbacks.

## Field types

| Type | Input | Value type |
|---|---|---|
| `text` | Single-line text | `string` |
| `textarea` | Multi-line text | `string` |
| `number` | Number | `number` |
| `boolean` | Toggle | `boolean` |
| `select` | Dropdown | The union of the option values |
| `slot` | Child components | `ComponentData[]` |

Every field accepts an optional `label` for the properties panel.

### text

<<< @/snippets/guides/defining-components/field-types.ts#text [field-types.ts]

### textarea

`rows` sets the number of visible rows.

<<< @/snippets/guides/defining-components/field-types.ts#textarea [field-types.ts]

### number

`min` and `max` limit the value. The panel clamps typed values to them, and `validateData` rejects saved values outside them. `step` makes the panel snap typed values to a grid. `validateData` does not check `step`.

<<< @/snippets/guides/defining-components/field-types.ts#number [field-types.ts]

### boolean

<<< @/snippets/guides/defining-components/field-types.ts#boolean [field-types.ts]

### select

Option values can be strings or numbers. When you write the field inline in `defineGissenConfig`, the values become literal types without `as const`.

<<< @/snippets/guides/defining-components/field-types.ts#select [field-types.ts]

### slot

A slot field holds other components. See [Slots and allow lists](./slots).

<<< @/snippets/guides/defining-components/field-types.ts#slot [field-types.ts]

## defaultProps

`createComponent` and the editor's sidebar copy `defaultProps` into every new instance. Each instance gets its own copy and its own `id`.

- Do not put `id` in `defaultProps`. It is reserved, and `validateConfig` rejects it.
- Do not use `null`. Leave the key out if the field should start empty.
- `validateConfig` checks the values against the field type, `min`, `max` and the `select` options.
- Slot fields start as `[]`. You can put components in a slot's default, and each gets a new id.

## The root

The optional `root` wraps the whole page. It has its own `fields`, `defaultProps` and `render` component. The component receives the root props and the page content in its default slot.

<<< @/snippets/guides/defining-components/root.ts [gissen.config.ts]

The properties panel has no inputs for root props yet. Set them with `defaultProps`, or in the document.

## Check a config at runtime

TypeScript checks the config in your editor. If a config comes from somewhere TypeScript cannot see, call `validateConfig`. It throws a `GissenValidationError`. See the [API reference](../api/gissen#validateconfig).
