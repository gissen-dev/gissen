import type { GissenData } from 'gissen'
import { describe, expect, it } from 'vitest'
import {
  FieldIsNotASlotError,
  IndexOutOfRangeError,
  ParentNotFoundError,
  RootSlotNotApplicableError,
  SlotRequiredError,
  TypeNotAllowedInSlotError,
} from '../../src/document/errors'
import { indexGrammar } from '../../src/document/grammar-index'
import { resolveIndex, resolveInsertionTarget } from '../../src/document/placement'
import { captureError, testGrammar } from './helpers'

const index = indexGrammar(testGrammar)

function containerData(): GissenData {
  return {
    version: 1,
    root: { props: {} },
    content: [{ type: 'Container', props: { id: 'c1', children: [] } }],
  }
}

describe('resolveInsertionTarget', () => {
  it('resolves the top level when parentId is omitted', () => {
    const data = containerData()
    const target = resolveInsertionTarget(data, index, {}, 'Hero')
    expect(target).toEqual({ siblings: data.content, parentId: null, slot: null })
  })

  it('rejects a slot given without a parentId', () => {
    const data = containerData()
    const error = captureError(() => resolveInsertionTarget(data, index, { slot: 'children' }, 'Hero'))
    expect(error).toBeInstanceOf(RootSlotNotApplicableError)
  })

  it('resolves a parent\'s declared slot', () => {
    const data = containerData()
    const target = resolveInsertionTarget(data, index, { parentId: 'c1', slot: 'children' }, 'Hero')
    expect(target.parentId).toBe('c1')
    expect(target.slot).toBe('children')
    expect(target.siblings).toBe(data.content[0]?.props.children)
  })

  it('throws ParentNotFoundError naming the id', () => {
    const data = containerData()
    const error = captureError(() => resolveInsertionTarget(data, index, { parentId: 'nope', slot: 'children' }, 'Hero'))
    expect(error).toBeInstanceOf(ParentNotFoundError)
    expect((error as ParentNotFoundError).parentId).toBe('nope')
  })

  it('throws SlotRequiredError listing the parent\'s slot fields', () => {
    const data = containerData()
    const error = captureError(() => resolveInsertionTarget(data, index, { parentId: 'c1' }, 'Hero'))
    expect(error).toBeInstanceOf(SlotRequiredError)
    expect((error as SlotRequiredError).slotFields).toEqual(['children'])
  })

  it('throws FieldIsNotASlotError when the field is a non-slot field', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [{ type: 'Hero', props: { id: 'h1', title: 'x' } }] }
    const error = captureError(() => resolveInsertionTarget(data, index, { parentId: 'h1', slot: 'title' }, 'Text'))
    expect(error).toBeInstanceOf(FieldIsNotASlotError)
    expect((error as FieldIsNotASlotError).fieldType).toBe('text')
  })

  it('throws FieldIsNotASlotError with fieldType "undeclared" when the field does not exist', () => {
    const data = containerData()
    const error = captureError(() => resolveInsertionTarget(data, index, { parentId: 'c1', slot: 'nope' }, 'Hero'))
    expect(error).toBeInstanceOf(FieldIsNotASlotError)
    expect((error as FieldIsNotASlotError).fieldType).toBe('undeclared')
  })

  it('throws TypeNotAllowedInSlotError carrying the allow list', () => {
    const data: GissenData = {
      version: 1,
      root: { props: {} },
      content: [{ type: 'TextOnlyContainer', props: { id: 't1', children: [] } }],
    }
    const error = captureError(() => resolveInsertionTarget(data, index, { parentId: 't1', slot: 'children' }, 'Hero'))
    expect(error).toBeInstanceOf(TypeNotAllowedInSlotError)
    const e = error as TypeNotAllowedInSlotError
    expect(e.rejectedType).toBe('Hero')
    expect(e.allowedTypes).toEqual(['Text'])
  })

  it('accepts any type in an allow: "any" slot', () => {
    const data = containerData()
    expect(() => resolveInsertionTarget(data, index, { parentId: 'c1', slot: 'children' }, 'AnythingGoes')).not.toThrow()
  })

  it('accepts any type at the top level — root has no allow-list', () => {
    const data = containerData()
    expect(() => resolveInsertionTarget(data, index, {}, 'AnythingGoes')).not.toThrow()
  })

  it('initializes a slot that is absent rather than an array', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [{ type: 'Container', props: { id: 'c1' } }] }
    const target = resolveInsertionTarget(data, index, { parentId: 'c1', slot: 'children' }, 'Hero')
    expect(target.siblings).toEqual([])
    expect(data.content[0]?.props.children).toBe(target.siblings)
  })
})

describe('resolveIndex', () => {
  const target = { parentId: null, slot: null }

  it('defaults to length (append) when omitted', () => {
    expect(resolveIndex(undefined, 3, target)).toBe(3)
  })

  it('accepts an index within [0, length] inclusive', () => {
    expect(resolveIndex(0, 3, target)).toBe(0)
    expect(resolveIndex(3, 3, target)).toBe(3)
  })

  it('rejects a negative index', () => {
    const error = captureError(() => resolveIndex(-1, 3, target))
    expect(error).toBeInstanceOf(IndexOutOfRangeError)
  })

  it('rejects an index beyond length', () => {
    const error = captureError(() => resolveIndex(4, 3, target))
    expect(error).toBeInstanceOf(IndexOutOfRangeError)
    expect((error as IndexOutOfRangeError).maxIndex).toBe(3)
  })

  it('rejects a non-integer index', () => {
    const error = captureError(() => resolveIndex(1.5, 3, target))
    expect(error).toBeInstanceOf(IndexOutOfRangeError)
  })
})
