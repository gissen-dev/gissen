import type { GissenData } from 'gissen'
import { describe, expect, it } from 'vitest'
import {
  FieldIsNotASlotError,
  IndexOutOfRangeError,
  MoveIntoDescendantError,
  MoveIntoSelfError,
  NodeNotFoundError,
  ParentNotFoundError,
  RootSlotNotApplicableError,
  SlotRequiredError,
  TypeNotAllowedInSlotError,
} from '../../src/document/errors'
import { moveComponent } from '../../src/document/move-component'
import { captureError, testContext } from './helpers'

function abcData(): GissenData {
  return {
    version: 1,
    root: { props: {} },
    content: [
      { type: 'Hero', props: { id: 'A', title: 'a' } },
      { type: 'Hero', props: { id: 'B', title: 'b' } },
      { type: 'Hero', props: { id: 'C', title: 'c' } },
    ],
  }
}

function idsOf(data: GissenData): string[] {
  return data.content.map(n => n.props.id)
}

describe('moveComponent — same-array reordering', () => {
  it('moving A (index 0) to index 2 yields [B, A, C] — decrements the forward index', () => {
    const data = abcData()
    const result = moveComponent(data, testContext, { id: 'A', index: 2 })
    expect(idsOf(result.data)).toEqual(['B', 'A', 'C'])
    expect(result.to.index).toBe(1)
  })

  it('moving C (index 2) to index 0 yields [C, A, B] — no decrement on a backward move', () => {
    const data = abcData()
    const result = moveComponent(data, testContext, { id: 'C', index: 0 })
    expect(idsOf(result.data)).toEqual(['C', 'A', 'B'])
    expect(result.to.index).toBe(0)
  })

  it('appends when index is omitted — lands last', () => {
    const data = abcData()
    const result = moveComponent(data, testContext, { id: 'A' })
    expect(idsOf(result.data)).toEqual(['B', 'C', 'A'])
  })

  it('reports from with the pre-move position', () => {
    const data = abcData()
    const result = moveComponent(data, testContext, { id: 'B', index: 0 })
    expect(result.from).toEqual({ parentId: null, slot: null, index: 1 })
  })
})

describe('moveComponent — across containers', () => {
  function nestedData(): GissenData {
    return {
      version: 1,
      root: { props: {} },
      content: [
        { type: 'Hero', props: { id: 'h1', title: 'x' } },
        { type: 'Container', props: { id: 'c1', children: [] } },
        { type: 'Container', props: { id: 'c2', children: [{ type: 'Hero', props: { id: 'h2', title: 'y' } }] } },
      ],
    }
  }

  it('moves top level -> slot', () => {
    const data = nestedData()
    const result = moveComponent(data, testContext, { id: 'h1', parentId: 'c1', slot: 'children', index: 0 })
    const container = result.data.content.find(n => n.props.id === 'c1')
    expect((container?.props.children as { props: { id: string } }[]).map(n => n.props.id)).toEqual(['h1'])
    expect(result.data.content.map(n => n.props.id)).toEqual(['c1', 'c2'])
  })

  it('moves slot -> top level', () => {
    const data = nestedData()
    const result = moveComponent(data, testContext, { id: 'h2', index: 0 })
    expect(result.data.content.map(n => n.props.id)).toEqual(['h2', 'h1', 'c1', 'c2'])
    const c2 = result.data.content.find(n => n.props.id === 'c2')
    expect(c2?.props.children).toEqual([])
  })

  it('moves between two different slots', () => {
    const data = nestedData()
    const result = moveComponent(data, testContext, { id: 'h2', parentId: 'c1', slot: 'children', index: 0 })
    const c1 = result.data.content.find(n => n.props.id === 'c1')
    const c2 = result.data.content.find(n => n.props.id === 'c2')
    expect((c1?.props.children as { props: { id: string } }[]).map(n => n.props.id)).toEqual(['h2'])
    expect(c2?.props.children).toEqual([])
  })
})

