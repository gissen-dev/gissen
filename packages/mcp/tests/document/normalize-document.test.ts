import type { GissenData } from 'gissen'
import { describe, expect, it } from 'vitest'
import { indexGrammar } from '../../src/document/grammar-index'
import { normalizeDocumentSlots } from '../../src/document/normalize-document'
import { testGrammar } from './helpers'

const index = indexGrammar(testGrammar)

describe('normalizeDocumentSlots', () => {
  it('initializes an absent declared slot to []', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [{ type: 'Container', props: { id: 'c1' } }] }
    normalizeDocumentSlots(data, index)
    expect(data.content[0]?.props.children).toEqual([])
  })

  it('recurses into nested nodes', () => {
    const data: GissenData = {
      version: 1,
      root: { props: {} },
      content: [{ type: 'Container', props: { id: 'c1', children: [{ type: 'Container', props: { id: 'c2' } }] } }],
    }
    normalizeDocumentSlots(data, index)
    const inner = (data.content[0]?.props.children as { props: Record<string, unknown> }[])[0]
    expect(inner?.props.children).toEqual([])
  })

  it('leaves a populated slot array untouched, contents and order', () => {
    const child = { type: 'Hero', props: { id: 'h1', title: 'x' } }
    const data: GissenData = {
      version: 1,
      root: { props: {} },
      content: [{ type: 'Container', props: { id: 'c1', children: [child] } }],
    }
    normalizeDocumentSlots(data, index)
    expect(data.content[0]?.props.children).toEqual([child])
  })

  it('leaves non-slot props untouched, including a key explicitly set to undefined', () => {
    const data: GissenData = {
      version: 1,
      root: { props: {} },
      content: [{ type: 'Hero', props: { id: 'h1', title: 'x', level: undefined } }],
    }
    normalizeDocumentSlots(data, index)
    expect(data.content[0]?.props).toStrictEqual({ id: 'h1', title: 'x', level: undefined })
  })

  it('is idempotent', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [{ type: 'Container', props: { id: 'c1' } }] }
    normalizeDocumentSlots(data, index)
    normalizeDocumentSlots(data, index)
    expect(data.content[0]?.props.children).toEqual([])
  })
})
