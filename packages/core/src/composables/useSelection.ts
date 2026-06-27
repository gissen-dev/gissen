import type { Ref } from 'vue'
import { onMounted, onUnmounted } from 'vue'
import { findComponent } from '../utils/tree'
import { useEditorStore } from './useEditorStore'

/**
 * Returns true when the event originates from an editable element (input,
 * textarea, select, or contenteditable). Delete/Backspace must not hijack
 * typing in such fields — otherwise pressing Backspace while editing text
 * inside the editor would silently delete the selected component.
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement))
    return false
  if (target.isContentEditable)
    return true
  return target.tagName === 'INPUT'
    || target.tagName === 'TEXTAREA'
    || target.tagName === 'SELECT'
}

/**
 * Wires Escape (deselect) and Delete/Backspace (remove) keyboard shortcuts.
 *
 * The listener is attached to `el` (the editor's focusable root) rather than
 * `document`, so the shortcuts only fire when focus is inside this editor
 * instance — they never affect typing or navigation elsewhere on the page, and
 * two editors on one page don't interfere with each other.
 */
export function useSelection(el: Ref<HTMLElement | null>): void {
  const store = useEditorStore()

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      store.selectComponent(null)
    }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && store.selectedId) {
      // Don't delete the selected component while the user is typing in a field.
      if (isEditableTarget(e.target))
        return
      e.preventDefault()
      // selectedId can be stale (e.g. `data` was replaced externally while a
      // node was selected). Guard so the handler never throws from
      // removeComponent — clear the dangling selection instead.
      if (findComponent(store.data, store.selectedId))
        store.removeComponent(store.selectedId)
      else
        store.selectComponent(null)
    }
  }

  onMounted(() => el.value?.addEventListener('keydown', handleKeydown))
  onUnmounted(() => el.value?.removeEventListener('keydown', handleKeydown))
}
