import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { findComponent } from '../utils/tree'
import { useEditorStore } from './useEditorStore'

export interface FieldBinding {
  /** The current value of the field on the resolved node, or `undefined`. */
  readonly value: ComputedRef<unknown>
  /** Writes a new value back to the resolved node by id (live, on every change). */
  setValue: (value: unknown) => void
}

/**
 * Binds a single field editor to `component.props[fieldName]` for the component
 * with `componentId`, resolving the node by id on every read and write.
 *
 * Resolving by id (rather than holding a node reference) is deliberate: it keeps
 * the binding correct across commits — which reassign the top-level data object —
 * and guarantees switching selection can never leak one component's value into
 * another. `componentId`/`fieldName` are passed as getters so the binding tracks
 * a changing selection reactively.
 */
export function useFieldBinding(
  componentId: () => string,
  fieldName: () => string,
): FieldBinding {
  const store = useEditorStore()

  const value = computed(
    () => findComponent(store.data, componentId())?.component.props[fieldName()],
  )

  function setValue(next: unknown): void {
    store.updateProp(componentId(), fieldName(), next)
  }

  return { value, setValue }
}
