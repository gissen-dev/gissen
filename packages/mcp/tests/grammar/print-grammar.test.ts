import type { Grammar } from '../../src/grammar/types'
import { describe, expect, it } from 'vitest'
import { formatGrammarForStderr } from '../../src/grammar/print-grammar'

describe('formatGrammarForStderr', () => {
  it('lists each component and its fields', () => {
    const grammar: Grammar = {
      components: [
        {
          type: 'Hero',
          fields: [
            { name: 'title', type: 'text', label: 'Title' },
            { name: 'items', type: 'slot', allow: ['Card'] },
          ],
        },
      ],
      root: { fields: [{ name: 'siteName', type: 'text' }] },
    }

    const output = formatGrammarForStderr(grammar)
    expect(output).toContain('Hero')
    expect(output).toContain('title')
    expect(output).toContain('"Title"')
    expect(output).toContain('items')
    expect(output).toContain('allow: Card')
    expect(output).toContain('siteName')
  })

  it('renders \'any\' for an unrestricted slot', () => {
    const grammar: Grammar = {
      components: [{ type: 'Container', fields: [{ name: 'children', type: 'slot', allow: 'any' }] }],
    }
    expect(formatGrammarForStderr(grammar)).toContain('allow: any')
  })

  it('renders select options and number ranges', () => {
    const grammar: Grammar = {
      components: [{
        type: 'Hero',
        fields: [
          { name: 'size', type: 'select', options: [{ label: 'Small', value: 'small' }] },
          { name: 'count', type: 'number', min: 0, max: 10 },
        ],
      }],
    }
    const output = formatGrammarForStderr(grammar)
    expect(output).toContain('select [small]')
    expect(output).toContain('min=0, max=10')
  })
})
