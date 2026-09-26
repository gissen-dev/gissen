import type { NonSlotFieldGrammar } from '../../src/document/resolve-field-value'
import { describe, expect, it } from 'vitest'
import {
  FieldTypeMismatchError,
  InvalidSelectValueError,
  NonFiniteNumberError,
  NumberOutOfRangeError,
} from '../../src/document/errors'
import { indexGrammar } from '../../src/document/grammar-index'
import { resolveFieldValue } from '../../src/document/resolve-field-value'
import { captureError, testGrammar } from './helpers'

const index = indexGrammar(testGrammar)
const ctx = { componentId: 'h1', componentType: 'Hero' }

function field(type: string, name: string): NonSlotFieldGrammar {
  const f = index.field(type, name)
  if (!f)
    throw new Error(`test fixture missing field ${type}.${name}`)
  if (f.type === 'slot')
    throw new Error(`test fixture field ${type}.${name} is a slot field, not usable with resolveFieldValue`)
  return f
}

describe('resolveFieldValue — text/textarea', () => {
  it('accepts a string, including ""', () => {
    expect(resolveFieldValue(field('Hero', 'title'), 'hi', ctx)).toBe('hi')
    expect(resolveFieldValue(field('Hero', 'title'), '', ctx)).toBe('')
  })

  it('clears to "" on null', () => {
    expect(resolveFieldValue(field('Hero', 'title'), null, ctx)).toBe('')
  })

  it('rejects a non-string', () => {
    const error = captureError(() => resolveFieldValue(field('Hero', 'title'), 42, ctx))
    expect(error).toBeInstanceOf(FieldTypeMismatchError)
  })
})

describe('resolveFieldValue — number', () => {
  it('accepts a finite in-range number', () => {
    expect(resolveFieldValue(field('Hero', 'level'), 3, ctx)).toBe(3)
  })

  it('accepts the exact min and max bounds', () => {
    expect(resolveFieldValue(field('Hero', 'level'), 1, ctx)).toBe(1)
    expect(resolveFieldValue(field('Hero', 'level'), 6, ctx)).toBe(6)
  })

  it('clears to undefined on null, never 0', () => {
    const result = resolveFieldValue(field('Hero', 'level'), null, ctx)
    expect(result).toBeUndefined()
    expect(result).not.toBe(0)
  })

  it('rejects a numeric string — no coercion', () => {
    const error = captureError(() => resolveFieldValue(field('Hero', 'level'), '3', ctx))
    expect(error).toBeInstanceOf(FieldTypeMismatchError)
  })

  it('rejects NaN', () => {
    const error = captureError(() => resolveFieldValue(field('Hero', 'level'), Number.NaN, ctx))
    expect(error).toBeInstanceOf(NonFiniteNumberError)
  })

  it('rejects Infinity', () => {
    const error = captureError(() => resolveFieldValue(field('Hero', 'level'), Number.POSITIVE_INFINITY, ctx))
    expect(error).toBeInstanceOf(NonFiniteNumberError)
  })

  it('rejects below min and above max, carrying min/max on the error', () => {
    const below = captureError(() => resolveFieldValue(field('Hero', 'level'), 0, ctx))
    expect(below).toBeInstanceOf(NumberOutOfRangeError)
    expect((below as NumberOutOfRangeError).min).toBe(1)
    expect((below as NumberOutOfRangeError).max).toBe(6)

    const above = captureError(() => resolveFieldValue(field('Hero', 'level'), 7, ctx))
    expect(above).toBeInstanceOf(NumberOutOfRangeError)
  })

  it('does not clamp', () => {
    const error = captureError(() => resolveFieldValue(field('Hero', 'level'), 99, ctx))
    expect((error as NumberOutOfRangeError).value).toBe(99)
  })

  it('ignores an unbounded field\'s absent min/max', () => {
    expect(resolveFieldValue(field('Banner', 'weight'), 1_000_000, ctx)).toBe(1_000_000)
  })
})

describe('resolveFieldValue — boolean', () => {
  it('accepts true/false', () => {
    expect(resolveFieldValue(field('Banner', 'featured'), true, ctx)).toBe(true)
    expect(resolveFieldValue(field('Banner', 'featured'), false, ctx)).toBe(false)
  })

  it('clears to undefined on null', () => {
    expect(resolveFieldValue(field('Banner', 'featured'), null, ctx)).toBeUndefined()
  })

  it('rejects 1/0 and "true" — no truthiness coercion', () => {
    expect(captureError(() => resolveFieldValue(field('Banner', 'featured'), 1, ctx))).toBeInstanceOf(FieldTypeMismatchError)
    expect(captureError(() => resolveFieldValue(field('Banner', 'featured'), 0, ctx))).toBeInstanceOf(FieldTypeMismatchError)
    expect(captureError(() => resolveFieldValue(field('Banner', 'featured'), 'true', ctx))).toBeInstanceOf(FieldTypeMismatchError)
  })
})

describe('resolveFieldValue — select', () => {
  it('accepts a configured string value', () => {
    expect(resolveFieldValue(field('Banner', 'tone'), 'primary', ctx)).toBe('primary')
  })

  it('accepts a configured numeric value', () => {
    expect(resolveFieldValue(field('Banner', 'rank'), 2, ctx)).toBe(2)
  })

  it('clears to undefined on null', () => {
    expect(resolveFieldValue(field('Banner', 'tone'), null, ctx)).toBeUndefined()
  })

  it('rejects an unconfigured value, carrying the option list', () => {
    const error = captureError(() => resolveFieldValue(field('Banner', 'tone'), 'tertiary', ctx))
    expect(error).toBeInstanceOf(InvalidSelectValueError)
    expect((error as InvalidSelectValueError).allowedValues).toEqual(['primary', 'secondary'])
  })

  it('rejects a stringified numeric option value — "2" is not 2', () => {
    const error = captureError(() => resolveFieldValue(field('Banner', 'rank'), '2', ctx))
    expect(error).toBeInstanceOf(InvalidSelectValueError)
  })
})

// Note: `resolveFieldValue`'s parameter type (`NonSlotFieldGrammar`) excludes
// slot fields entirely — a caller must check `field.type === 'slot'` and
// throw `SlotFieldNotEditableError` itself *before* ever calling this
// function (see `update-component.ts`, and its own test for that behavior).
// There is nothing to test here: the type system is the enforcement.
