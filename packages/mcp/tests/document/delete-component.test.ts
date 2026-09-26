import type { GissenData } from 'gissen'
import { describe, expect, it } from 'vitest'
import { deleteComponent } from '../../src/document/delete-component'
import { NodeNotFoundError } from '../../src/document/errors'
import { captureError, testContext } from './helpers'

function treeData(): GissenData {
  return {
    version: 1,
    root: { props: {} },
    content: [
      { type: 'Hero', props: { id: 'h1', title: 'x' } },
      {
        type: 'Container',
        props: {
          id: 'c1',
          children: [
            { type: 'Hero', props: { id: 'h2', title: 'y' } },
            { type: 'Container', props: { id: 'c2', children: [{ type: 'Hero', props: { id: 'h3', title: 'z' } }] } },
          ],
        },
      },
    ],
  }
}

describe('deleteComponent', () => {
  it('removes a top-level node', () => {
    const data = treeData()
    const result = deleteComponent(data, testContext, { id: 'h1' })
    expect(result.data.content.map(n => n.props.id)).toEqual(['c1'])
  })

  it('removes a nested node from its slot', () => {
    const data = treeData()
    const result = deleteComponent(data, testContext, { id: 'h2' })
    const container = result.data.content.find(n => n.props.id === 'c1')
    const ids = (container?.props.children as { props: { id: string } }[]).map(n => n.props.id)
    expect(ids).toEqual(['c2'])
  })

  it('removes a node together with its entire subtree', () => {
    const data = treeData()
    const result = deleteComponent(data, testContext, { id: 'c1' })
    expect(result.data.content.map(n => n.props.id)).toEqual(['h1'])
  })

  it('reports removedId, removedType, and every removedDescendantIds entry', () => {
    const data = treeData()
    const result = deleteComponent(data, testContext, { id: 'c1' })
    expect(result.removedId).toBe('c1')
    expect(result.removedType).toBe('Container')
    expect(result.removedDescendantIds.sort()).toEqual(['c2', 'h2', 'h3'].sort())
  })

  it('reports [] for removedDescendantIds when deleting a leaf', () => {
    const data = treeData()
    const result = deleteComponent(data, testContext, { id: 'h1' })
    expect(result.removedDescendantIds).toEqual([])
  })

  it('throws NodeNotFoundError for an unknown id', () => {
    const data = treeData()
    const error = captureError(() => deleteComponent(data, testContext, { id: 'nope' }))
    expect(error).toBeInstanceOf(NodeNotFoundError)
  })

  it('does not mutate the input', () => {
    const data = treeData()
    const before = structuredClone(data)
    deleteComponent(data, testContext, { id: 'h2' })
    expect(data).toStrictEqual(before)
  })
})
