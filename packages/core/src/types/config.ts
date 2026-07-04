import type { Component } from 'vue'
import type { ComponentData } from './data'

/** The set of field editor types Gissen supports in v0.1. */
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'boolean'
  | 'slot'

interface FieldBase {
  /** Human-readable label shown in the properties panel. */
  label?: string
}

/** A single-line text input field. */
export interface TextField extends FieldBase {
  type: 'text'
}

/** A multi-line text input field. */
export interface TextareaField extends FieldBase {
  type: 'textarea'
  /** Number of visible text rows. */
  rows?: number
}

/** A numeric input field. */
export interface NumberField extends FieldBase {
  type: 'number'
  min?: number
  max?: number
  step?: number
}

/**
 * A select (dropdown) field with a fixed set of options.
 * Generic over `TOptions` so that literal option values flow through to
 * `InferFieldType`, producing a union of the exact value literals.
 */
export interface SelectField<
  TOptions extends ReadonlyArray<{ label: string, value: string | number }> = ReadonlyArray<{ label: string, value: string | number }>,
> extends FieldBase {
  type: 'select'
  options: TOptions
}

/** A boolean (toggle) field. */
export interface BooleanField extends FieldBase {
  type: 'boolean'
}

/** A slot field that holds nested child components. */
export interface SlotField extends FieldBase {
  type: 'slot'
  /** Optional allow-list of component type names permitted in this slot. */
  allow?: readonly string[]
}

/** Any supported field configuration. */
export type FieldConfig =
  | TextField
  | TextareaField
  | NumberField
  | SelectField
  | BooleanField
  | SlotField

/**
 * Maps a single field config to its TypeScript value type:
 * - text / textarea → `string`
 * - number → `number`
 * - boolean → `boolean`
 * - select → union of option value literals (e.g. `'signup' | 'buy'`)
 * - slot → `ComponentData[]`
 */
export type InferFieldType<F extends FieldConfig> =
  F extends TextField ? string
    : F extends TextareaField ? string
      : F extends NumberField ? number
        : F extends BooleanField ? boolean
          : F extends SelectField<infer TOptions> ? TOptions[number]['value']
            : F extends SlotField ? ComponentData[]
              : never

/**
 * Maps a `fields` record to a props object by applying `InferFieldType` to
 * each entry.
 */
export type InferComponentProps<Fields extends Record<string, FieldConfig>> = {
  [K in keyof Fields]: InferFieldType<Fields[K]>
}

/** Configuration for a registered, editable component. */
export interface ComponentConfig<TFields extends Record<string, FieldConfig> = Record<string, FieldConfig>> {
  /** Map of prop name to field config. */
  fields: TFields
  /** Default values applied to new instances; type-checked against inferred props. */
  defaultProps?: Partial<InferComponentProps<TFields>>
  /** The Vue component rendered in both editor canvas and production output. */
  render: Component<InferComponentProps<TFields> & { id: string }>
}

/** Configuration for the page root container. */
export interface RootConfig<TProps = Record<string, unknown>> {
  /**
   * Field editors for the root's own props. When set, `validateData` checks
   * `data.root.props` against these fields.
   */
  fields?: Record<string, FieldConfig>
  /** Default values applied to the root's props. */
  defaultProps?: Partial<TProps>
  /**
   * The Vue component wrapping the page content.
   *
   * NOT YET IMPLEMENTED: the canvas does not render `root.render` in v0.1 —
   * content is rendered at the top level with no root wrapper. Declaring it has
   * no runtime effect today; it is reserved for a future release.
   */
  render?: Component
}

/** The top-level Gissen configuration object. */
export interface GissenConfig {
  components: Record<string, ComponentConfig>
  root?: RootConfig
}
