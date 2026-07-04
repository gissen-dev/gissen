import type { ComponentData, GissenConfig, GissenData } from '../types'
import { generateId } from './id'

/** Current schema version stamped onto newly created `GissenData`. */
export const GISSEN_DATA_VERSION = 1

/**
 * Returns the canonical empty page state: an empty root and no content.
 * When a config is given, `config.root.defaultProps` is applied to
 * `root.props` — cloned, mirroring how `createComponent` applies component
 * `defaultProps`, so documents never share prop objects with the config.
 */
export function createEmptyData(config?: GissenConfig): GissenData {
  return {
    version: GISSEN_DATA_VERSION,
    root: { props: structuredClone(config?.root?.defaultProps ?? {}) },
    content: [],
  }
}

/**
 * Returns true when a `childType` component may be placed in the `slotName`
 * slot of a `parentType` component. Slots without an `allow` list accept every
 * type. Unknown parent types and non-slot fields are permissive here — those
 * shapes are reported by validation, not by placement checks.
 */
export function isTypeAllowedInSlot(
  config: GissenConfig,
  parentType: string,
  slotName: string,
  childType: string,
): boolean {
  const field = config.components[parentType]?.fields[slotName]
  if (field === undefined || field.type !== 'slot' || field.allow === undefined)
    return true
  return field.allow.includes(childType)
}

/**
 * Initializes missing slot props of every declared component to `[]`, in place,
 * recursively — mirroring `createComponent`'s slot auto-init at insert time.
 * Runs when data enters the editor (store creation, replacement through the
 * store), so a hand-authored document that omits slot keys (valid: absent
 * props are tolerated by `validateData`) is immediately editable — store
 * operations assume a slot prop is always an array and add no existence
 * guards. Unknown component types and non-array slot values are left
 * untouched; validation reports those.
 */
export function normalizeSlotProps(data: GissenData, config: GissenConfig): void {
  const visit = (component: ComponentData): void => {
    const fields = config.components[component.type]?.fields
    if (!fields)
      return
    for (const [name, field] of Object.entries(fields)) {
      if (field.type !== 'slot')
        continue
      if (component.props[name] === undefined)
        component.props[name] = []
      const children = component.props[name]
      if (!Array.isArray(children))
        continue
      for (const child of children as ComponentData[]) {
        if (child !== null && typeof child === 'object')
          visit(child)
      }
    }
  }
  for (const component of data.content) {
    visit(component)
  }
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
