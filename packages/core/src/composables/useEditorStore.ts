import type { ComponentData, GissenConfig, GissenData } from '../types'
import { inject, provide, reactive } from 'vue'
import { createComponent } from '../utils'
import { findComponent, isAncestorOf } from '../utils/tree'

export interface EditorStore {
  readonly config: GissenConfig
  data: GissenData
  selectedId: string | null
  insertComponent: (type: string, parentId: string | null, slotName: string | null, index: number) => void
  moveComponent: (id: string, newParentId: string | null, newSlotName: string | null, newIndex: number) => void
  removeComponent: (id: string) => void
  selectComponent: (id: string | null) => void
}

export function createEditorStore(config: GissenConfig, initialData: GissenData): EditorStore {
  const state = reactive({
    data: initialData as GissenData,
    selectedId: null as string | null,
  })

  return {
    get config() { return config },
    get data() { return state.data },
    set data(v: GissenData) { state.data = v },
    get selectedId() { return state.selectedId },

    insertComponent(type, parentId, slotName, index) {
      const component = createComponent(type, config)
      if (parentId === null) {
        state.data.content.splice(index, 0, component)
      }
      else {
        const parentResult = findComponent(state.data, parentId)
        if (!parentResult)
          throw new Error(`[Gissen] Parent component "${parentId}" not found`)
        if (!slotName)
          throw new Error('[Gissen] slotName is required when parentId is provided')
        const slot = parentResult.component.props[slotName]
        if (!Array.isArray(slot)) {
          throw new TypeError(`[Gissen] "${slotName}" is not a slot field on component "${parentId}"`)
        }
        ;(slot as ComponentData[]).splice(index, 0, component)
      }
    },

    moveComponent(id, newParentId, newSlotName, newIndex) {
      const movingResult = findComponent(state.data, id)
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

      // Remove from current location
      movingResult.siblings.splice(movingResult.index, 1)

      // Adjust index for same-array moves (after removal, positions shift)
      const isSameArray = movingResult.parentId === newParentId && movingResult.slotName === newSlotName
      const adjustedIndex = isSameArray && newIndex > movingResult.index ? newIndex - 1 : newIndex

      if (newParentId === null) {
        state.data.content.splice(adjustedIndex, 0, component)
      }
      else {
        if (!newSlotName)
          throw new Error('[Gissen] slotName is required when parentId is provided')
        const parentResult = findComponent(state.data, newParentId)
        if (!parentResult)
          throw new Error(`[Gissen] Target parent "${newParentId}" not found`)
        const slot = parentResult.component.props[newSlotName]
        if (!Array.isArray(slot)) {
          throw new TypeError(`[Gissen] "${newSlotName}" is not a slot field on component "${newParentId}"`)
        }
        ;(slot as ComponentData[]).splice(adjustedIndex, 0, component)
      }
    },

    removeComponent(id) {
      const result = findComponent(state.data, id)
      if (!result)
        throw new Error(`[Gissen] Component "${id}" not found`)
      result.siblings.splice(result.index, 1)
      if (state.selectedId === id) {
        state.selectedId = null
      }
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
