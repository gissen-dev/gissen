import type { ComponentData, GissenData } from 'gissen'
import type { GrammarIndex } from './grammar-index'
import type { NodeLocation, NodeStep } from './types'
import { DuplicateComponentIdsError } from './errors'

/**
 * A node's declared slot children, keyed by slot field name — `[]` for a
 * declared slot whose prop is currently absent or not yet an array.
 *
 * Grammar-driven, unlike core's `getSlotEntries` (which treats *any*
 * array-valued prop as children): this can't mis-walk a non-slot prop that
 * happens to hold an array, and it distinguishes "declared slot, currently
 * absent" (returns `[]` for that slot) from "not a slot" (omitted entirely)
 * — a distinction core's `Array.isArray` heuristic cannot make. Trusting the
 * grammar here is safe because every entry point requires input that already
 * passed `validateData` (which rejects an unregistered component type), so a
 * node's `type` is always known to the grammar.
 */
export function slotChildren(
  node: ComponentData,
  index: GrammarIndex,
): { slot: string, children: ComponentData[] }[] {
  return index.slotFieldNames(node.type).map((slot) => {
    const value = node.props[slot]
    return { slot, children: Array.isArray(value) ? value : [] }
  })
}

function search(
  arr: ComponentData[],
  index: GrammarIndex,
  id: string,
  parentId: string | null,
  slot: string | null,
  prefix: readonly NodeStep[],
): NodeLocation | null {
  for (let i = 0; i < arr.length; i++) {
    const node = arr[i]
    const path = [...prefix, { parentId, slot, index: i }]
    if (node.props.id === id)
      return { node, path, siblings: arr, index: i }
    for (const entry of slotChildren(node, index)) {
      const result = search(entry.children, index, id, node.props.id, entry.slot, path)
      if (result)
        return result
    }
  }
  return null
}

/** Finds a node by id anywhere in the tree. `null` if not found. */
export function findNode(data: GissenData, index: GrammarIndex, id: string): NodeLocation | null {
  return search(data.content, index, id, null, null, [])
}

/** Depth-first visit of every node in the tree, each with its root-to-node path. */
export function walkNodes(
  data: GissenData,
  index: GrammarIndex,
  visit: (node: ComponentData, path: readonly NodeStep[]) => void,
): void {
  function walk(arr: ComponentData[], parentId: string | null, slot: string | null, prefix: readonly NodeStep[]): void {
    for (let i = 0; i < arr.length; i++) {
      const node = arr[i]
      const path = [...prefix, { parentId, slot, index: i }]
      visit(node, path)
      for (const entry of slotChildren(node, index))
        walk(entry.children, node.props.id, entry.slot, path)
    }
  }
  walk(data.content, null, null, [])
}

/** True when `id` is anywhere in the subtree strictly beneath `node` (not `node` itself). */
export function containsId(node: ComponentData, index: GrammarIndex, id: string): boolean {
  for (const entry of slotChildren(node, index)) {
    for (const child of entry.children) {
      if (child.props.id === id || containsId(child, index, id))
        return true
    }
  }
  return false
}

/** `node`'s own id plus every descendant id — what a deletion removes from existence. */
export function collectSubtreeIds(node: ComponentData, index: GrammarIndex): string[] {
  const ids = [node.props.id]
  for (const entry of slotChildren(node, index)) {
    for (const child of entry.children)
      ids.push(...collectSubtreeIds(child, index))
  }
  return ids
}

/** Renders a path as `content[0].props.children[2]`, matching how `validateData`'s own ZodIssue paths read. */
export function formatNodePath(path: readonly NodeStep[]): string {
  return path
    .map((step, i) => (i === 0 ? `content[${step.index}]` : `.props.${step.slot ?? ''}[${step.index}]`))
    .join('')
}

/**
 * Finds every id that occurs more than once in the tree, with every path it
 * occurs at. `gissen` has no uniqueness rule for ids (`validateData` doesn't
 * check it, and core's `findComponent` silently resolves the first match) —
 * this is the one check Phase B adds on top of `validateData`, because an
 * ambiguous id would make every operation address the wrong node with no
 * signal to anyone.
 */
export function findDuplicateIds(data: GissenData, index: GrammarIndex): { id: string, paths: string[] }[] {
  const seen = new Map<string, string[]>()
  walkNodes(data, index, (node, path) => {
    const formatted = formatNodePath(path)
    const existing = seen.get(node.props.id)
    if (existing)
      existing.push(formatted)
    else
      seen.set(node.props.id, [formatted])
  })
  return [...seen.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([id, paths]) => ({ id, paths }))
}

/** Throws `DuplicateComponentIdsError` if any id occurs more than once. */
export function assertUniqueIds(data: GissenData, index: GrammarIndex): void {
  const duplicates = findDuplicateIds(data, index)
  if (duplicates.length > 0)
    throw new DuplicateComponentIdsError(duplicates)
}
