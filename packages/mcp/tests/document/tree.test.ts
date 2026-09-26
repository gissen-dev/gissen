import type { ComponentData, GissenData } from 'gissen'
import { describe, expect, it } from 'vitest'
import { DuplicateComponentIdsError } from '../../src/document/errors'
import { indexGrammar } from '../../src/document/grammar-index'
import {
  assertUniqueIds,
  collectSubtreeIds,
  containsId,
  findDuplicateIds,
  findNode,
  formatNodePath,
  slotChildren,
  walkNodes,
} from '../../src/document/tree'
import { testConfig, testGrammar } from './helpers'

const index = indexGrammar(testGrammar)

function hero(id: string, level?: number): ComponentData {
  return { type: 'Hero', props: { id, title: 'Hi', level } }
}

function textNode(id: string): ComponentData {
  return { type: 'Text', props: { id, body: 'body' } }
}

function container(id: string, children: ComponentData[]): ComponentData {
  return { type: 'Container', props: { id, children } }
}

describe('slotChildren', () => {
  it('returns [] for a declared slot that is currently absent', () => {
    const node: ComponentData = { type: 'Container', props: { id: 'c1' } }
    expect(slotChildren(node, index)).toEqual([{ slot: 'children', children: [] }])
  })

  it('does not treat an array parked on a non-slot prop as children', () => {
    // Hero has no slot fields at all; a stray array-valued prop must be ignored.
    const node: ComponentData = { type: 'Hero', props: { id: 'h1', title: 'x', level: [1, 2, 3] as never } }
    expect(slotChildren(node, index)).toEqual([])
  })

  it('returns [] for an unknown component type', () => {
    const node: ComponentData = { type: 'Nope', props: { id: 'x' } }
    expect(slotChildren(node, index)).toEqual([])
  })
})

describe('findNode', () => {
  it('finds a top-level node with a single-step path', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [hero('h1'), hero('h2')] }
    const result = findNode(data, index, 'h2')
    expect(result?.path).toEqual([{ parentId: null, slot: null, index: 1 }])
    expect(result?.index).toBe(1)
    expect(result?.siblings).toBe(data.content)
  })

  it('finds a deeply nested node with the full path', () => {
    const inner = hero('h-inner')
    const data: GissenData = {
      version: 1,
      root: { props: {} },
      content: [container('c1', [container('c2', [inner])])],
    }
    const result = findNode(data, index, 'h-inner')
    expect(result?.path).toEqual([
      { parentId: null, slot: null, index: 0 },
      { parentId: 'c1', slot: 'children', index: 0 },
      { parentId: 'c2', slot: 'children', index: 0 },
    ])
  })

  it('returns null for an unknown id', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [] }
    expect(findNode(data, index, 'nope')).toBeNull()
  })
})

describe('walkNodes', () => {
  it('visits every node depth-first with its path', () => {
    const data: GissenData = {
      version: 1,
      root: { props: {} },
      content: [container('c1', [hero('h1')]), hero('h2')],
    }
    const visited: string[] = []
    walkNodes(data, index, node => visited.push(node.props.id))
    expect(visited).toEqual(['c1', 'h1', 'h2'])
  })
})

describe('containsId', () => {
  it('is true for a direct child', () => {
    const c = container('c1', [hero('h1')])
    expect(containsId(c, index, 'h1')).toBe(true)
  })

  it('is true for a deep descendant', () => {
    const c = container('c1', [container('c2', [hero('h1')])])
    expect(containsId(c, index, 'h1')).toBe(true)
  })

  it('is false for the node itself', () => {
    const c = container('c1', [])
    expect(containsId(c, index, 'c1')).toBe(false)
  })

  it('is false for a sibling', () => {
    const c = container('c1', [hero('h1')])
    expect(containsId(c, index, 'h2')).toBe(false)
  })
})

describe('collectSubtreeIds', () => {
  it('returns the node\'s own id plus every descendant id', () => {
    const c = container('c1', [hero('h1'), container('c2', [textNode('t1')])])
    expect(collectSubtreeIds(c, index).sort()).toEqual(['c1', 'c2', 'h1', 't1'].sort())
  })
})

describe('formatNodePath', () => {
  it('renders a top-level path', () => {
    expect(formatNodePath([{ parentId: null, slot: null, index: 0 }])).toBe('content[0]')
  })

  it('renders a nested path', () => {
    expect(formatNodePath([
      { parentId: null, slot: null, index: 0 },
      { parentId: 'c1', slot: 'children', index: 2 },
    ])).toBe('content[0].props.children[2]')
  })
})

describe('findDuplicateIds / assertUniqueIds', () => {
  it('returns [] for a tree with no duplicates', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [hero('h1'), hero('h2')] }
    expect(findDuplicateIds(data, index)).toEqual([])
    expect(() => assertUniqueIds(data, index)).not.toThrow()
  })

  it('reports a duplicated id with every path it occurs at', () => {
    const data: GissenData = {
      version: 1,
      root: { props: {} },
      content: [hero('dup'), container('c1', [hero('dup')])],
    }
    const duplicates = findDuplicateIds(data, index)
    expect(duplicates).toHaveLength(1)
    expect(duplicates[0]?.id).toBe('dup')
    expect(duplicates[0]?.paths).toEqual(['content[0]', 'content[1].props.children[0]'])
  })

  it('assertUniqueIds throws DuplicateComponentIdsError', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [hero('dup'), hero('dup')] }
    expect(() => assertUniqueIds(data, index)).toThrow(DuplicateComponentIdsError)
  })
})

// Sanity: the test config used throughout this file actually has the shape these tests assume.
describe('test fixture sanity', () => {
  it('container declares an unrestricted slot and TextOnlyContainer restricts to Text', () => {
    expect(testConfig.components.Container?.fields.children).toEqual({ type: 'slot' })
    expect(testConfig.components.TextOnlyContainer?.fields.children).toMatchObject({ allow: ['Text'] })
  })
})
