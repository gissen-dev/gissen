import type { ZodIssue } from 'zod'
import type { GissenConfig, GissenData } from '../types'
import { ZodError } from 'zod'
import { gissenDataSchema } from './data-schemas'
import { GissenValidationError } from './errors'

type Path = (string | number)[]

interface RawComponent { type: string, props: Record<string, unknown> }

function validateComponent(component: RawComponent, config: GissenConfig, basePath: Path): ZodIssue[] {
  const issues: ZodIssue[] = []

  // The top-level data schema only enforces `id` on `content[]`; nested slot
  // children live under `.catchall(z.unknown())` and reach here unvalidated.
  // Every node must carry a non-empty string id or selection/move/render break.
  const id = component.props?.id
  if (typeof id !== 'string' || id.length === 0) {
    issues.push({
      code: 'custom',
      message: `Component "${component.type}" is missing a required "id" (must be a non-empty string)`,
      path: [...basePath, 'props', 'id'],
    })
  }

  const componentConfig = config.components[component.type]

  if (!componentConfig) {
    issues.push({
      code: 'custom',
      message: `Component type "${component.type}" is not registered in config`,
      path: [...basePath, 'type'],
    })
    return issues
  }

  const fieldKeys = new Set(Object.keys(componentConfig.fields))

  // Extra prop keys that are not in fields (id is always allowed)
  for (const key of Object.keys(component.props)) {
    if (key !== 'id' && !fieldKeys.has(key)) {
      issues.push({
        code: 'custom',
        message: `Prop "${key}" is not defined in fields for component "${component.type}"`,
        path: [...basePath, 'props', key],
      })
    }
  }

  for (const [fieldName, field] of Object.entries(componentConfig.fields)) {
    const value = component.props[fieldName]
    const valuePath: Path = [...basePath, 'props', fieldName]

    if (value === undefined) {
      issues.push({
        code: 'custom',
        message: `Required prop "${fieldName}" is missing for component "${component.type}"`,
        path: valuePath,
      })
      continue
    }

    switch (field.type) {
      case 'text':
      case 'textarea':
        if (typeof value !== 'string') {
          issues.push({
            code: 'custom',
            message: `Prop "${fieldName}" must be a string (got ${typeof value})`,
            path: valuePath,
          })
        }
        break

      case 'number':
        if (typeof value !== 'number') {
          issues.push({
            code: 'custom',
            message: `Prop "${fieldName}" must be a number (got ${typeof value})`,
            path: valuePath,
          })
        }
        break

      case 'boolean':
        if (typeof value !== 'boolean') {
          issues.push({
            code: 'custom',
            message: `Prop "${fieldName}" must be a boolean (got ${typeof value})`,
            path: valuePath,
          })
        }
        break

      case 'select': {
        const allowed = field.options.map((option: { value: string | number }) => option.value)
        if (!allowed.includes(value as string | number)) {
          issues.push({
            code: 'custom',
            message: `Prop "${fieldName}" value "${String(value)}" is not among select options: ${allowed.map(String).join(', ')}`,
            path: valuePath,
          })
        }
        break
      }

      case 'slot': {
        if (!Array.isArray(value)) {
          issues.push({
            code: 'custom',
            message: `Prop "${fieldName}" must be an array (slot field)`,
            path: valuePath,
          })
          break
        }

        for (let index = 0; index < value.length; index++) {
          const child = value[index] as RawComponent
          const childPath: Path = [...valuePath, index]

          if (field.allow && !field.allow.includes(child.type)) {
            issues.push({
              code: 'custom',
              message: `Component type "${child.type}" is not allowed in slot "${fieldName}" (allowed: ${field.allow.join(', ')})`,
              path: [...childPath, 'type'],
            })
          }

          issues.push(...validateComponent(child, config, childPath))
        }
        break
      }
    }
  }

  return issues
}

/**
 * Validates a `GissenData` page tree against a given `GissenConfig`.
 * Performs full recursive validation of slot children, including that every
 * node (at any depth) has a non-empty string `id` and only known, well-typed
 * props.
 * Throws `GissenValidationError` on failure; returns typed data on success.
 * Error issues include the path to the invalid node (e.g. `content[0].props.features[1].props.title`).
 */
export function validateData(data: unknown, config: GissenConfig): GissenData {
  const parsed = gissenDataSchema.safeParse(data)
  if (!parsed.success) {
    throw new GissenValidationError(parsed.error)
  }

  const issues: ZodIssue[] = []
  for (let index = 0; index < parsed.data.content.length; index++) {
    issues.push(...validateComponent(parsed.data.content[index], config, ['content', index]))
  }

  if (issues.length > 0) {
    throw new GissenValidationError(new ZodError(issues))
  }

  return parsed.data as GissenData
}
