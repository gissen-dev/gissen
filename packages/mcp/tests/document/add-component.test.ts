import type { GissenData } from 'gissen'
import { describe, expect, it } from 'vitest'
import { addComponent } from '../../src/document/add-component'
import {
  FieldIsNotASlotError,
  IndexOutOfRangeError,
  ParentNotFoundError,
  RootSlotNotApplicableError,
  SlotRequiredError,
  TypeNotAllowedInSlotError,
  UnknownComponentTypeError,
} from '../../src/document/errors'
import { captureError, testContext, testGrammar } from './helpers'

function containerData(): GissenData {
  return {
    version: 1,
    root: { props: {} },
    content: [{ type: 'Container', props: { id: 'c1', children: [] } }],
  }
}

describe('addComponent', () => {
  it('inserts at the top level at the given index', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [{ type: 'Hero', props: { id: 'h1', title: 'x' } }] }
    const result = addComponent(data, testContext, { type: 'Text', index: 0 })
    expect(result.data.content[0]?.props.id).toBe(result.id)
    expect(result.data.content[1]?.props.id).toBe('h1')
  })

  it('appends when index is omitted', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [{ type: 'Hero', props: { id: 'h1', title: 'x' } }] }
    const result = addComponent(data, testContext, { type: 'Text' })
    expect(result.data.content).toHaveLength(2)
    expect(result.data.content[1]?.props.id).toBe(result.id)
    expect(result.placement.index).toBe(1)
  })

  it('inserts into a parent slot at the given index', () => {
    const data = containerData()
    const result = addComponent(data, testContext, { type: 'Hero', parentId: 'c1', slot: 'children', index: 0 })
    expect(result.placement).toEqual({ parentId: 'c1', slot: 'children', index: 0 })
    expect((result.data.content[0]?.props.children as { props: { id: string } }[])[0]?.props.id).toBe(result.id)
  })

  it('returns the new node\'s own slots as []', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [] }
    const result = addComponent(data, testContext, { type: 'Container' })
    expect(result.data.content[0]?.props.children).toEqual([])
  })

  it('throws UnknownComponentTypeError listing the registered types', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [] }
    const error = captureError(() => addComponent(data, testContext, { type: 'Nope' }))
    expect(error).toBeInstanceOf(UnknownComponentTypeError)
    expect((error as UnknownComponentTypeError).availableTypes).toEqual(testGrammar.components.map(c => c.type))
  })

  it('throws ParentNotFoundError naming the id', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [] }
    const error = captureError(() => addComponent(data, testContext, { type: 'Hero', parentId: 'nope', slot: 'children' }))
    expect(error).toBeInstanceOf(ParentNotFoundError)
  })

  it('throws SlotRequiredError listing the parent\'s slot fields', () => {
    const data = containerData()
    const error = captureError(() => addComponent(data, testContext, { type: 'Hero', parentId: 'c1' }))
    expect(error).toBeInstanceOf(SlotRequiredError)
  })

  it('throws FieldIsNotASlotError when the slot names a text field', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [{ type: 'Hero', props: { id: 'h1', title: 'x' } }] }
    const error = captureError(() => addComponent(data, testContext, { type: 'Text', parentId: 'h1', slot: 'title' }))
    expect(error).toBeInstanceOf(FieldIsNotASlotError)
  })

  it('throws FieldIsNotASlotError when the slot names an undeclared field', () => {
    const data = containerData()
    const error = captureError(() => addComponent(data, testContext, { type: 'Hero', parentId: 'c1', slot: 'nope' }))
    expect(error).toBeInstanceOf(FieldIsNotASlotError)
  })

  it('throws RootSlotNotApplicableError when a slot is given at root', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [] }
    const error = captureError(() => addComponent(data, testContext, { type: 'Hero', slot: 'children' }))
    expect(error).toBeInstanceOf(RootSlotNotApplicableError)
  })

  it('throws TypeNotAllowedInSlotError carrying parent type, slot, rejected type, and the allow list', () => {
    const data: GissenData = {
      version: 1,
      root: { props: {} },
      content: [{ type: 'TextOnlyContainer', props: { id: 't1', children: [] } }],
    }
    const error = captureError(() => addComponent(data, testContext, { type: 'Hero', parentId: 't1', slot: 'children' }))
    expect(error).toBeInstanceOf(TypeNotAllowedInSlotError)
    const e = error as TypeNotAllowedInSlotError
    expect(e).toMatchObject({ parentId: 't1', parentType: 'TextOnlyContainer', slot: 'children', rejectedType: 'Hero', allowedTypes: ['Text'] })
  })

  it('accepts any type in an allow: "any" slot', () => {
    const data = containerData()
    expect(() => addComponent(data, testContext, { type: 'Hero', parentId: 'c1', slot: 'children' })).not.toThrow()
  })

  it('accepts every type at the top level — root has no allow-list', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [] }
    expect(() => addComponent(data, testContext, { type: 'Text' })).not.toThrow()
  })

  it('throws IndexOutOfRangeError for length + 1, for -1, and for a non-integer, carrying the valid range', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [] }
    const tooHigh = captureError(() => addComponent(data, testContext, { type: 'Hero', index: 1 }))
    expect(tooHigh).toBeInstanceOf(IndexOutOfRangeError)
    expect((tooHigh as IndexOutOfRangeError).maxIndex).toBe(0)

    expect(captureError(() => addComponent(data, testContext, { type: 'Hero', index: -1 }))).toBeInstanceOf(IndexOutOfRangeError)
    expect(captureError(() => addComponent(data, testContext, { type: 'Hero', index: 1.5 }))).toBeInstanceOf(IndexOutOfRangeError)
  })

  it('accepts index === length', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [] }
    expect(() => addComponent(data, testContext, { type: 'Hero', index: 0 })).not.toThrow()
  })

  it('does not mutate the input', () => {
    const data = containerData()
    const before = structuredClone(data)
    addComponent(data, testContext, { type: 'Hero', parentId: 'c1', slot: 'children' })
    expect(data).toStrictEqual(before)
  })
})
