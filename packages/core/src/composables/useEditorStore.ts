import type { MaybeRefOrGetter, Ref } from 'vue'
import type { ComponentData, GissenConfig, GissenData } from '../types'
import type { ViewportPreset } from '../utils/viewport'
import type { CoalesceKey } from './history'
import { inject, isRef, provide, reactive, ref, toRaw, toValue, watch } from 'vue'
import { createComponent, generateId } from '../utils'
import { isTypeAllowedInSlot, normalizeSlotProps } from '../utils/data'
import { findComponent, isAncestorOf } from '../utils/tree'
import { createHistory } from './history'

export type { ViewportPreset } from '../utils/viewport'

export interface EditorStore {
  readonly config: GissenConfig
  data: GissenData
  /**
   * Unique Sortable group name for this editor instance. Shared by the sidebar
   * and every canvas zone of one editor, but distinct across editors so two
   * editors on a page can't accept each other's drags. (M-1)
   */
  readonly dndGroup: string
  /** Read-only: mutate via selectComponent / removeComponent, never assign. */
  readonly selectedId: string | null
  /**
   * True when a document state older than the current one exists (reactive).
   * False on the baseline: the initially accepted document, or the document
   * accepted after an external replacement.
   */
  readonly canUndo: boolean
  /** True when an undone state can be re-applied (reactive). Any new edit clears it. */
  readonly canRedo: boolean
  /**
   * Current canvas preview viewport (reactive). Defaults to 'desktop'.
   * Preview-only and per-instance: never written into `GissenData`, and
   * orthogonal to history — undo/redo never change it.
   */
  readonly viewport: ViewportPreset
  /** Switches the canvas preview viewport. */
  setViewport: (preset: ViewportPreset) => void
  /**
   * True while a sidebar or canvas drag is in flight (reactive).
   * Editor-internal: the canvas resets its scale-to-fit while dragging,
   * because Sortable hit-tests in untransformed coordinates.
   */
  readonly dragging: boolean
  /** Editor-internal: flagged by the DnD composables on drag start/end. */
  setDragging: (active: boolean) => void
  insertComponent: (type: string, parentId: string | null, slotName: string | null, index: number) => void
  moveComponent: (id: string, newParentId: string | null, newSlotName: string | null, newIndex: number) => void
  removeComponent: (id: string) => void
  /**
   * Writes a single prop value on the component with the given id, then
   * commits. For history, consecutive edits to the same (id, key) pair
   * coalesce into one undo step — undoing after typing a word restores the
   * pre-typing value in one step. A run splits when the field or component
   * changes, a structural operation happens, history is navigated, or ~600ms
   * pass without an edit to the field.
   */
  updateProp: (id: string, key: string, value: unknown) => void
  selectComponent: (id: string | null) => void
  /**
   * Restores the previous document state, emitting `update:data` like any
   * edit. Clears the selection if the selected node no longer exists in the
   * restored tree. No-op when there is nothing to undo.
   */
  undo: () => void
  /** Re-applies the next undone document state. No-op when there is nothing to redo. */
  redo: () => void
}

