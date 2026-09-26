import type { ComponentData } from 'gissen'
import type { DocumentContext } from './types'
import { createComponent } from 'gissen'
import { InvalidDefaultPropError, UnknownComponentTypeError } from './errors'
import { indexGrammar } from './grammar-index'
import { resolveFieldValue } from './resolve-field-value'

/**
 * Builds a new node for a registered type, applying the config's declared
 * `defaultProps` — via `gissen`'s public `createComponent`, exactly what the
 * editor does on drag-drop, so an agent-created node is indistinguishable
 * from a human-created one.
 *
 * Guarded on both sides of `createComponent`: before, because it throws a
 * bare `Error` on an unregistered type, losing the instructive type list;
 * after, because `validateConfig` does not range-check `defaultProps` while
 * `validateData` does — a config declaring `defaultProps: { level: 99 }`
 * against `max: 6` would otherwise let this function emit a node that fails
 * validation the instant it's created.
 */
export function createNode(type: string, ctx: DocumentContext): ComponentData {
  const index = indexGrammar(ctx.grammar)
  const grammar = index.component(type)
  if (!grammar)
    throw new UnknownComponentTypeError(type, index.types)

  const node = createComponent(type, ctx.config)

  for (const field of grammar.fields) {
    if (field.type === 'slot')
      continue
    const value = node.props[field.name]
    if (value === undefined)
      continue
    try {
      resolveFieldValue(field, value, { componentId: node.props.id, componentType: type })
    }
    catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause)
      throw new InvalidDefaultPropError(type, field.name, value, reason)
    }
  }

  return node
}
