import type { Component } from 'vue'

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

/** A select (dropdown) field with a fixed set of options. */
export interface SelectField extends FieldBase {
  type: 'select'
  options: ReadonlyArray<{ label: string, value: string | number }>
}

/** A boolean (toggle) field. */
export interface BooleanField extends FieldBase {
  type: 'boolean'
}

/** A slot field that holds nested child components. */
export interface SlotField extends FieldBase {
  type: 'slot'
  /** Optional list of component type names that are allowed in this slot. */
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

/** Configuration for a registered, editable component. */
export interface ComponentConfig<TProps = Record<string, unknown>> {
  /** Map of prop name to field config. */
  fields: Record<string, FieldConfig>
  /** Default values applied to new instances. */
  defaultProps?: Partial<TProps>
  /** The Vue component used both in the editor canvas and in production render. */
  render: Component
}

/** Configuration for the page root container. */
export interface RootConfig<TProps = Record<string, unknown>> {
  fields?: Record<string, FieldConfig>
  defaultProps?: Partial<TProps>
  render?: Component
}

/** The top-level Gissen configuration object. */
export interface GissenConfig {
  components: Record<string, ComponentConfig>
  root?: RootConfig
}
