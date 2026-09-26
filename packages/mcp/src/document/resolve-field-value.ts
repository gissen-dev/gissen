import type {
  BooleanFieldGrammar,
  FieldGrammar,
  NumberFieldGrammar,
  SelectFieldGrammar,
  SlotFieldGrammar,
  TextareaFieldGrammar,
  TextFieldGrammar,
} from '../grammar/types'
import {
  describeValue,
  FieldTypeMismatchError,
  InvalidSelectValueError,
  NonFiniteNumberError,
  NumberOutOfRangeError,
} from './errors'

/** Every field grammar except `slot` — whether a field is even editable (vs. structural) is the caller's job, not this module's. */
export type NonSlotFieldGrammar = Exclude<FieldGrammar, SlotFieldGrammar>

export interface FieldValueContext {
  componentId: string
  componentType: string
}

/**
 * Checks (and, for `null`, resolves) one value against its field's grammar.
 * `null` is the agent-facing "clear this field" signal — JSON has no
 * `undefined` — and clears to `''` for text/textarea, `undefined` for every
 * other type (key stays present, value `undefined`, matching core's
 * `updateProp`). Strict otherwise: no type coercion — `"5"` for a number
 * field is rejected, not silently parsed, so an agent that sent the wrong
 * JSON type learns that instead of having the mistake papered over.
 *
 * Throws a `DocumentError` subclass on any rejection; returns the value to
 * write on success.
 */
export function resolveFieldValue(field: NonSlotFieldGrammar, value: unknown, ctx: FieldValueContext): unknown {
  if (value === null)
    return field.type === 'text' || field.type === 'textarea' ? '' : undefined

  switch (field.type) {
    case 'text':
    case 'textarea':
      return resolveTextValue(field, value, ctx)
    case 'number':
      return resolveNumberValue(field, value, ctx)
    case 'boolean':
      return resolveBooleanValue(field, value, ctx)
    case 'select':
      return resolveSelectValue(field, value, ctx)
  }
}

function resolveTextValue(
  field: TextFieldGrammar | TextareaFieldGrammar,
  value: unknown,
  ctx: FieldValueContext,
): string {
  if (typeof value !== 'string') {
    throw new FieldTypeMismatchError(ctx.componentId, ctx.componentType, field.name, field.type, describeValue(value), value)
  }
  return value
}

function resolveNumberValue(field: NumberFieldGrammar, value: unknown, ctx: FieldValueContext): number {
  if (typeof value !== 'number') {
    throw new FieldTypeMismatchError(ctx.componentId, ctx.componentType, field.name, 'number', describeValue(value), value)
  }
  if (!Number.isFinite(value)) {
    throw new NonFiniteNumberError(ctx.componentId, ctx.componentType, field.name, value)
  }
  if ((field.min !== undefined && value < field.min) || (field.max !== undefined && value > field.max)) {
    throw new NumberOutOfRangeError(ctx.componentId, ctx.componentType, field.name, value, field.min, field.max)
  }
  return value
}

function resolveBooleanValue(field: BooleanFieldGrammar, value: unknown, ctx: FieldValueContext): boolean {
  if (typeof value !== 'boolean') {
    throw new FieldTypeMismatchError(ctx.componentId, ctx.componentType, field.name, 'boolean', describeValue(value), value)
  }
  return value
}

function resolveSelectValue(field: SelectFieldGrammar, value: unknown, ctx: FieldValueContext): string | number {
  const allowedValues = field.options.map(option => option.value)
  if (typeof value === 'string' || typeof value === 'number') {
    if (allowedValues.includes(value))
      return value
  }
  throw new InvalidSelectValueError(ctx.componentId, ctx.componentType, field.name, value, field.options, allowedValues)
}
