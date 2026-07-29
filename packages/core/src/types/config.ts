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

/**
 * Keys of the slot fields in a `fields` record. Only literal field records
 * narrow: for the loose default `Record<string, FieldConfig>` the conditional
 * sees the whole `FieldConfig` union and resolves to `never`.
 */
type SlotFieldKeys<Fields extends Record<string, FieldConfig>> = {
  [K in keyof Fields]: Fields[K] extends SlotField ? K : never
}[keyof Fields]

/**
 * The props a registered component actually receives at render time: every
 * non-slot field plus the node `id`. Slot fields are not props — their
 * children arrive as named Vue slots (`<slot :name="fieldName">`), in both
 * the editor canvas and `<GissenRender>`. (`defaultProps` is the place slot
 * fields appear as values; that one keeps `InferComponentProps`.)
 *
 * Every field is optional here because absence is a valid state at render
 * time — a cleared number field, a hand-authored document omitting a key, a
 * node created without a default. Neither the canvas nor `<GissenRender>`
 * injects values, so components declare these props optional and own their
 * defaults. Only `id` is structurally guaranteed.
 */
export type InferRenderProps<Fields extends Record<string, FieldConfig>> =
  Partial<Omit<InferComponentProps<Fields>, SlotFieldKeys<Fields>>> & { id: string }

/** Configuration for a registered, editable component. */
export interface ComponentConfig<TFields extends Record<string, FieldConfig> = Record<string, FieldConfig>> {
  /** Map of prop name to field config. */
  fields: TFields
  /** Default values applied to new instances; type-checked against inferred props. */
  defaultProps?: Partial<InferComponentProps<TFields>>
  /**
   * The Vue component rendered in both editor canvas and production output.
   * Receives the non-slot field props plus `id` (see `InferRenderProps`);
   * slot-field children arrive as named Vue slots. Deliberately typed as the
   * loose `Component` here: `Component<P>` is contravariant in its props, so
   * a precise type at the registry level would make every concretely-typed
   * config unassignable to `GissenConfig`. `defineGissenConfig` is where the
   * component is checked against the props inferred from `fields`.
   */
  render: Component
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
   * The Vue component wrapping the page content, in both the editor canvas and
   * `<GissenRender>`. Receives `data.root.props` as props and the page content
   * through its default slot. When omitted, content renders bare — no wrapper
   * element. There is no panel UI for editing root props yet; set them via
   * `defaultProps` (applied by `createEmptyData`) or in the document itself.
   */
  render?: Component
}

/** The top-level Gissen configuration object. */
export interface GissenConfig {
  components: Record<string, ComponentConfig>
  root?: RootConfig
}