describe('moveComponent — cycle guards', () => {
  it('throws MoveIntoSelfError', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [{ type: 'Container', props: { id: 'c1', children: [] } }] }
    const error = captureError(() => moveComponent(data, testContext, { id: 'c1', parentId: 'c1', slot: 'children' }))
    expect(error).toBeInstanceOf(MoveIntoSelfError)
  })

  it('throws MoveIntoDescendantError naming the target and its path', () => {
    const data: GissenData = {
      version: 1,
      root: { props: {} },
      content: [{ type: 'Container', props: { id: 'c1', children: [{ type: 'Container', props: { id: 'c2', children: [] } }] } }],
    }
    const error = captureError(() => moveComponent(data, testContext, { id: 'c1', parentId: 'c2', slot: 'children' }))
    expect(error).toBeInstanceOf(MoveIntoDescendantError)
    const e = error as MoveIntoDescendantError
    expect(e.targetParentId).toBe('c2')
    expect(e.descendantPath).toBe('content[0].props.children[0]')
  })
})

describe('moveComponent — destination vetting', () => {
  it('throws TypeNotAllowedInSlotError with the allow list', () => {
    const data: GissenData = {
      version: 1,
      root: { props: {} },
      content: [
        { type: 'Hero', props: { id: 'h1', title: 'x' } },
        { type: 'TextOnlyContainer', props: { id: 't1', children: [] } },
      ],
    }
    const error = captureError(() => moveComponent(data, testContext, { id: 'h1', parentId: 't1', slot: 'children' }))
    expect(error).toBeInstanceOf(TypeNotAllowedInSlotError)
    expect((error as TypeNotAllowedInSlotError).allowedTypes).toEqual(['Text'])
  })

  it('throws IndexOutOfRangeError with the valid range', () => {
    const data = abcData()
    const error = captureError(() => moveComponent(data, testContext, { id: 'A', index: 10 }))
    expect(error).toBeInstanceOf(IndexOutOfRangeError)
  })

  it('throws ParentNotFoundError / SlotRequiredError / FieldIsNotASlotError / RootSlotNotApplicableError', () => {
    const data = abcData()
    expect(captureError(() => moveComponent(data, testContext, { id: 'A', parentId: 'nope', slot: 'children' }))).toBeInstanceOf(ParentNotFoundError)

    const withContainer: GissenData = { ...structuredClone(data), content: [...structuredClone(data).content, { type: 'Container', props: { id: 'c1', children: [] } }] }
    expect(captureError(() => moveComponent(withContainer, testContext, { id: 'A', parentId: 'c1' }))).toBeInstanceOf(SlotRequiredError)
    expect(captureError(() => moveComponent(withContainer, testContext, { id: 'A', parentId: 'B', slot: 'children' }))).toBeInstanceOf(FieldIsNotASlotError)
    expect(captureError(() => moveComponent(data, testContext, { id: 'A', slot: 'children' }))).toBeInstanceOf(RootSlotNotApplicableError)
  })

  it('a rejected move leaves the tree byte-identical (target vetted before detaching)', () => {
    const data: GissenData = {
      version: 1,
      root: { props: {} },
      content: [
        { type: 'Hero', props: { id: 'h1', title: 'x' } },
        { type: 'TextOnlyContainer', props: { id: 't1', children: [] } },
      ],
    }
    const before = structuredClone(data)
    captureError(() => moveComponent(data, testContext, { id: 'h1', parentId: 't1', slot: 'children' }))
    expect(data).toStrictEqual(before)
  })
})

describe('moveComponent — misc', () => {
  it('throws NodeNotFoundError for an unknown id', () => {
    const data = abcData()
    const error = captureError(() => moveComponent(data, testContext, { id: 'nope' }))
    expect(error).toBeInstanceOf(NodeNotFoundError)
  })

  it('does not mutate the input', () => {
    const data = abcData()
    const before = structuredClone(data)
    moveComponent(data, testContext, { id: 'A', index: 2 })
    expect(data).toStrictEqual(before)
  })
})
