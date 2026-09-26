import type { GissenData } from 'gissen'
import type { DocumentContext, MoveComponentInput, MoveComponentResult, ResolvedPlacement } from './types'
import { MoveIntoDescendantError, MoveIntoSelfError, NodeNotFoundError } from './errors'
import { indexGrammar } from './grammar-index'
import { normalizeDocumentSlots } from './normalize-document'
import { resolveIndex, resolveInsertionTarget } from './placement'
import { containsId, findNode, formatNodePath } from './tree'

/**
 * Relocates a node to `input.parentId`/`input.slot` (or the top level) and
 * `input.index` (or appended). Rejects moving a node into itself or any of
 * its own descendants, and rejects an index out of range.
 */
export function moveComponent(data: GissenData, ctx: DocumentContext, input: MoveComponentInput): MoveComponentResult {
  const index = indexGrammar(ctx.grammar)
  const page = structuredClone(data)
  normalizeDocumentSlots(page, index)

  const location = findNode(page, index, input.id)
  if (!location)
    throw new NodeNotFoundError(input.id)

  const newParentId = input.parentId ?? null
  if (newParentId !== null) {
    if (newParentId === input.id)
      throw new MoveIntoSelfError(input.id)
    if (containsId(location.node, index, newParentId)) {
      const descendantLocation = findNode(page, index, newParentId)
      throw new MoveIntoDescendantError(
        input.id,
        newParentId,
        descendantLocation ? formatNodePath(descendantLocation.path) : newParentId,
      )
    }
  }

  const lastStep = location.path[location.path.length - 1]
  const from: ResolvedPlacement = { parentId: lastStep.parentId, slot: lastStep.slot, index: location.index }

  // Resolve and vet the destination BEFORE detaching, so a rejected move
  // leaves the tree untouched — mirrors core's useEditorStore.moveComponent.
  const target = resolveInsertionTarget(page, index, input, location.node.type)
  const isSameArray = target.siblings === location.siblings
  const resolvedIndex = resolveIndex(input.index, target.siblings.length, target)

  location.siblings.splice(location.index, 1)

  // `resolvedIndex` was measured against the pre-removal array; moving to a
  // later position within the SAME array needs to shift back by one now that
  // the node's own old slot is gone. Same-array detection uses array
  // identity rather than comparing (parentId, slot) tuples — same outcome,
  // one less thing to get wrong, and immune to id confusion.
  const adjustedIndex = isSameArray && resolvedIndex > location.index ? resolvedIndex - 1 : resolvedIndex

  target.siblings.splice(adjustedIndex, 0, location.node)

  return {
    data: page,
    from,
    to: { parentId: target.parentId, slot: target.slot, index: adjustedIndex },
  }
}
