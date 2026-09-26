import type { GissenConfig } from 'gissen'
import { describe, expect, it } from 'vitest'
import { buildGrammar } from '../../src/grammar/build-grammar'

function mockRender() {}

describe('buildGrammar', () => {
  it('extracts detail for each of the six field types', () => {
    const config: GissenConfig = {
      components: {
        Hero: {
          fields: {
            title: { type: 'text', label: 'Title' },
            body: { type: 'textarea', rows: 4 },
            count: { type: 'number', min: 0, max: 10, step: 2 },
            active: { type: 'boolean' },
            size: {
              type: 'select',
              options: [{ label: 'Small', value: 'small' }, { label: 'Large', value: 'large' }],
            },
            items: { type: 'slot', allow: ['Card'] },
          },
          render: mockRender,
        },
      },
    }

    const grammar = buildGrammar(config)
    expect(grammar.components).toHaveLength(1)
    const fields = grammar.components[0]!.fields

    expect(fields).toContainEqual({ name: 'title', type: 'text', label: 'Title' })
    expect(fields).toContainEqual({ name: 'body', type: 'textarea', label: undefined, rows: 4 })
    expect(fields).toContainEqual({ name: 'count', type: 'number', label: undefined, min: 0, max: 10, step: 2 })
    expect(fields).toContainEqual({ name: 'active', type: 'boolean', label: undefined })
    expect(fields).toContainEqual({
      name: 'size',
      type: 'select',
      label: undefined,
      options: [{ label: 'Small', value: 'small' }, { label: 'Large', value: 'large' }],
    })
    expect(fields).toContainEqual({ name: 'items', type: 'slot', label: undefined, allow: ['Card'] })
  })

  it('uses the \'any\' sentinel for a slot with no allow list', () => {
    const config: GissenConfig = {
      components: {
        Container: {
          fields: { children: { type: 'slot' } },
          render: mockRender,
        },
      },
    }

    expect(buildGrammar(config).components[0]!.fields[0]).toMatchObject({ allow: 'any' })
  })

  it('lists every component, in declaration order', () => {
    const config: GissenConfig = {
      components: {
        Hero: { fields: {}, render: mockRender },
        Card: { fields: {}, render: mockRender },
      },
    }

    expect(buildGrammar(config).components.map(c => c.type)).toEqual(['Hero', 'Card'])
  })

  it('omits root when config.root.fields is not set', () => {
    const config: GissenConfig = { components: {} }
    expect(buildGrammar(config).root).toBeUndefined()
  })

  it('includes root grammar when config.root.fields is set', () => {
    const config: GissenConfig = {
      components: {},
      root: { fields: { siteName: { type: 'text' } } },
    }

    expect(buildGrammar(config).root).toEqual({
      fields: [{ name: 'siteName', type: 'text', label: undefined }],
    })
  })
})
