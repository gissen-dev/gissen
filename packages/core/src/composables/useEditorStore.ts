import type { MaybeRefOrGetter, Ref } from 'vue'
import type { ComponentData, GissenConfig, GissenData } from '../types'
import { inject, isRef, provide, reactive, ref, toRaw, toValue } from 'vue'
import { createComponent, generateId } from '../utils'
import { isTypeAllowedInSlot } from '../utils/data'
import { findComponent, isAncestorOf } from '../utils/tree'

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
  insertComponent: (type: string, parentId: string | null, slotName: string | null, index: number) => void
  moveComponent: (id: string, newParentId: string | null, newSlotName: string | null, newIndex: number) => void
  removeComponent: (id: string) => void
  /** Writes a single prop value on the component with the given id, then commits. */
  updateProp: (id: string, key: string, value: unknown) => void
  selectComponent: (id: string | null) => void
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
  // updates the panel but leaves the canvas rendering stale values. Warn rather
  // than mutate; the full normalization is deferred to the undo/redo work.
  if (__DEV__ && toRaw(data.value) === data.value) {
    console.warn(
      '[Gissen] The `data` bound to <GissenEditor> is not deeply reactive. '
      + 'Bind it with `ref()` (not `shallowRef`, `markRaw`, or a plain object) '
      + 'so canvas edits propagate correctly.',
    )
  }

  const state = reactive({
    selectedId: null as string | null,
  })

  // Per-instance drag group so multiple editors on one page stay isolated.
  const dndGroup = `gissen-${generateId()}`

  // `config` may be a getter/ref so the store tracks a reactive `config` prop;
  // `toValue` resolves it on each access.
  const getConfig = (): GissenConfig => toValue(config)

  // After an in-place mutation, reassign a fresh top-level object so the
  // v-model emits `update:data` — splicing nested arrays alone does not trigger
  // the emit. Nested arrays keep their identity (already mutated above), so this
  // is a cheap shallow clone, not a deep copy.
  const commit = (): void => {
    data.value = { ...data.value }
  }

  return {
    get config() { return getConfig() },
    get data() { return data.value },
    set data(v: GissenData) { data.value = v },
    dndGroup,
    get selectedId() { return state.selectedId },

    insertComponent(type, parentId, slotName, index) {
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
      commit()
    },

    moveComponent(id, newParentId, newSlotName, newIndex) {
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
      commit()
    },

    removeComponent(id) {
      const result = findComponent(data.value, id)
      if (!result)
        throw new Error(`[Gissen] Component "${id}" not found`)
      result.siblings.splice(result.index, 1)
      if (state.selectedId === id) {
        state.selectedId = null
      }
      commit()
    },

    updateProp(id, key, value) {
      // `id` is the node identity used for find/move/remove/select — never a
      // user-editable prop. Refuse it defensively even though the config schema
      // rejects a field literally named `id`. (H-3)
      if (key === 'id') {
        throw new Error('[Gissen] "id" is a reserved prop and cannot be edited via updateProp')
      }
      // Resolve the target node by id (locked decision: bind by id, never to a
      // free-floating "current selection") and write the value onto that node.
      const result = findComponent(data.value, id)
      if (!result)
        throw new Error(`[Gissen] Component "${id}" not found`)
      // `props` carries the component id plus its field values; `key` is always a
      // real value field name (the panel never edits `id` or slot fields).
      result.component.props[key] = value
      // Reassign the top-level object so the v-model emits `update:data`; the
      // canvas already reacts to the in-place mutation on the reactive tree.
      commit()
    },

    selectComponent(id) {
      state.selectedId = id
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
