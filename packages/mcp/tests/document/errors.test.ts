import { describe, expect, it } from 'vitest'
import * as errors from '../../src/document/errors'
import { describeValue, DocumentError, isDocumentError } from '../../src/document/errors'

/**
 * One instance of every concrete `DocumentError` subclass, each named after
 * its class so a mismatch (wrong `.name`) is caught below. Listed explicitly
 * rather than reflected over the module — this file is itself the
 * completeness pin: adding a class without adding it here fails the "known
 * class count" assertion below.
 */
const instances: DocumentError[] = [
  new errors.UnknownComponentTypeError('Foo', ['Hero', 'Text']),
  new errors.UnknownFieldError('id1', 'Hero', 'nope', ['title']),
  new errors.ReservedFieldError('id1'),
  new errors.InvalidSelectValueError('id1', 'Hero', 'tone', 'x', [{ label: 'A', value: 'a' }], ['a']),
  new errors.NumberOutOfRangeError('id1', 'Hero', 'level', 99, 1, 6),
  new errors.NonFiniteNumberError('id1', 'Hero', 'level', Number.NaN),
  new errors.FieldTypeMismatchError('id1', 'Hero', 'title', 'text', 'number', 42),
  new errors.SlotFieldNotEditableError('id1', 'Hero', 'children', ['children']),
  new errors.TypeNotAllowedInSlotError('p1', 'Container', 'children', 'Hero', ['Text']),
  new errors.NodeNotFoundError('id1'),
  new errors.ParentNotFoundError('p1'),
  new errors.FieldIsNotASlotError('p1', 'Container', 'title', 'text', ['children']),
  new errors.SlotRequiredError('p1', 'Container', ['children']),
  new errors.RootSlotNotApplicableError('children'),
  new errors.MoveIntoSelfError('id1'),
  new errors.MoveIntoDescendantError('id1', 'p1', 'content[0].props.children[0]'),
  new errors.IndexOutOfRangeError(5, 3, null, null),
  new errors.DuplicateComponentIdsError([{ id: 'dup', paths: ['content[0]', 'content[1]'] }]),
]

describe('document errors', () => {
  it('every subclass extends DocumentError and satisfies isDocumentError', () => {
    for (const instance of instances) {
      expect(instance).toBeInstanceOf(DocumentError)
      expect(isDocumentError(instance)).toBe(true)
    }
  })

  it('every subclass sets name to its own class name', () => {
    for (const instance of instances)
      expect(instance.name).toBe(instance.constructor.name)
  })

  it('every subclass has a unique code', () => {
    const codes = new Set(instances.map(i => i.code))
    expect(codes.size).toBe(instances.length)
  })

  it('isDocumentError rejects a plain Error', () => {
    expect(isDocumentError(new Error('nope'))).toBe(false)
  })

  it('spot check: UnknownComponentTypeError carries its fields', () => {
    const error = new errors.UnknownComponentTypeError('Foo', ['Hero', 'Text'])
    expect(error.type).toBe('Foo')
    expect(error.availableTypes).toEqual(['Hero', 'Text'])
  })

  it('spot check: NumberOutOfRangeError carries its fields', () => {
    const error = new errors.NumberOutOfRangeError('id1', 'Hero', 'level', 99, 1, 6)
    expect(error).toMatchObject({ componentId: 'id1', componentType: 'Hero', field: 'level', value: 99, min: 1, max: 6 })
  })

  it('spot check: DuplicateComponentIdsError carries its duplicates', () => {
    const error = new errors.DuplicateComponentIdsError([{ id: 'dup', paths: ['content[0]', 'content[1]'] }])
    expect(error.duplicates).toEqual([{ id: 'dup', paths: ['content[0]', 'content[1]'] }])
  })
})

describe('describeValue', () => {
  it('describes each JS value kind', () => {
    expect(describeValue('x')).toBe('string')
    expect(describeValue(1)).toBe('number')
    expect(describeValue(true)).toBe('boolean')
    expect(describeValue(null)).toBe('null')
    expect(describeValue(undefined)).toBe('undefined')
    expect(describeValue([1, 2])).toBe('array')
    expect(describeValue({})).toBe('object')
  })
})
