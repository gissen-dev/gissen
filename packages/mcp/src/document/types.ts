import type { ComponentData, GissenConfig, GissenData } from 'gissen'
import type { Grammar } from '../grammar/types'

/**
 * Ambient context every operation needs — the loaded config (for
 * `createComponent`'s `defaultProps`) and its derived grammar (for the lists
 * instructive errors quote). Built once by the caller per tool call, not
 * itself part of a tool's JSON input.
 */
export interface DocumentContext {
  config: GissenConfig
  grammar: Grammar
}

/**
 * Where a node goes or lives: omitted/`null` `parentId` means the page's
 * top-level `data.content` array. `slot` is required whenever `parentId` is
 * given (rejected otherwise) and rejected at the top level (root has no slot
 * concept) — see `resolveInsertionTarget`. Omitting `index` means "append".
 */
export interface Placement {
  parentId?: string | null
  slot?: string | null
  index?: number
}

/** A `Placement` with every optional resolved, echoed back so a caller can report what actually happened. */
export interface ResolvedPlacement {
  parentId: string | null
  slot: string | null
  index: number
}

export interface ReadPageResult {
  page: GissenData
  grammar: Grammar
}

export interface AddComponentInput extends Placement {
  type: string
}

export interface AddComponentResult {
  data: GissenData
  id: string
  placement: ResolvedPlacement
}

export interface UpdateComponentInput {
  id: string
  /** Field values to merge. A value of `null` clears that field (see `resolveFieldValue`). */
  props: Record<string, unknown>
}

export interface UpdateComponentResult {
  data: GissenData
  /** The values actually written, keyed as given — lets a caller report a coerced value (e.g. `"3"` → `3`). */
  applied: Record<string, unknown>
}

export interface DeleteComponentInput {
  id: string
}

export interface DeleteComponentResult {
  data: GissenData
  removedId: string
  removedType: string
  /** Every id that existed under the removed node — so a caller can tell an agent which ids just stopped existing. */
  removedDescendantIds: string[]
}

export interface MoveComponentInput extends Placement {
  id: string
}

export interface MoveComponentResult {
  data: GissenData
  from: ResolvedPlacement
  to: ResolvedPlacement
}

/** One step from a tree root toward a node: which array it's in, and at what index. */
export interface NodeStep {
  /** `null` when the step is into the top-level `data.content` array. */
  parentId: string | null
  /** `null` when the step is into the top-level `data.content` array. */
  slot: string | null
  index: number
}

/**
 * Where a found node lives, immutable-tree style. `path` is the addressable
 * root-to-node route (used to build error payloads and `formatNodePath`);
 * `siblings` is the live array the node sits in, safe to splice because every
 * operation calls `findNode` against the clone it is about to return — the
 * reference can never escape into caller-visible state.
 */
export interface NodeLocation {
  node: ComponentData
  path: readonly NodeStep[]
  siblings: ComponentData[]
  /** `node`'s position in `siblings` — same as the last step of `path`, kept as its own field since every splicing caller needs it directly. */
  index: number
}
