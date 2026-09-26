import { describe, expect, it } from 'vitest'
import { indexGrammar } from '../../src/document/grammar-index'
import { testGrammar } from './helpers'

describe('indexGrammar', () => {
  const index = indexGrammar(testGrammar)

  it('lists registered type names in declaration order', () => {
    expect(index.types).toEqual(['Hero', 'Text', 'Banner', 'Container', 'TextOnlyContainer'])
  })

  it('returns a component grammar by type', () => {
    expect(index.component('Hero')?.type).toBe('Hero')
  })

  it('returns undefined for an unknown type', () => {
    expect(index.component('Nope')).toBeUndefined()
    expect(index.field('Nope', 'title')).toBeUndefined()
  })

  it('returns a field by component type and field name', () => {
    expect(index.field('Hero', 'level')).toMatchObject({ type: 'number', min: 1, max: 6 })
  })

  it('returns undefined for an undeclared field on a known type', () => {
    expect(index.field('Hero', 'nope')).toBeUndefined()
  })

  it('lists a component\'s field names', () => {
    expect(index.fieldNames('Hero')).toEqual(['title', 'level'])
  })

  it('returns [] for fieldNames on an unknown type', () => {
    expect(index.fieldNames('Nope')).toEqual([])
  })

  it('lists only the slot fields on a type', () => {
    expect(index.slotFieldNames('Hero')).toEqual([])
    expect(index.slotFieldNames('Container')).toEqual(['children'])
  })

  it('slotFields returns the full field grammar for each slot', () => {
    const slots = index.slotFields('TextOnlyContainer')
    expect(slots).toHaveLength(1)
    expect(slots[0]).toMatchObject({ name: 'children', type: 'slot', allow: ['Text'] })
  })

  it('returns [] for slotFields/slotFieldNames on an unknown type', () => {
    expect(index.slotFields('Nope')).toEqual([])
    expect(index.slotFieldNames('Nope')).toEqual([])
  })
})
