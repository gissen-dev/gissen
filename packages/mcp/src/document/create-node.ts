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
 *
 * `null` is checked separately, before `resolveFieldValue`, rather than
 * folded into the same try/catch: `resolveFieldValue` treats `null` as the
 * agent-facing "clear this field" signal for `update_component` and
 * resolves it (to `''` or `undefined`) instead of throwing. That's the
 * wrong behavior here — a literal `null` in `defaultProps` is not a user
 * clearing a field, it's the config itself declaring an invalid default —
 * and silently laundering it into an accepted empty value would both mask a
 * likely config mistake and leave `null`'s meaning inconsistent depending on
 * which of the two places it showed up.
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
    if (value === null) {
      throw new InvalidDefaultPropError(type, field.name, value, 'defaultProps cannot be null — omit the key entirely if you want the field to start unset')
    }
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
