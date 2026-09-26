import type { FieldConfig, GissenConfig } from 'gissen'
import type { ComponentGrammar, FieldGrammar, Grammar, RootGrammar } from './types'

/**
 * Derives the `Grammar` from a validated `GissenConfig`. Pure, deterministic,
 * no I/O.
 *
 * Uses `Object.entries` to walk `components` and `fields`, which preserves
 * declaration order for ordinary keys but — per the ECMAScript spec —
 * always enumerates integer-like string keys (`"0"`, `"1"`, ...) first, in
 * ascending order, ahead of every other key regardless of where they were
 * declared. `validateConfig` doesn't restrict component type names or field
 * names to identifier-like strings, so a config naming a component or field
 * `"0"` would surface out of its declared position here. Not worth guarding
 * against in Phase A — no real Gissen config has a reason to name a
 * component or field a bare integer — but noted rather than silently
 * assumed away.
 */
export function buildGrammar(config: GissenConfig): Grammar {
  const components: ComponentGrammar[] = Object.entries(config.components).map(([type, componentConfig]) => ({
    type,
    fields: buildFieldGrammars(componentConfig.fields),
  }))

  const root: RootGrammar | undefined = config.root?.fields
    ? { fields: buildFieldGrammars(config.root.fields) }
    : undefined

  return { components, root }
}

function buildFieldGrammars(fields: Record<string, FieldConfig>): FieldGrammar[] {
  return Object.entries(fields).map(([name, field]) => buildFieldGrammar(name, field))
}

function buildFieldGrammar(name: string, field: FieldConfig): FieldGrammar {
  const base = { name, label: field.label }

  switch (field.type) {
    case 'text':
      return { ...base, type: 'text' }
    case 'textarea':
      return { ...base, type: 'textarea', rows: field.rows }
    case 'number':
      return { ...base, type: 'number', min: field.min, max: field.max, step: field.step }
    case 'select':
      return { ...base, type: 'select', options: [...field.options] }
    case 'boolean':
      return { ...base, type: 'boolean' }
    case 'slot':
      return { ...base, type: 'slot', allow: field.allow ?? 'any' }
    default:
      return assertNever(field)
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled field type: ${JSON.stringify(value)}`)
}
