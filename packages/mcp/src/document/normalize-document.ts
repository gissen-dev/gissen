import type { ComponentData, GissenData } from 'gissen'
import type { GrammarIndex } from './grammar-index'

/**
 * Initializes every declared-but-absent slot prop to `[]`, in place,
 * recursively — mirroring core's `normalizeSlotProps`, grammar-driven the
 * same way `slotChildren` is.
 *
 * Core normalizes once, at data-acceptance time, so its store operations can
 * assume a slot prop is always an array. Phase B has no acceptance point —
 * every call re-reads the file fresh — so each operation normalizes its own
 * clone as its first step instead, and the result stays materialized in what
 * gets returned (and, once Phase C writes it back, in the file): idempotent,
 * accepted by `validateData`, and self-documenting to an agent reading the
 * file — an empty `"children": []` shows the container exists.
 */
export function normalizeDocumentSlots(data: GissenData, index: GrammarIndex): void {
  const visit = (node: ComponentData): void => {
    for (const name of index.slotFieldNames(node.type)) {
      if (node.props[name] === undefined)
        node.props[name] = []
      const children = node.props[name]
      if (!Array.isArray(children))
        continue
      for (const child of children)
        visit(child)
    }
  }
  for (const node of data.content)
    visit(node)
}
