import type { ZodIssue } from 'zod'
import type { FieldConfig, GissenConfig, GissenData } from '../types'
import { ZodError } from 'zod'
import { gissenDataSchema } from './data-schemas'
import { GissenValidationError } from './errors'

type Path = (string | number)[]

interface RawComponent { type: string, props: Record<string, unknown> }

/**
 * Validates a single field value against its field config, appending any issues.
 * Shared by component props and root props. `min`/`max` on number fields are
 * enforced here so imported data honors the same constraints the panel does.
 * (`step` is a UI-only affordance and is not range-checked.)
 */
function validateFieldValue(
  field: FieldConfig,
  value: unknown,
  fieldName: string,
  valuePath: Path,
  config: GissenConfig,
  issues: ZodIssue[],
): void {
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
        break
      }
      if (field.min !== undefined && value < field.min) {
        issues.push({
          code: 'custom',
          message: `Prop "${fieldName}" must be >= ${field.min} (got ${value})`,
          path: valuePath,
        })
      }
      if (field.max !== undefined && value > field.max) {
        issues.push({
          code: 'custom',
          message: `Prop "${fieldName}" must be <= ${field.max} (got ${value})`,
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

        // The allow-list check only applies to well-formed children; a
        // malformed child (null/primitive) is reported by the recursive call,
        // which guards its shape — guard here too so `child.type` never throws.
        const isObject = child !== null && typeof child === 'object'
        if (field.allow && isObject && !field.allow.includes(child.type)) {
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

function validateComponent(component: RawComponent, config: GissenConfig, basePath: Path): ZodIssue[] {
  const issues: ZodIssue[] = []

  // Nested slot children arrive unvalidated (they live under
  // `.catchall(z.unknown())`), so the node may not even be a well-formed object.
  // Reject non-objects / missing props here, before touching `.type` / `.props`,
  // so a null or primitive child yields a GissenValidationError instead of a
  // native TypeError.
  if (component === null || typeof component !== 'object') {
    issues.push({
      code: 'custom',
      message: 'Component must be an object with type and props',
      path: [...basePath],
    })
    return issues
  }
  if (component.props === null || typeof component.props !== 'object') {
    issues.push({
      code: 'custom',
      message: 'Component is missing a "props" object',
      path: [...basePath, 'props'],
    })
    return issues
  }

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

    // Value-level tolerance: absent/undefined props are valid. JSON.stringify
    // drops undefined values, so a round-tripped document lacks cleared keys —
    // required-prop semantics would reject the editor's own output (e.g. a
    // cleared number field). Type/range checks apply only to present values.
    if (value === undefined)
      continue

    validateFieldValue(field, value, fieldName, valuePath, config, issues)
  }

  return issues
}

/**
 * Validates `data.root.props` against `config.root.fields` (M-4). Only runs when
 * the config declares root fields; a root with no configured fields is accepted
 * as-is. Absent props are valid (same tolerance as component props). Root has
 * no `id`, so unlike components no key is exempt from the unknown-key check.
 */
function validateRootProps(
  rootProps: Record<string, unknown>,
  rootFields: Record<string, FieldConfig>,
  config: GissenConfig,
): ZodIssue[] {
  const issues: ZodIssue[] = []
  const propsPath: Path = ['root', 'props']
  const fieldKeys = new Set(Object.keys(rootFields))

  for (const key of Object.keys(rootProps)) {
    if (!fieldKeys.has(key)) {
      issues.push({
        code: 'custom',
        message: `Prop "${key}" is not defined in root fields`,
        path: [...propsPath, key],
      })
    }
  }

  for (const [fieldName, field] of Object.entries(rootFields)) {
    const value = rootProps[fieldName]
    const valuePath: Path = [...propsPath, fieldName]

    // Absent/undefined root props are valid — the same value-level tolerance
    // as component props.
    if (value === undefined)
      continue

    validateFieldValue(field, value, fieldName, valuePath, config, issues)
  }

  return issues
}

/**
 * Validates a `GissenData` page tree against a given `GissenConfig`.
 * Performs full recursive validation of slot children, including that every
 * node (at any depth) has a non-empty string `id` and only known, well-typed
 * props.
 * When the config declares `root.fields`, `data.root.props` is validated against
 * them too.
 *
 * Policy: structurally strict, value-tolerant. Unknown component types,
 * unknown prop keys, wrong value types, out-of-range numbers, and slot `allow`
 * violations are rejected; absent or `undefined` props are accepted — a
 * cleared field round-trips through JSON as a missing key, and every state
 * reachable through editor operations must validate.
 *
 * Throws `GissenValidationError` on failure; returns typed data on success.
 * Error issues include the path to the invalid node (e.g.
 * `content[0].props.features[1].props.title`).
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

  // Validate root props against the configured root fields, when present.
  const rootFields = config.root?.fields
  if (rootFields) {
    issues.push(...validateRootProps(parsed.data.root.props, rootFields, config))
  }

  if (issues.length > 0) {
    throw new GissenValidationError(new ZodError(issues))
  }

  return parsed.data
}
