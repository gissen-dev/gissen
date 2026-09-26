import type { ComponentData } from 'gissen'
import type { DocumentContext } from './types'
import { createComponent } from 'gissen'
import { UnknownComponentTypeError } from './errors'
import { indexGrammar } from './grammar-index'

/**
 * Builds a new node for a registered type, applying the config's declared
 * `defaultProps` — via `gissen`'s public `createComponent`, exactly what the
 * editor does on drag-drop, so an agent-created node is indistinguishable
 * from a human-created one.
 *
 * Guarded only on unregistered types, because `createComponent` throws a
 * bare `Error` there, losing the instructive type list. A config whose own
 * `defaultProps` violates its field's constraints (type/range/select/`id`/
 * `null`) is now rejected earlier, by `validateConfig` at server startup
 * (see docs/devlog/phase-7.md) — the server never gets far enough to call
 * this function with such a config, so it doesn't need to guard against it
 * a second time here.
 */
export function createNode(type: string, ctx: DocumentContext): ComponentData {
  const index = indexGrammar(ctx.grammar)
  const grammar = index.component(type)
  if (!grammar)
    throw new UnknownComponentTypeError(type, index.types)

  return createComponent(type, ctx.config)
}
