import type { GissenData } from 'gissen'
import type { DeleteComponentInput, DeleteComponentResult, DocumentContext } from './types'
import { NodeNotFoundError } from './errors'
import { indexGrammar } from './grammar-index'
import { normalizeDocumentSlots } from './normalize-document'
import { collectSubtreeIds, findNode } from './tree'

/** Removes a node and its entire subtree, reporting every id that just stopped existing. */
export function deleteComponent(
  data: GissenData,
  ctx: DocumentContext,
  input: DeleteComponentInput,
): DeleteComponentResult {
  const index = indexGrammar(ctx.grammar)
  const page = structuredClone(data)
  normalizeDocumentSlots(page, index)

  const location = findNode(page, index, input.id)
  if (!location)
    throw new NodeNotFoundError(input.id)

  const removedDescendantIds = collectSubtreeIds(location.node, index).filter(id => id !== input.id)

  location.siblings.splice(location.index, 1)

  return {
    data: page,
    removedId: input.id,
    removedType: location.node.type,
    removedDescendantIds,
  }
}
