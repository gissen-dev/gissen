import { describe, expect, it } from 'vitest'
import { createNode } from '../../src/document/create-node'
import { UnknownComponentTypeError } from '../../src/document/errors'
import { captureError, testContext } from './helpers'

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
})