export function createEditorStore(
  config: MaybeRefOrGetter<GissenConfig>,
  initialData: GissenData | Ref<GissenData>,
): EditorStore {
  // Single source of truth: when a Ref (the v-model) is passed, the store
  // mutates it directly so edits propagate to the parent with no extra sync.
  const data: Ref<GissenData> = isRef(initialData) ? initialData : (ref(initialData) as Ref<GissenData>)

  // Dev-only guard (M-2/M-3): the canvas relies on `data` being deeply reactive
  // so nested prop edits propagate. `toRaw(x) === x` means the bound value is a
  // plain (non-proxied) object — e.g. a `shallowRef` or `markRaw` slice — which
  // updates the panel but leaves the canvas rendering stale values. Warn
  // rather than mutate — silently re-wrapping the user's object would break
  // their own reference to it.
  if (__DEV__ && toRaw(data.value) === data.value) {
    console.warn(
      '[Gissen] The `data` bound to <GissenEditor> is not deeply reactive. '
      + 'Bind it with `ref()` (not `shallowRef`, `markRaw`, or a plain object) '
      + 'so canvas edits propagate correctly.',
    )
  }

  const state = reactive({
    selectedId: null as string | null,
    viewport: 'desktop' as ViewportPreset,
    dragging: false,
  })

  // Per-instance drag group so multiple editors on one page stay isolated.
  const dndGroup = `gissen-${generateId()}`

  // `config` may be a getter/ref so the store tracks a reactive `config` prop;
  // `toValue` resolves it on each access.
  const getConfig = (): GissenConfig => toValue(config)

  // Data-acceptance normalization: hand-authored documents may omit slot keys
  // (absent props are valid), but store operations assume a slot prop is
  // always an array. Initialize missing slots to [] here — the same guarantee
  // createComponent gives freshly inserted nodes — so accepted data is
  // immediately editable. Replaced documents get the same treatment in the
  // sync watch below.
  normalizeSlotProps(data.value, getConfig())

  // Discriminates the store's own ref writes (commit, undo/redo) from an
  // external replacement by the host inside the sync `watch` below — by
  // OBJECT IDENTITY, not by a flag around the assignment. When the ref is a
  // `defineModel` with a bound parent listener, a write does not land
  // synchronously: it only emits, and the value echoes back through the prop
  // one tick later — long after any flag would have been cleared. The echoed
  // object is identical to what we wrote, so identity survives the deferral.
  let lastWrittenDoc: GissenData | null = null

  const writeDocument = (doc: GissenData): void => {
    lastWrittenDoc = doc
    data.value = doc
  }

  // After an in-place mutation, reassign a fresh top-level object so the
  // v-model emits `update:data` — splicing nested arrays alone does not trigger
  // the emit. Nested arrays keep their identity (already mutated above), so this
  // is a cheap shallow clone, not a deep copy. Spread the RAW object, not the
  // proxy: property reads through the proxy return reactive-wrapped members,
  // which would poison the raw graph that snapshotDocument clones.
  const commit = (): void => {
    writeDocument({ ...toRaw(data.value) })
  }

  // structuredClone rejects proxies, so the snapshot clones the raw graph.
  // The graph stays proxy-free below the top level because commit() spreads
  // the raw object and Vue's set traps store assigned values raw.
  const snapshotDocument = (): GissenData => structuredClone(toRaw(data.value))

  const history = createHistory({
    takeSnapshot: snapshotDocument,
    applySnapshot: (snapshot) => {
      writeDocument(snapshot)
      // Selection reconciliation: keep the selected node if the restored tree
      // still contains it, clear the selection otherwise.
      if (state.selectedId !== null && !findComponent(snapshot, state.selectedId))
        state.selectedId = null
    },
  })

  // Runs a document mutation as an undoable step. The pre-mutation snapshot
  // is recorded only after `op` succeeds: a rejected operation (unknown id,
  // disallowed placement) leaves the tree untouched and must leave history
  // untouched too. With a `coalesce` key the step joins the open run for that
  // field instead of always pushing a discrete entry.
  const mutateDocument = (op: () => void, coalesce?: CoalesceKey): void => {
    const before = snapshotDocument()
    op()
    if (coalesce === undefined)
      history.record(before)
    else
      history.recordCoalesced(before, coalesce)
    commit()
  }

  // External replacement detection: the host reassigning its own v-model ref
  // bypasses the store entirely, so a shallow sync watch on the ref is the
  // acceptance chokepoint for replaced documents. The store's own writes (and
  // their deferred v-model echoes) are recognized by identity and skipped. A
  // replaced document gets the same acceptance-time slot normalization as the
  // initial one and becomes the new history baseline — you cannot undo across
  // an external document swap.
  watch(data, (doc) => {
    // A deep ref hands the watcher the reactive proxy of what was assigned;
    // unwrap before comparing against the raw object the store wrote.
    if (toRaw(doc) === lastWrittenDoc)
      return
    normalizeSlotProps(doc, getConfig())
    history.reset()
  }, { flush: 'sync' })

  return {
    get config() { return getConfig() },
    get data() { return data.value },
    set data(v: GissenData) {
      // Replacement through the store takes the same acceptance path as an
      // external swap: the sync watch normalizes it and resets history.
      data.value = v
    },
    dndGroup,
    get selectedId() { return state.selectedId },
    get canUndo() { return history.canUndo },
    get canRedo() { return history.canRedo },
    get viewport() { return state.viewport },
    get dragging() { return state.dragging },

    insertComponent(type, parentId, slotName, index) {
      mutateDocument(() => {
        const component = createComponent(type, getConfig())
        if (parentId === null) {
          data.value.content.splice(index, 0, component)
        }
        else {
          const parentResult = findComponent(data.value, parentId)
          if (!parentResult)
            throw new Error(`[Gissen] Parent component "${parentId}" not found`)
          if (!slotName)
            throw new Error('[Gissen] slotName is required when parentId is provided')
          const slot = parentResult.component.props[slotName]
          if (!Array.isArray(slot)) {
            throw new TypeError(`[Gissen] "${slotName}" is not a slot field on component "${parentId}"`)
          }
          if (!isTypeAllowedInSlot(getConfig(), parentResult.component.type, slotName, type)) {
            throw new Error(
              `[Gissen] Component type "${type}" is not allowed in slot "${slotName}" of "${parentResult.component.type}"`,
            )
          }
          ;(slot as ComponentData[]).splice(index, 0, component)
        }
      })
    },

    moveComponent(id, newParentId, newSlotName, newIndex) {
      mutateDocument(() => {
        const movingResult = findComponent(data.value, id)
        if (!movingResult)
          throw new Error(`[Gissen] Component "${id}" not found`)

        // Cycle guard: cannot move into self or own descendant
        if (newParentId !== null) {
          if (newParentId === id) {
            throw new Error('[Gissen] Cannot move a component into itself')
          }
          if (isAncestorOf(movingResult.component, newParentId)) {
            throw new Error('[Gissen] Cannot move a component into its own descendant')
          }
        }

        const component = movingResult.component

        // Resolve and vet the target slot BEFORE detaching the node, so a
        // rejected move leaves the tree untouched.
        let targetSlot: ComponentData[] | null = null
        if (newParentId !== null) {
          if (!newSlotName)
            throw new Error('[Gissen] slotName is required when parentId is provided')
          const parentResult = findComponent(data.value, newParentId)
          if (!parentResult)
            throw new Error(`[Gissen] Target parent "${newParentId}" not found`)
          const slot = parentResult.component.props[newSlotName]
          if (!Array.isArray(slot)) {
            throw new TypeError(`[Gissen] "${newSlotName}" is not a slot field on component "${newParentId}"`)
          }
          if (!isTypeAllowedInSlot(getConfig(), parentResult.component.type, newSlotName, component.type)) {
            throw new Error(
              `[Gissen] Component type "${component.type}" is not allowed in slot "${newSlotName}" of "${parentResult.component.type}"`,
            )
          }
          targetSlot = slot as ComponentData[]
        }

        // Remove from current location
        movingResult.siblings.splice(movingResult.index, 1)

        // Adjust index for same-array moves (after removal, positions shift)
        const isSameArray = movingResult.parentId === newParentId && movingResult.slotName === newSlotName
        const adjustedIndex = isSameArray && newIndex > movingResult.index ? newIndex - 1 : newIndex

        if (targetSlot === null) {
          data.value.content.splice(adjustedIndex, 0, component)
        }
        else {
          targetSlot.splice(adjustedIndex, 0, component)
        }
      })
    },

    removeComponent(id) {
      mutateDocument(() => {
        const result = findComponent(data.value, id)
        if (!result)
          throw new Error(`[Gissen] Component "${id}" not found`)
        result.siblings.splice(result.index, 1)
        if (state.selectedId === id) {
          state.selectedId = null
        }
      })
    },

    updateProp(id, key, value) {
      // `id` is the node identity used for find/move/remove/select — never a
      // user-editable prop. Refuse it defensively even though the config schema
      // rejects a field literally named `id`. (H-3)
      if (key === 'id') {
        throw new Error('[Gissen] "id" is a reserved prop and cannot be edited via updateProp')
      }
      mutateDocument(() => {
        // Resolve the target node by id (locked decision: bind by id, never to a
        // free-floating "current selection") and write the value onto that node.
        const result = findComponent(data.value, id)
        if (!result)
          throw new Error(`[Gissen] Component "${id}" not found`)
        // `props` carries the component id plus its field values; `key` is always a
        // real value field name (the panel never edits `id` or slot fields).
        result.component.props[key] = value
      }, { componentId: id, fieldKey: key })
    },

    selectComponent(id) {
      state.selectedId = id
    },

    setViewport(preset) {
      state.viewport = preset
    },

    setDragging(active) {
      state.dragging = active
    },

    undo() {
      history.undo()
    },

    redo() {
      history.redo()
    },
  }
}

const EDITOR_STORE_KEY = Symbol('gissen-editor-store')

export function provideEditorStore(store: EditorStore): void {
  provide(EDITOR_STORE_KEY, store)
}

export function useEditorStore(): EditorStore {
  const store = inject<EditorStore>(EDITOR_STORE_KEY)
  if (!store) {
    throw new Error(
      '[Gissen] useEditorStore() was called outside of a <GissenEditor> context. '
      + 'Make sure the component is rendered inside a GissenEditor.',
    )
  }
  return store
}
