import type { Component } from 'vue'
import type { FieldConfig, InferComponentProps, InferRenderProps, RootConfig } from './types'

/** Internal shape used to validate each component before inferring types. */
interface ComponentInput<F extends Record<string, FieldConfig>> {
  fields: F
  defaultProps?: Partial<InferComponentProps<F>>
  // Slot fields are delivered as named slots, not props — the render
  // component is checked against the non-slot props only.
  render: Component<InferRenderProps<F>>
}

/** Internal mapped type that associates each component name with its typed config. */
type ComponentsInput<TFields extends { [K: string]: Record<string, FieldConfig> }> = {
  [K in keyof TFields]: ComponentInput<TFields[K]>
}

/**
 * Identity helper that provides full type inference for a Gissen config object,
 * mirroring the `defineConfig` pattern used by Vite. At runtime it simply
 * returns the config it is given.
 *
 * Each component's `defaultProps` is type-checked against the prop types
 * derived from `fields`. `SelectField` option values are narrowed to their
 * literal union (e.g. `'signup' | 'buy'`).
 */
export function defineGissenConfig<
  const TFields extends { [K: string]: Record<string, FieldConfig> },
>(
  config: {
    components: ComponentsInput<TFields>
    root?: RootConfig
  },
): {
    components: ComponentsInput<TFields>
    root?: RootConfig
  } {
  return config
}
