import type { GissenConfig } from 'gissen'
import { describe, expect, it } from 'vitest'
import { createNode } from '../../src/document/create-node'
import { InvalidDefaultPropError, UnknownComponentTypeError } from '../../src/document/errors'
import { buildGrammar } from '../../src/grammar/build-grammar'
import { captureError, testContext } from './helpers'

function mockRender(): null {
  return null
}

describe('createNode', () => {
  it('generates an id and applies the config\'s defaultProps', () => {
    const node = createNode('Hero', testContext)
    expect(typeof node.props.id).toBe('string')
    expect(node.props.id.length).toBeGreaterThan(0)
    expect(node.props.title).toBe('Hello')
    expect(node.props.level).toBe(1)
  })

  it('initializes every declared slot to []', () => {
    const node = createNode('Container', testContext)
    expect(node.props.children).toEqual([])
  })

  it('two instances get different ids', () => {
    const a = createNode('Hero', testContext)
    const b = createNode('Hero', testContext)
    expect(a.props.id).not.toBe(b.props.id)
  })

  it('throws UnknownComponentTypeError listing the registered types', () => {
    const error = captureError(() => createNode('Nope', testContext))
    expect(error).toBeInstanceOf(UnknownComponentTypeError)
    const e = error as UnknownComponentTypeError
    expect(e.type).toBe('Nope')
    expect(e.availableTypes).toEqual(['Hero', 'Text', 'Banner', 'Container', 'TextOnlyContainer'])
  })

  it('throws InvalidDefaultPropError when a config default violates its own field constraints', () => {
    const config: GissenConfig = {
      components: {
        Bad: {
          fields: { level: { type: 'number', min: 1, max: 6 } },
          defaultProps: { level: 99 },
          render: mockRender,
        },
      },
    }
    const ctx = { config, grammar: buildGrammar(config) }
    const error = captureError(() => createNode('Bad', ctx))
    expect(error).toBeInstanceOf(InvalidDefaultPropError)
    const e = error as InvalidDefaultPropError
    expect(e.componentType).toBe('Bad')
    expect(e.field).toBe('level')
    expect(e.value).toBe(99)
  })

  it('throws InvalidDefaultPropError for a null default on a non-slot field, rather than creating the node with a literal null', () => {
    const config: GissenConfig = {
      components: {
        Bad: {
          fields: { title: { type: 'text' } },
          defaultProps: { title: null as unknown as string },
          render: mockRender,
        },
      },
    }
    const ctx = { config, grammar: buildGrammar(config) }
    const error = captureError(() => createNode('Bad', ctx))
    expect(error).toBeInstanceOf(InvalidDefaultPropError)
    const e = error as InvalidDefaultPropError
    expect(e.componentType).toBe('Bad')
    expect(e.field).toBe('title')
    expect(e.value).toBe(null)
  })
})
