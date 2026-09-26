import type { ComponentData, GissenData } from 'gissen'
import type { GrammarIndex } from './grammar-index'
import type { Placement } from './types'
import {
  FieldIsNotASlotError,
  IndexOutOfRangeError,
  ParentNotFoundError,
  RootSlotNotApplicableError,
  SlotRequiredError,
  TypeNotAllowedInSlotError,
} from './errors'
import { findNode } from './tree'

export interface InsertionTarget {
  /** The live array to splice into, inside the tree being edited. */
  siblings: ComponentData[]
  parentId: string | null
  slot: string | null
}

/**
 * Resolves and vets a `Placement` against the tree and grammar: the parent
 * exists, the named field is actually declared as a slot, and `childType` is
 * allowed in it. Shared by add and move so the allow-list check exists
 * exactly once — core duplicates it across `insertComponent`/`moveComponent`.
 *
 * `RootConfig` has no `allow` concept, so the top level accepts every
 * registered type — there is no allow-list check to run when `parentId` is
 * omitted. Both illegal argument combinations are rejected rather than
 * ignored (core silently ignores a `slotName` given at the top level):
 * a `parentId` without a `slot` names an ambiguous destination inside that
 * parent; a `slot` without a `parentId` names a destination ("the top level")
 * that has no such concept.
 */
export function resolveInsertionTarget(
  data: GissenData,
  index: GrammarIndex,
  placement: Placement,
  childType: string,
): InsertionTarget {
  const parentId = placement.parentId ?? null

  if (parentId === null) {
    if (placement.slot != null)
      throw new RootSlotNotApplicableError(placement.slot)
    return { siblings: data.content, parentId: null, slot: null }
  }

  const parentLocation = findNode(data, index, parentId)
  if (!parentLocation)
    throw new ParentNotFoundError(parentId)
  const parent = parentLocation.node

  if (placement.slot == null)
    throw new SlotRequiredError(parentId, parent.type, index.slotFieldNames(parent.type))

  const slotField = index.field(parent.type, placement.slot)
  if (!slotField || slotField.type !== 'slot') {
    throw new FieldIsNotASlotError(
      parentId,
      parent.type,
      placement.slot,
      slotField ? slotField.type : 'undeclared',
      index.slotFieldNames(parent.type),
    )
  }

  if (slotField.allow !== 'any' && !slotField.allow.includes(childType))
    throw new TypeNotAllowedInSlotError(parentId, parent.type, placement.slot, childType, slotField.allow)

  // Every operation normalizes its clone before doing anything else, so this
  // is already an array in practice — but resolving it defensively here
  // (rather than trusting that ordering) means `siblings` can never be a
  // fresh, disconnected array that a later splice would silently write into
  // nothing.
  const existing = parent.props[placement.slot]
  const siblings: ComponentData[] = Array.isArray(existing) ? existing : []
  if (!Array.isArray(existing))
    parent.props[placement.slot] = siblings

  return { siblings, parentId, slot: placement.slot }
}

/**
 * Validates a requested insertion index against the current array length,
 * defaulting to "append" when omitted. Rejects out of range rather than
 * clamping — core's `splice` clamps silently, which for an agent means a
 * wrong index it never learns about.
 */
export function resolveIndex(
  requested: number | undefined,
  length: number,
  target: { parentId: string | null, slot: string | null },
): number {
  if (requested === undefined)
    return length
  if (!Number.isInteger(requested) || requested < 0 || requested > length)
    throw new IndexOutOfRangeError(requested, length, target.parentId, target.slot)
  return requested
}
