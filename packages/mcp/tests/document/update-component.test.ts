import type { GissenData } from 'gissen'
import { describe, expect, it } from 'vitest'
import {
  InvalidSelectValueError,
  NodeNotFoundError,
  NonFiniteNumberError,
  NumberOutOfRangeError,
  ReservedFieldError,
  SlotFieldNotEditableError,
  UnknownFieldError,
} from '../../src/document/errors'
import { updateComponent } from '../../src/document/update-component'
import { captureError, testContext } from './helpers'

function heroData(): GissenData {
  return {
    version: 1,
    root: { props: {} },
    content: [
      { type: 'Hero', props: { id: 'h1', title: 'Hi', level: 3 } },
      { type: 'Container', props: { id: 'c1', children: [{ type: 'Hero', props: { id: 'h2', title: 'Nested', level: 2 } }] } },
    ],
  }
}

describe('updateComponent', () => {
  it('merges given props and leaves others untouched', () => {
    const data = heroData()
    const result = updateComponent(data, testContext, { id: 'h1', props: { title: 'New' } })
    expect(result.data.content[0]?.props).toMatchObject({ title: 'New', level: 3 })
  })

  it('rejects "id" with ReservedFieldError', () => {
    const data = heroData()
    const error = captureError(() => updateComponent(data, testContext, { id: 'h1', props: { id: 'x' } }))
    expect(error).toBeInstanceOf(ReservedFieldError)
  })

  it('rejects an unknown key, listing the component\'s field names', () => {
    const data = heroData()
    const error = captureError(() => updateComponent(data, testContext, { id: 'h1', props: { nope: 1 } }))
    expect(error).toBeInstanceOf(UnknownFieldError)
    expect((error as UnknownFieldError).availableFields).toEqual(['title', 'level'])
  })

  it('rejects an invalid select value, listing the allowed options', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [{ type: 'Banner', props: { id: 'b1' } }] }
    const error = captureError(() => updateComponent(data, testContext, { id: 'b1', props: { tone: 'nope' } }))
    expect(error).toBeInstanceOf(InvalidSelectValueError)
    expect((error as InvalidSelectValueError).allowedValues).toEqual(['primary', 'secondary'])
  })

  it('rejects a number below min and above max, carrying the range', () => {
    const data = heroData()
    const below = captureError(() => updateComponent(data, testContext, { id: 'h1', props: { level: 0 } }))
    expect(below).toBeInstanceOf(NumberOutOfRangeError)
    const above = captureError(() => updateComponent(data, testContext, { id: 'h1', props: { level: 7 } }))
    expect(above).toBeInstanceOf(NumberOutOfRangeError)
  })

  it('rejects NaN and Infinity', () => {
    const data = heroData()
    expect(captureError(() => updateComponent(data, testContext, { id: 'h1', props: { level: Number.NaN } }))).toBeInstanceOf(NonFiniteNumberError)
    expect(captureError(() => updateComponent(data, testContext, { id: 'h1', props: { level: Number.POSITIVE_INFINITY } }))).toBeInstanceOf(NonFiniteNumberError)
  })

  it('clears a text field to "" on null', () => {
    const data = heroData()
    const result = updateComponent(data, testContext, { id: 'h1', props: { title: null } })
    expect(result.data.content[0]?.props.title).toBe('')
    expect(result.applied.title).toBe('')
  })

  it('clears a number field to undefined on null, never 0, and the key stays present', () => {
    const data = heroData()
    const result = updateComponent(data, testContext, { id: 'h1', props: { level: null } })
    const props = result.data.content[0]?.props as Record<string, unknown>
    expect(props.level).toBeUndefined()
    expect(props.level).not.toBe(0)
    expect(Object.keys(props)).toContain('level')
  })

  it('rejects writing to a slot key', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [{ type: 'Container', props: { id: 'c1', children: [] } }] }
    const error = captureError(() => updateComponent(data, testContext, { id: 'c1', props: { children: [] } }))
    expect(error).toBeInstanceOf(SlotFieldNotEditableError)
  })

  it('applies nothing when any one entry is invalid (atomic)', () => {
    const data = heroData()
    const before = structuredClone(data)
    captureError(() => updateComponent(data, testContext, { id: 'h1', props: { title: 'ok', level: 999 } }))
    expect(data).toStrictEqual(before)
  })

  it('throws NodeNotFoundError for an unknown id', () => {
    const data = heroData()
    const error = captureError(() => updateComponent(data, testContext, { id: 'nope', props: {} }))
    expect(error).toBeInstanceOf(NodeNotFoundError)
  })

  it('updates a deeply nested node', () => {
    const data = heroData()
    const result = updateComponent(data, testContext, { id: 'h2', props: { title: 'Updated' } })
    const nested = (result.data.content[1]?.props.children as { props: { title: string } }[])[0]
    expect(nested?.props.title).toBe('Updated')
  })

  it('does not mutate the input', () => {
    const data = heroData()
    const before = structuredClone(data)
    updateComponent(data, testContext, { id: 'h1', props: { title: 'New' } })
    expect(data).toStrictEqual(before)
  })
})
