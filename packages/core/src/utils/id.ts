import type { ComponentData } from '../types'
import { nanoid } from 'nanoid'

/** Generates a short random ID using nanoid (10 characters). */
export function generateId(): string {
  return nanoid(10)
}

/**
 * Returns the component unchanged if it already has a non-empty `props.id`.
 * Otherwise fills `props.id` with a freshly generated ID.
 */
export function ensureId<T extends ComponentData>(component: T): T {
  if (component.props.id)
    return component
  return { ...component, props: { ...component.props, id: generateId() } }
}
