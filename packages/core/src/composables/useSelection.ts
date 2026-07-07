import type { Ref } from 'vue'
import { onMounted, onUnmounted } from 'vue'
import { isApplePlatform } from '../utils/platform'
import { findComponent } from '../utils/tree'
import { useEditorStore } from './useEditorStore'

/**
 * Returns true when the event originates from an editable element (input,
 * textarea, select, or contenteditable). Delete/Backspace must not hijack
 * typing in such fields — otherwise pressing Backspace while editing text
 * inside the editor would silently delete the selected component. The same
 * guard keeps mod+Z as the browser's native text-field undo.
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

/** Document-history actions reachable from the keyboard. */
export type HistoryShortcut = 'undo' | 'redo'

/**
 * Maps a keydown to a history action: mod+Z undoes, mod+Shift+Z and mod+Y
 * redo — mod being ⌘ on Apple platforms and Ctrl elsewhere. Strict about
 * modifiers: the wrong one for the platform, or Alt, matches nothing, so
 * e.g. Ctrl+Z on macOS stays whatever the browser makes of it.
 */
export function matchHistoryShortcut(e: KeyboardEvent, apple: boolean): HistoryShortcut | null {
  const mod = apple ? e.metaKey : e.ctrlKey
  const otherMod = apple ? e.ctrlKey : e.metaKey
  if (!mod || otherMod || e.altKey)
    return null
  const key = e.key.toLowerCase()
  if (key === 'z')
    return e.shiftKey ? 'redo' : 'undo'
  if (key === 'y' && !e.shiftKey)
    return 'redo'
  return null
}

/**
 * Wires the editor's keyboard shortcuts: Escape (deselect), Delete/Backspace
 * (remove the selected component), and mod+Z / mod+Shift+Z / mod+Y
 * (undo/redo).
 *
 * The listener is attached to `el` (the editor's focusable root) rather than
 * `document`, so the shortcuts only fire when focus is inside this editor
 * instance — they never affect typing or navigation elsewhere on the page,
 * and with two editors on one page each shortcut acts on exactly the editor
 * that contains the keyboard focus. Removed on unmount, so an unmounted
 * editor leaves nothing behind.
 */
export function useSelection(el: Ref<HTMLElement | null>): void {
  const store = useEditorStore()

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      store.selectComponent(null)
      return
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && store.selectedId) {
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
      return
    }

    const action = matchHistoryShortcut(e, isApplePlatform())
    if (action !== null) {
      // Same policy as the Delete guard: while focus is in a field, mod+Z must
      // stay the browser's native text undo — never document history.
      if (isEditableTarget(e.target))
        return
      e.preventDefault()
      if (action === 'undo')
        store.undo()
      else
        store.redo()
    }
  }

  onMounted(() => {
    const root = el.value
    if (!root)
      return
    root.addEventListener('keydown', handleKeydown)
    // Capture `root`: by the time onUnmounted runs, Vue has already reset the
    // template ref to null, so cleaning up through `el.value` would silently
    // leak the listener onto the detached element.
    onUnmounted(() => root.removeEventListener('keydown', handleKeydown))
  })
}
