import { onMounted, onUnmounted } from 'vue'
import { useEditorStore } from './useEditorStore'

/** Wires Escape (deselect) and Delete/Backspace (remove) keyboard shortcuts. */
export function useSelection(): void {
  const store = useEditorStore()

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      store.selectComponent(null)
    }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && store.selectedId) {
      e.preventDefault()
      store.removeComponent(store.selectedId)
    }
  }

  onMounted(() => document.addEventListener('keydown', handleKeydown))
  onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
}
