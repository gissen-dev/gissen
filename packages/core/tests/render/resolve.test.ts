import type { Component } from 'vue'
import type { ComponentData, GissenConfig } from '../../src/types'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { resolveNode } from '../../src/render/resolve'

const Noop: Component = defineComponent({ template: '<div />' })

const config: GissenConfig = {
  components: {
    Button: {
      fields: { label: { type: 'text' }, count: { type: 'number' } },
      render: Noop,
    },
    Columns: {
      fields: {
        title: { type: 'text' },
        left: { type: 'slot' },
        right: { type: 'slot' },
      },
      render: Noop,
    },
  },
}

function node(type: string, props: Record<string, unknown>): ComponentData {
  return { type, props: { id: 'n-1', ...props } }
}

describe('resolveNode', () => {
  it('looks up the component config by type', () => {
    const resolved = resolveNode(config, node('Button', { label: 'Hi' }))
    expect(resolved.config).toBe(config.components.Button)
  })

  it('returns undefined config for an unknown type, with empty slots', () => {
    const resolved = resolveNode(config, node('Missing', { label: 'Hi' }))
    expect(resolved.config).toBeUndefined()
    expect(resolved.slots).toEqual({})
    // Props still round-trip so callers can report on the node.
    expect(resolved.props).toEqual({ id: 'n-1', label: 'Hi' })
  })

  it('passes non-slot props through, including id', () => {
    const resolved = resolveNode(config, node('Button', { label: 'Hi', count: 3 }))
    expect(resolved.props).toEqual({ id: 'n-1', label: 'Hi', count: 3 })
  })

  it('does not inject defaults for absent props', () => {
    const resolved = resolveNode(config, node('Button', {}))
    expect(resolved.props).toEqual({ id: 'n-1' })
    expect('label' in resolved.props).toBe(false)
  })

  it('splits slot fields out of props and into slots', () => {
    const child = node('Button', { label: 'child' })
    const resolved = resolveNode(config, node('Columns', { title: 'T', left: [child], right: [] }))
    expect(resolved.props).toEqual({ id: 'n-1', title: 'T' })
    expect(resolved.slots).toEqual({ left: [child], right: [] })
  })

  it('keeps slot child array identity (no cloning)', () => {
    const children = [node('Button', { label: 'child' })]
    const resolved = resolveNode(config, node('Columns', { left: children }))
    expect(resolved.slots.left).toBe(children)
  })

  it('resolves a declared slot with a missing prop to an empty array', () => {
    const resolved = resolveNode(config, node('Columns', { title: 'T' }))
    expect(resolved.slots).toEqual({ left: [], right: [] })
  })

  it('resolves a non-array slot value to an empty array', () => {
    const resolved = resolveNode(config, node('Columns', { left: 'not-an-array' }))
    expect(resolved.slots.left).toEqual([])
    // The malformed value is dropped from props too — it was declared a slot.
    expect('left' in resolved.props).toBe(false)
  })

  it('returns an empty slots record for a component with no slot fields', () => {
    const resolved = resolveNode(config, node('Button', { label: 'Hi' }))
    expect(resolved.slots).toEqual({})
  })

  it('passes through data props not declared in fields', () => {
    const resolved = resolveNode(config, node('Button', { label: 'Hi', extra: true }))
    expect(resolved.props.extra).toBe(true)
  })
})
