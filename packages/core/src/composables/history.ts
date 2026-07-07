import type { GissenData } from '../types'
import { shallowReactive } from 'vue'

/** Maximum past snapshots retained; beyond it the oldest entry is dropped. */
export const HISTORY_CAPACITY = 100

/** Idle gap (ms) without an edit to a field after which its coalescing run splits. */
export const COALESCE_IDLE_MS = 600

/** Identifies the field a property edit targets, for coalescing runs. */
export interface CoalesceKey {
  componentId: string
  fieldKey: string
}

export interface HistoryOptions {
  /** Returns a deep, detached clone of the current live document. */
  takeSnapshot: () => GissenData
  /** Writes a snapshot back as the live document (including `update:data` emission). */
  applySnapshot: (snapshot: GissenData) => void
  /** Past entries retained before the oldest is dropped. Defaults to {@link HISTORY_CAPACITY}. */
  capacity?: number
  /** Idle gap (ms) that splits a coalescing run. Defaults to {@link COALESCE_IDLE_MS}. */
  idleMs?: number
}

export interface EditorHistory {
  /** True when a past snapshot exists. False on the baseline document. */
  readonly canUndo: boolean
  /** True when an undone snapshot can be re-applied. Cleared by any new edit. */
  readonly canRedo: boolean
  /**
   * Records the pre-mutation document as one discrete undo step, closing any
   * open coalescing run. Call with a snapshot taken BEFORE a mutation, only
   * after the mutation succeeded — a rejected operation must leave history,
   * like the tree, untouched.
   */
  record: (before: GissenData) => void
  /**
   * Records a property edit, collapsing consecutive edits to the same
   * (componentId, fieldKey) pair into ONE undo step: the first edit of a run
   * pushes its before-snapshot, edits continuing the run push nothing. A run
   * closes when the key changes, a structural op records, undo/redo/reset
   * move history, or `idleMs` passes without an edit to the field.
   */
  recordCoalesced: (before: GissenData, key: CoalesceKey) => void
  /** Restores the previous snapshot. No-op when there is nothing to undo. */
  undo: () => void
  /** Re-applies the next undone snapshot. No-op when there is nothing to redo. */
  redo: () => void
  /** Drops all entries; the current live document becomes the new baseline. */
  reset: () => void
}

/**
 * Snapshot-based undo/redo over a `GissenData` document.
 *
 * Each entry is a deep clone of the full document (locked decision: snapshots,
 * not command/inverse operations). The live document is the "present"; `past`
 * holds the states before each recorded mutation and `future` holds states
 * walked back over by undo. Undo/redo move one entry between the stacks and
 * make it live via `applySnapshot`; a popped entry is applied directly without
 * re-cloning because it leaves the stacks — nothing else aliases it.
 *
 * The stacks are `shallowReactive` so `canUndo`/`canRedo` are live for UI
 * bindings while the snapshots themselves stay plain, non-proxied data.
 */
export function createHistory(options: HistoryOptions): EditorHistory {
  const { takeSnapshot, applySnapshot, capacity = HISTORY_CAPACITY, idleMs = COALESCE_IDLE_MS } = options

  const past = shallowReactive<GissenData[]>([])
  const future = shallowReactive<GissenData[]>([])

  // The open property-edit run, if any. While a run is open, further edits to
  // its field collapse into the entry pushed by the run's first edit.
  let run: { key: CoalesceKey, lastEditAt: number } | null = null

  const push = (before: GissenData): void => {
    past.push(before)
    if (past.length > capacity)
      past.shift()
    // Any new edit invalidates the redo branch (linear history, no branching).
    future.length = 0
  }

  return {
    get canUndo() { return past.length > 0 },
    get canRedo() { return future.length > 0 },

    record(before) {
      run = null
      push(before)
    },

    recordCoalesced(before, key) {
      const now = Date.now()
      const continuesRun = run !== null
        && run.key.componentId === key.componentId
        && run.key.fieldKey === key.fieldKey
        && now - run.lastEditAt <= idleMs
      // An edit continuing the run pushes nothing: the run's first edit
      // already recorded the pre-run state. `future` needs no clearing either —
      // an undo would have closed the run, so it is already empty here.
      if (!continuesRun)
        push(before)
      run = { key, lastEditAt: now }
    },

    undo() {
      const snapshot = past.pop()
      if (!snapshot)
        return
      // History navigation is a run boundary: the next edit to the same field
      // must record again, or its entry would sit on the wrong side of the undo.
      run = null
      future.push(takeSnapshot())
      applySnapshot(snapshot)
    },

    redo() {
      const snapshot = future.pop()
      if (!snapshot)
        return
      run = null
      // No capacity check: undo/redo only move existing entries between the
      // stacks, so `past` cannot outgrow what `record` already admitted.
      past.push(takeSnapshot())
      applySnapshot(snapshot)
    },

    reset() {
      run = null
      past.length = 0
      future.length = 0
    },
  }
}
