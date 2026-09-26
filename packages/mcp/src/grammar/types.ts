import type { FieldType } from 'gissen'

interface FieldGrammarBase {
  /** The prop key exactly as declared in `ComponentConfig.fields` / `RootConfig.fields`. */
  name: string
  type: FieldType
  /** Present only when the field config declares a `label`. */
  label?: string
}

export interface TextFieldGrammar extends FieldGrammarBase {
  type: 'text'
}

export interface TextareaFieldGrammar extends FieldGrammarBase {
  type: 'textarea'
  rows?: number
}

export interface NumberFieldGrammar extends FieldGrammarBase {
  type: 'number'
  min?: number
  max?: number
  step?: number
}

export interface SelectFieldGrammar extends FieldGrammarBase {
  type: 'select'
  options: { label: string, value: string | number }[]
}

export interface BooleanFieldGrammar extends FieldGrammarBase {
  type: 'boolean'
}

export interface SlotFieldGrammar extends FieldGrammarBase {
  type: 'slot'
  /**
   * The slot's allow-list, or the literal `'any'` when the field declares no
   * `allow` — an explicit sentinel so a consumer never has to guess whether
   * an absent list means "unrestricted" or "field missing".
   */
  allow: readonly string[] | 'any'
}

/** Grammar detail for one declared field, mirroring `FieldConfig`'s discriminated union. */
export type FieldGrammar =
  | TextFieldGrammar
  | TextareaFieldGrammar
  | NumberFieldGrammar
  | SelectFieldGrammar
  | BooleanFieldGrammar
  | SlotFieldGrammar

/** Grammar for one registered component type. */
export interface ComponentGrammar {
  /** Matches the key in `GissenConfig.components` and `ComponentData.type`. */
  type: string
  /**
   * Declaration-ordered so downstream renderings (a prose dump, a JSON
   * Schema) don't need to re-sort — except for a field whose name is an
   * integer-like string (`"0"`, `"1"`, ...), which `Object.entries` (used to
   * build this list) always enumerates first, ascending, ahead of every
   * other key, regardless of where it was declared. See `buildGrammar`.
   */
  fields: FieldGrammar[]
}

/** Grammar for the page root's own props, present only when `config.root.fields` is set. */
export interface RootGrammar {
  fields: FieldGrammar[]
}

/**
 * The config-derived "grammar": what a caller may do with this Gissen
 * instance, expressed independently of any particular tool surface. Phase A
 * only prints this; later phases derive MCP tool schemas and descriptions
 * from it.
 */
export interface Grammar {
  /** Declaration-ordered, with the same integer-like-key caveat as `ComponentGrammar.fields`. */
  components: ComponentGrammar[]
  root?: RootGrammar
}
