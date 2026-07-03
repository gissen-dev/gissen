import type { ComponentData, GissenConfig, GissenData } from '../types'
import { generateId } from './id'

/** Current schema version stamped onto newly created `GissenData`. */
export const GISSEN_DATA_VERSION = 1

/** Returns the canonical empty page state: an empty root and no content. */
export function createEmptyData(): GissenData {
  return { version: GISSEN_DATA_VERSION, root: { props: {} }, content: [] }
}

/**
 * Assigns a fresh id to every child found in the component's slot fields,
 * recursively. Unlike `ensureId` (which preserves existing ids), this always
 * regenerates: a brand-new instance must not reuse ids hardcoded in
 * `defaultProps`, or two instances would collide and break find/move/remove.
 */
function regenerateChildIds(component: ComponentData): void {
  for (const value of Object.values(component.props)) {
    if (!Array.isArray(value))
      continue
    for (const child of value as ComponentData[]) {
      if (child === null || typeof child !== 'object')
        continue
      child.props = { ...child.props, id: generateId() }
      regenerateChildIds(child)
    }
  }
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

  const component: ComponentData = {
    type,
    props: {
      ...slotDefaults,
      // structuredClone ensures slot fields (arrays) are not shared with defaultProps.
      // defaultProps wins over slotDefaults so an explicit default array is kept.
      ...structuredClone(componentConfig.defaultProps ?? {}),
      id: generateId(),
    },
  }

  // Give every child declared in defaultProps slots a fresh id so repeated
  // instances never share ids (and id-less children get one).
  regenerateChildIds(component)
  return component
}
