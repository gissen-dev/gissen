import { onMounted, onUnmounted } from 'vue'
import { useEditorStore } from './useEditorStore'

/**
 * Returns true when the event originates from an editable element (input,
 * textarea, select, or contenteditable). Delete/Backspace must not hijack
 * typing in such fields — otherwise pressing Backspace while editing text
 * elsewhere on the page would silently delete the selected component.
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

/** Wires Escape (deselect) and Delete/Backspace (remove) keyboard shortcuts. */
export function useSelection(): void {
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
      store.removeComponent(store.selectedId)
    }
  }

  onMounted(() => document.addEventListener('keydown', handleKeydown))
  onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
}
