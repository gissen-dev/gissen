import type { GissenData } from 'gissen'
import type { DocumentContext, UpdateComponentInput, UpdateComponentResult } from './types'
import { NodeNotFoundError, ReservedFieldError, SlotFieldNotEditableError, UnknownFieldError } from './errors'
import { indexGrammar } from './grammar-index'
import { normalizeDocumentSlots } from './normalize-document'
import { resolveFieldValue } from './resolve-field-value'
import { findNode } from './tree'

/**
 * Merges `input.props` onto the target node. Every entry is checked first —
 * nothing is written unless every entry passes — so a partially-applied
 * update (some fields written, one rejected) can't happen. `applied` echoes
 * the value actually written per key, keyed as given.
 */
export function updateComponent(
  data: GissenData,
  ctx: DocumentContext,
  input: UpdateComponentInput,
): UpdateComponentResult {
  const index = indexGrammar(ctx.grammar)
  const page = structuredClone(data)
  normalizeDocumentSlots(page, index)

  const location = findNode(page, index, input.id)
  if (!location)
    throw new NodeNotFoundError(input.id)
  const { node } = location

  const applied: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input.props)) {
    // Checked before the unknown-key lookup so the message is about
    // reservation, not mistaken for a typo.
    if (key === 'id')
      throw new ReservedFieldError(node.props.id)

    const field = index.field(node.type, key)
    if (!field)
      throw new UnknownFieldError(node.props.id, node.type, key, index.fieldNames(node.type))

    if (field.type === 'slot') {
      throw new SlotFieldNotEditableError(node.props.id, node.type, key, index.slotFieldNames(node.type))
    }

    applied[key] = resolveFieldValue(field, value, { componentId: node.props.id, componentType: node.type })
  }

  // Object.assign writes every key, including one whose resolved value is
  // `undefined` — the cleared key stays present with value undefined, it is
  // never deleted, matching core's updateProp.
  Object.assign(node.props, applied)

  return { data: page, applied }
}
