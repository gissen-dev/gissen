import type { Grammar } from '../../src/grammar/types'
import { describe, expect, it } from 'vitest'
import { describeComponentTypes, describeField, describeRootFields } from '../../src/server/grammar-prose'

describe('describeField', () => {
  it('renders text/textarea/boolean bare', () => {
    expect(describeField({ name: 'title', type: 'text' })).toBe('title: text')
    expect(describeField({ name: 'body', type: 'textarea' })).toBe('body: textarea')
    expect(describeField({ name: 'active', type: 'boolean' })).toBe('active: boolean')
  })

  it('renders a number field with both bounds, min only, max only, and unbounded', () => {
    expect(describeField({ name: 'level', type: 'number', min: 1, max: 6 })).toBe('level: number (1..6)')
    expect(describeField({ name: 'level', type: 'number', min: 0 })).toBe('level: number (0 or greater)')
    expect(describeField({ name: 'level', type: 'number', max: 10 })).toBe('level: number (10 or less)')
    expect(describeField({ name: 'level', type: 'number' })).toBe('level: number')
  })

  it('renders select options JSON-quoted, including numeric option values', () => {
    expect(describeField({
      name: 'theme',
      type: 'select',
      options: [{ label: 'Primary', value: 'primary' }, { label: 'Secondary', value: 'secondary' }],
    })).toBe('theme: select ("primary" | "secondary")')
    expect(describeField({
      name: 'rank',
      type: 'select',
      options: [{ label: 'First', value: 1 }, { label: 'Second', value: 2 }],
    })).toBe('rank: select (1 | 2)')
  })

  it('renders a slot with an allow list and with the "any" sentinel', () => {
    expect(describeField({ name: 'children', type: 'slot', allow: ['Hero', 'Text'] })).toBe('children: slot (accepts: Hero, Text)')
    expect(describeField({ name: 'children', type: 'slot', allow: 'any' })).toBe('children: slot (accepts: any registered type)')
  })

  it('omits label from the rendering even when the field declares one', () => {
    expect(describeField({ name: 'title', type: 'text', label: 'Title' })).toBe('title: text')
  })

  it('omits step even when the field declares one', () => {
    expect(describeField({ name: 'level', type: 'number', min: 0, max: 10, step: 2 })).toBe('level: number (0..10)')
  })
})

describe('describeComponentTypes', () => {
  it('renders one line per component, fields joined with "; "', () => {
    const grammar: Grammar = {
      components: [
        { type: 'Hero', fields: [{ name: 'title', type: 'text' }, { name: 'level', type: 'number', min: 1, max: 6 }] },
        { type: 'Container', fields: [{ name: 'children', type: 'slot', allow: ['Hero'] }] },
      ],
    }
    expect(describeComponentTypes(grammar)).toBe(
      'Hero — title: text; level: number (1..6)\nContainer — children: slot (accepts: Hero)',
    )
  })

  it('renders a placeholder for an empty registry, never a blank line', () => {
    expect(describeComponentTypes({ components: [] })).toBe('(none — this project has no registered component types)')
  })
})

describe('describeRootFields', () => {
  it('returns undefined when the config declares no root fields', () => {
    expect(describeRootFields({ components: [] })).toBeUndefined()
  })

  it('renders root fields the same way as component fields', () => {
    expect(describeRootFields({ components: [], root: { fields: [{ name: 'siteName', type: 'text' }] } }))
      .toBe('siteName: text')
  })
})
