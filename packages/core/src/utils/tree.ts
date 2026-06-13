import type { ComponentData, GissenData } from '../types'

export interface FindResult {
  component: ComponentData
  /** Direct reference to the array holding this component — use for splice operations. */
  siblings: ComponentData[]
  index: number
  /** null when the component is a direct child of data.content (top level). */
  parentId: string | null
  /** null when the component is at the top level. */
  slotName: string | null
}

/**
 * Returns all slot arrays for a component.
 * The invariant: the only array-typed props on ComponentData are slot fields.
 */
function getSlotEntries(component: ComponentData): Array<{ slotName: string, children: ComponentData[] }> {
  const entries: Array<{ slotName: string, children: ComponentData[] }> = []
  for (const [key, value] of Object.entries(component.props)) {
    if (Array.isArray(value)) {
      entries.push({ slotName: key, children: value as ComponentData[] })
    }
  }
  return entries
}

function searchArray(
  arr: ComponentData[],
  id: string,
  parentId: string | null,
  slotName: string | null,
): FindResult | null {
  for (let i = 0; i < arr.length; i++) {
    const component = arr[i]
    if (component.props.id === id) {
      return { component, siblings: arr, index: i, parentId, slotName }
    }
    for (const { slotName: childSlot, children } of getSlotEntries(component)) {
      const result = searchArray(children, id, component.props.id, childSlot)
      if (result)
        return result
    }
  }
  return null
}

/** Finds a component by ID anywhere in the tree. Returns null if not found. */
export function findComponent(data: GissenData, id: string): FindResult | null {
  return searchArray(data.content, id, null, null)
}

/** Depth-first traversal of all component nodes in the tree. */
export function walkTree(
  data: GissenData,
  visitor: (component: ComponentData, parentId: string | null, slotName: string | null) => void,
): void {
  function walkArray(arr: ComponentData[], parentId: string | null, slotName: string | null): void {
    for (const component of arr) {
      visitor(component, parentId, slotName)
      for (const { slotName: childSlot, children } of getSlotEntries(component)) {
        walkArray(children, component.props.id, childSlot)
      }
    }
  }
  walkArray(data.content, null, null)
}

/**
 * Returns true if `descendantId` is anywhere in the subtree rooted at `ancestor`.
 * Used to prevent moving a component into its own descendant.
 */
export function isAncestorOf(ancestor: ComponentData, descendantId: string): boolean {
  for (const { children } of getSlotEntries(ancestor)) {
    for (const child of children) {
      if (child.props.id === descendantId)
        return true
      if (isAncestorOf(child, descendantId))
        return true
    }
  }
  return false
}
