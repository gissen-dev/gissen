import type { ComponentData, GissenConfig, GissenData } from '../types'
import { generateId } from './id'

/** Returns the canonical empty page state: an empty root and no content. */
export function createEmptyData(): GissenData {
  return { root: { props: {} }, content: [] }
}

/**
 * Creates a new component instance for the given registered type.
 * `props` are populated from `defaultProps` in config, and a fresh `id` is generated.
 * Throws if `type` is not registered in `config`.
 */
export function createComponent(type: string, config: GissenConfig): ComponentData {
  const componentConfig = config.components[type]
  if (!componentConfig) {
    throw new Error(`Component type "${type}" is not registered in config`)
  }
  return {
    type,
    props: {
      ...(componentConfig.defaultProps ?? {}),
      id: generateId(),
    },
  }
}
