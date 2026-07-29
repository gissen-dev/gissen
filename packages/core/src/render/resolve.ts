import type { ComponentConfig, ComponentData, GissenConfig } from '../types'

/**
 * The result of resolving one `ComponentData` node against a config: the
 * registered component config, the props destined for the user component, and
 * the slot children to descend into.
 */
export interface ResolvedNode {
  /**
   * The registered config for the node's type, or `undefined` when the type is
   * not in `config.components`. Callers own the unknown-type policy: the editor
   * canvas shows an inline error box, the production renderer skips the node.
   */
  config: ComponentConfig | undefined
  /**
   * Props to pass to the user component: every entry of the node's props
   * except slot fields (which become Vue slots, not props). Includes `id`.
   * Absent props stay absent — resolution never injects defaults.
   */
  props: Record<string, unknown>
  /**
   * Slot field name → child nodes, one entry per slot field declared in the
   * config (not per key present in the data): a slot whose prop is missing or
   * not an array resolves to `[]`, so callers can recurse without guards.
   * Empty when the type is unknown — without a config there are no declared
   * slot fields.
   */
  slots: Record<string, ComponentData[]>
}

/**
 * Resolves a node of the page tree against the config: type → component
 * lookup, splitting props from slot children by the config's field
 * declarations.
 *
 * This is the single resolution seam shared by the editor canvas
 * (`CanvasNode`) and the production renderer (`GissenRender`), so the two
 * paths cannot drift in how they interpret a document. Only the DOM differs
 * by design: the canvas wraps each node in editor chrome, production render
 * emits the user component alone.
 */
export function resolveNode(config: GissenConfig, component: ComponentData): ResolvedNode {
  const componentConfig = config.components[component.type]
  const slots: Record<string, ComponentData[]> = {}

  if (componentConfig === undefined)
    return { config: undefined, props: { ...component.props }, slots }

  const slotNames = new Set<string>()
  for (const [name, field] of Object.entries(componentConfig.fields)) {
    if (field.type === 'slot') {
      slotNames.add(name)
      const value = component.props[name]
      slots[name] = Array.isArray(value) ? (value as ComponentData[]) : []
    }
  }

  const props: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(component.props)) {
    if (!slotNames.has(key))
      props[key] = value
  }

  return { config: componentConfig, props, slots }
}
