import type { ZodIssue } from 'zod'
import type { BooleanField, NumberField, SelectField, TextareaField, TextField } from '../types'

type Path = (string | number)[]

/** The field kinds this function handles — every `FieldConfig` variant except `slot`. */
type ScalarField = TextField | TextareaField | NumberField | SelectField | BooleanField

/**
 * Validates a single value against a scalar (non-slot) field's type, range
 * and option rules. This is the one place those rules are written: both
 * `validateData` (checking live prop values) and `validateConfig` (checking
 * `defaultProps`) call it, so a field's constraints can't drift apart between
 * the two checks. Does not special-case `null` — callers that need to treat a
 * literal `null` differently from other invalid values do that themselves.
 */
export function validateScalarFieldValue(
  field: ScalarField,
  value: unknown,
  fieldName: string,
  valuePath: Path,
): ZodIssue[] {
  const issues: ZodIssue[] = []

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
  }

  return issues
}
