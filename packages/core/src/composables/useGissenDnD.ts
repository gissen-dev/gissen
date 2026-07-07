import type { Ref } from 'vue'
import type { EditorStore } from './useEditorStore'
import { useDraggable } from 'vue-draggable-plus'
import { isTypeAllowedInSlot } from '../utils/data'
import { findComponent, isAncestorOf } from '../utils/tree'
import { useEditorStore } from './useEditorStore'

/**
 * True when a component of `type` may be dropped into the given zone.
 * Top-level content has no allow list; an unresolvable parent is permissive
 * here — the store is the authoritative layer and throws on a bad placement.
 */
function isAllowedInZone(
  store: EditorStore,
  zone: { parentId: string | null, slotName: string | null },
  type: string,
): boolean {
  if (zone.parentId === null || zone.slotName === null)
    return true
  const parentResult = findComponent(store.data, zone.parentId)
  if (!parentResult)
    return true
  return isTypeAllowedInSlot(store.config, parentResult.component.type, zone.slotName, type)
}

/**
 * Attaches a Sortable clone-source to the sidebar list.
 * Each direct child must have `data-gissen-type` set to the component type name.
 */
export function useSidebarDnD(el: Ref<HTMLElement | null>): void {
  const store = useEditorStore()
  useDraggable(el, {
    group: { name: store.dndGroup, pull: 'clone', put: false },
    sort: false,
    animation: 0,
    ghostClass: 'gissen-drag-ghost',
    chosenClass: 'gissen-drag-chosen',
    // Sortable fires onStart/onEnd on the source list only, so each drag
    // toggles the flag exactly once. The canvas resets its viewport
    // scale-to-fit while the flag is up (Sortable hit-tests unscaled).
    onStart() {
      store.setDragging(true)
    },
    onEnd() {
      store.setDragging(false)
    },
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
      name: store.dndGroup,
      pull: true,
      // Reject drops the store would refuse: slot allow-list violations and
      // ancestor cycles. This is the visual layer; insertComponent /
      // moveComponent re-check authoritatively.
      put(_to: unknown, _from: unknown, dragEl: unknown): boolean {
        const el = dragEl as HTMLElement
        const zone = getZone()
        const id = el.dataset?.gissenId
        if (!id) {
          // Sidebar clone — no cycle risk; only the allow-list applies.
          const type = el.dataset?.gissenType
          return type === undefined || isAllowedInZone(store, zone, type)
        }
        if (zone.parentId === id)
          return false // dropping into own slot
        const result = findComponent(store.data, id)
        if (!result)
          return true
        if (!isAllowedInZone(store, zone, result.component.type))
          return false
        // Reject if the target parent is a descendant of the dragged component
        return zone.parentId === null || !isAncestorOf(result.component, zone.parentId)
      },
    },
    draggable: '.gissen-node',
    emptyInsertThreshold: 60,
    // Node-action buttons are chrome INSIDE the draggable node: without the
    // filter, pressing one and twitching the pointer would start a node drag.
    filter: '.gissen-canvas__empty,.gissen-slot--empty,.gissen-node-actions',
    preventOnFilter: true,
    animation: 150,
    ghostClass: 'gissen-drag-ghost',
    chosenClass: 'gissen-drag-chosen',
    dragClass: 'gissen-drag-fallback',

    // See useSidebarDnD: drags reset the canvas viewport scale while in flight.
    onStart() {
      store.setDragging(true)
    },
    onEnd() {
      store.setDragging(false)
    },

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
