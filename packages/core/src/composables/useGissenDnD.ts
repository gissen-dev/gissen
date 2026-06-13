import type { Ref } from 'vue'
import { useDraggable } from 'vue-draggable-plus'
import { findComponent, isAncestorOf } from '../utils/tree'
import { useEditorStore } from './useEditorStore'

const GROUP_NAME = 'gissen'

/**
 * Attaches a Sortable clone-source to the sidebar list.
 * Each direct child must have `data-gissen-type` set to the component type name.
 */
export function useSidebarDnD(el: Ref<HTMLElement | null>): void {
  useDraggable(el, {
    group: { name: GROUP_NAME, pull: 'clone', put: false },
    sort: false,
    animation: 0,
    ghostClass: 'gissen-drag-ghost',
    chosenClass: 'gissen-drag-chosen',
  })
}

/**
 * Attaches a Sortable drop zone to a canvas container element.
 * Handles inserts from the sidebar and moves from other zones via the editor store.
 *
 * @param el - the container element (canvas inner div or slot div)
 * @param getZone - getter returning current parentId/slotName (must be stable for cycle checks)
 */
export function useCanvasZoneDnD(
  el: Ref<HTMLElement | null>,
  getZone: () => { parentId: string | null, slotName: string | null },
): void {
  const store = useEditorStore()

  useDraggable(el, {
    group: {
      name: GROUP_NAME,
      pull: true,
      // Reject drops that would create ancestor cycles
      put(_to: unknown, _from: unknown, dragEl: unknown): boolean {
        const id = (dragEl as HTMLElement).dataset?.gissenId
        if (!id)
          return true // sidebar clone — always allowed
        const zone = getZone()
        if (zone.parentId === id)
          return false // dropping into own slot
        const result = findComponent(store.data, id)
        if (!result)
          return true
        // Reject if the target parent is a descendant of the dragged component
        return zone.parentId === null || !isAncestorOf(result.component, zone.parentId)
      },
    },
    filter: '.gissen-canvas__empty,.gissen-slot--empty',
    preventOnFilter: true,
    animation: 150,
    ghostClass: 'gissen-drag-ghost',
    chosenClass: 'gissen-drag-chosen',
    dragClass: 'gissen-drag-fallback',

    onAdd(evt) {
      const item = evt.item as HTMLElement
      const newIndex = evt.newIndex ?? 0
      const type = item.dataset.gissenType
      const id = item.dataset.gissenId
      const zone = getZone()

      // Remove the Sortable-inserted DOM node; Vue re-renders from store state
      item.parentNode?.removeChild(item)

      if (type) {
        store.insertComponent(type, zone.parentId, zone.slotName, newIndex)
      }
      else if (id) {
        // Cross-zone move: newIndex is already the correct slot index
        store.moveComponent(id, zone.parentId, zone.slotName, newIndex)
      }
    },

    onUpdate(evt) {
      const item = evt.item as HTMLElement
      const id = item.dataset.gissenId
      const oldIndex = evt.oldIndex ?? 0
      const newIndex = evt.newIndex ?? 0
      if (!id || oldIndex === newIndex)
        return

      // Revert Sortable's DOM move so Vue patches from the correct baseline state
      const parent = item.parentNode as HTMLElement | null
      if (parent) {
        parent.removeChild(item)
        const refNode = parent.children[oldIndex] ?? null
        parent.insertBefore(item, refNode)
      }

      // Sortable reports newIndex as the final 0-based position.
      // store.moveComponent expects a slot index (0…n), which is newIndex+1
      // when moving forward — accounting for the removal shifting everything left.
      const storeIndex = newIndex > oldIndex ? newIndex + 1 : newIndex

      const zone = getZone()
      store.moveComponent(id, zone.parentId, zone.slotName, storeIndex)
    },
  })
}
