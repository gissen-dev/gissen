import type { ComponentGrammar, FieldGrammar, Grammar, SlotFieldGrammar } from '../grammar/types'

/**
 * O(1) lookups over a `Grammar`, and the single source of the *lists*
 * instructive errors quote (available types, a component's field/slot
 * names). Built fresh per operation call — a config's grammar is a few dozen
 * entries at most, so a map isn't worth caching across calls.
 */
export interface GrammarIndex {
  /** Declaration-ordered registered type names. */
  readonly types: readonly string[]
  component: (type: string) => ComponentGrammar | undefined
  field: (type: string, name: string) => FieldGrammar | undefined
  /** Declared field names for a type; `[]` for an unknown type. */
  fieldNames: (type: string) => string[]
  /** Only the slot fields on a type; `[]` for an unknown type. */
  slotFields: (type: string) => SlotFieldGrammar[]
  slotFieldNames: (type: string) => string[]
}

export function indexGrammar(grammar: Grammar): GrammarIndex {
  const byType = new Map<string, ComponentGrammar>(grammar.components.map(c => [c.type, c]))
  const types = grammar.components.map(c => c.type)

  return {
    types,
    component: type => byType.get(type),
    field: (type, name) => byType.get(type)?.fields.find(f => f.name === name),
    fieldNames: type => byType.get(type)?.fields.map(f => f.name) ?? [],
    slotFields: type => (byType.get(type)?.fields.filter((f): f is SlotFieldGrammar => f.type === 'slot')) ?? [],
    slotFieldNames: type => (byType.get(type)?.fields.filter(f => f.type === 'slot').map(f => f.name)) ?? [],
  }
}
