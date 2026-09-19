import type { FieldGrammar, Grammar } from '../grammar/types'

/**
 * Renders one line per registered component type, its declared fields and
 * what each accepts — the block embedded in every tool description so an
 * agent knows what it may build without a separate lookup. `label` (editor
 * panel chrome) and `step` (a UI-only affordance `validateData` never range
 * checks — see `packages/core/src/validation/validate-data.ts`) are
 * deliberately omitted: advertising `step` would promise an enforcement
 * that doesn't exist.
 */
export function describeComponentTypes(grammar: Grammar): string {
  if (grammar.components.length === 0)
    return '(none — this project has no registered component types)'
  return grammar.components
    .map(component => `${component.type} — ${component.fields.map(describeField).join('; ')}`)
    .join('\n')
}

/** Renders the page root's own fields, for `read_page`'s description — no tool edits these (decision 3 forbids a sixth). */
export function describeRootFields(grammar: Grammar): string | undefined {
  if (!grammar.root)
    return undefined
  return grammar.root.fields.map(describeField).join('; ')
}

export function describeField(field: FieldGrammar): string {
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'boolean':
      return `${field.name}: ${field.type}`
    case 'number':
      return `${field.name}: number${describeNumberRange(field.min, field.max)}`
    case 'select':
      return `${field.name}: select (${field.options.map(option => JSON.stringify(option.value)).join(' | ')})`
    case 'slot':
      return `${field.name}: slot (accepts: ${field.allow === 'any' ? 'any registered type' : field.allow.join(', ')})`
  }
}

function describeNumberRange(min: number | undefined, max: number | undefined): string {
  if (min !== undefined && max !== undefined)
    return ` (${min}..${max})`
  if (min !== undefined)
    return ` (${min} or greater)`
  if (max !== undefined)
    return ` (${max} or less)`
  return ''
}
