import type { GissenData } from 'gissen'
import type { AddComponentInput, AddComponentResult, DocumentContext } from './types'
import { createNode } from './create-node'
import { indexGrammar } from './grammar-index'
import { normalizeDocumentSlots } from './normalize-document'
import { resolveIndex, resolveInsertionTarget } from './placement'

/**
 * Inserts a new component of `input.type`, at `input.parentId`/`input.slot`
 * (or the top level, when omitted) and `input.index` (or appended, when
 * omitted). The allow-list check for the destination slot is authoritative
 * here (see `resolveInsertionTarget`).
 */
export function addComponent(data: GissenData, ctx: DocumentContext, input: AddComponentInput): AddComponentResult {
  const index = indexGrammar(ctx.grammar)
  const page = structuredClone(data)
  normalizeDocumentSlots(page, index)

  const node = createNode(input.type, ctx)
  const target = resolveInsertionTarget(page, index, input, input.type)
  const resolvedIndex = resolveIndex(input.index, target.siblings.length, target)

  target.siblings.splice(resolvedIndex, 0, node)

  return {
    data: page,
    id: node.props.id,
    placement: { parentId: target.parentId, slot: target.slot, index: resolvedIndex },
  }
}
