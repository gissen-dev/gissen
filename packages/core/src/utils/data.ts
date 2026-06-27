import type { ComponentData, GissenConfig, GissenData } from '../types'
import { ensureId, generateId } from './id'

/** Returns the canonical empty page state: an empty root and no content. */
export function createEmptyData(): GissenData {
  return { root: { props: {} }, content: [] }
}

/**
 * Creates a new component instance for the given registered type.
 * `props` are populated from `defaultProps` in config, and a fresh `id` is generated.
 * Every slot field is initialized to an empty array so the instance is a valid
 * drop target immediately — without this, dropping into a freshly created
 * container would throw because the slot prop would be `undefined`.
 * Throws if `type` is not registered in `config`.
 */
export function createComponent(type: string, config: GissenConfig): ComponentData {
  const componentConfig = config.components[type]
  if (!componentConfig) {
    throw new Error(`Component type "${type}" is not registered in config`)
  }

  // Initialize every slot field to [] so the component is a valid drop target
  // even when the user did not declare a default for it.
  const slotDefaults: Record<string, ComponentData[]> = {}
  for (const [name, field] of Object.entries(componentConfig.fields)) {
    if (field.type === 'slot')
      slotDefaults[name] = []
  }

  // ensureId fills ids on any children declared inside defaultProps slots, so a
  // new instance never enters the tree with id-less descendants.
  return ensureId({
    type,
    props: {
      ...slotDefaults,
      // structuredClone ensures slot fields (arrays) are not shared with defaultProps.
      // defaultProps wins over slotDefaults so an explicit default array is kept.
      ...structuredClone(componentConfig.defaultProps ?? {}),
      id: generateId(),
    },
  })
}
