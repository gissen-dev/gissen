import type { GissenConfig } from '../../src'
import { describe, expect, it } from 'vitest'
import { GissenValidationError, validateData } from '../../src'

function mockRender() {}

const config: GissenConfig = {
  components: {
    Hero: {
      fields: {
        title: { type: 'text' },
        count: { type: 'number' },
        active: { type: 'boolean' },
        size: {
          type: 'select',
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Large', value: 'large' },
          ],
        },
        items: { type: 'slot' },
      },
      render: mockRender,
    },
    Card: {
      fields: {
        label: { type: 'text' },
      },
      render: mockRender,
    },
    Container: {
      fields: {
        children: { type: 'slot', allow: ['Card'] },
      },
      render: mockRender,
    },
  },
}

const emptyData = { root: { props: {} }, content: [] }

const validData = {
  root: { props: {} },
  content: [
    {
      type: 'Hero',
      props: {
        id: 'abc1234567',
        title: 'Hello',
        count: 42,
        active: true,
        size: 'small',
        items: [],
      },
    },
  ],
}

describe('validateData', () => {
  it('accepts valid data against a config', () => {
    expect(() => validateData(validData, config)).not.toThrow()
    const result = validateData(validData, config)
    expect(result.content).toHaveLength(1)
  })

  it('accepts empty data with an empty or populated config', () => {
    expect(() => validateData(emptyData, config)).not.toThrow()
    expect(() => validateData(emptyData, { components: {} })).not.toThrow()
  })

  it('throws GissenValidationError for an unknown component type', () => {
    const data = {
      root: { props: {} },
      content: [{ type: 'Unknown', props: { id: 'x' } }],
    }
    expect(() => validateData(data, config)).toThrow(GissenValidationError)
  })

  it('throws when a required text prop is missing', () => {
    const data = {
      root: { props: {} },
      content: [{ type: 'Hero', props: { id: 'x', count: 0, active: false, size: 'small', items: [] } }],
    }
    expect(() => validateData(data, config)).toThrow(GissenValidationError)
  })

  it('throws when a text prop is given the wrong type (number instead of string)', () => {
    const data = {
      root: { props: {} },
      content: [{ type: 'Hero', props: { id: 'x', title: 99, count: 0, active: false, size: 'small', items: [] } }],
    }
    expect(() => validateData(data, config)).toThrow(GissenValidationError)
  })

  it('throws when a number prop is given the wrong type (string instead of number)', () => {
    const data = {
      root: { props: {} },
      content: [{ type: 'Hero', props: { id: 'x', title: 'Hi', count: 'not-a-number', active: false, size: 'small', items: [] } }],
    }
    expect(() => validateData(data, config)).toThrow(GissenValidationError)
  })

  it('throws when a boolean prop is given the wrong type', () => {
    const data = {
      root: { props: {} },
      content: [{ type: 'Hero', props: { id: 'x', title: 'Hi', count: 0, active: 'yes', size: 'small', items: [] } }],
    }
    expect(() => validateData(data, config)).toThrow(GissenValidationError)
  })

  it('throws when a select prop value is not in options', () => {
    const data = {
      root: { props: {} },
      content: [{ type: 'Hero', props: { id: 'x', title: 'Hi', count: 0, active: false, size: 'medium', items: [] } }],
    }
    expect(() => validateData(data, config)).toThrow(GissenValidationError)
  })

  it('throws when a slot child type is not in the allow list', () => {
    const data = {
      root: { props: {} },
      content: [
        {
          type: 'Container',
          props: {
            id: 'x',
            children: [
              { type: 'Hero', props: { id: 'y', title: 'Hi', count: 0, active: false, size: 'small', items: [] } },
            ],
          },
        },
      ],
    }
    expect(() => validateData(data, config)).toThrow(GissenValidationError)
  })

  it('accepts slot children within the allow list', () => {
    const data = {
      root: { props: {} },
      content: [
        {
          type: 'Container',
          props: {
            id: 'x',
            children: [
              { type: 'Card', props: { id: 'y', label: 'Hello' } },
            ],
          },
        },
      ],
    }
    expect(() => validateData(data, config)).not.toThrow()
  })

  it('catches deeply nested invalid data and includes the correct path in the error', () => {
    const data = {
      root: { props: {} },
      content: [
        {
          type: 'Hero',
          props: {
            id: 'x',
            title: 'Hi',
            count: 0,
            active: false,
            size: 'small',
            items: [
              {
                type: 'Card',
                props: { id: 'y', label: 42 },
              },
            ],
          },
        },
      ],
    }
    let error: GissenValidationError | null = null
    try {
      validateData(data, config)
    }
    catch (e) {
      error = e as GissenValidationError
    }
    expect(error).toBeInstanceOf(GissenValidationError)
    expect(error!.message).toMatch(/content\[0\]/)
    expect(error!.message).toMatch(/items\[0\]/)
    expect(error!.message).toMatch(/label/)
  })

  it('throws when data has a missing id in props', () => {
    const data = {
      root: { props: {} },
      content: [{ type: 'Hero', props: { title: 'Hi', count: 0, active: false, size: 'small', items: [] } }],
    }
    expect(() => validateData(data, config)).toThrow(GissenValidationError)
  })

  it('throws when a nested slot child is missing its id', () => {
    const data = {
      root: { props: {} },
      content: [
        {
          type: 'Container',
          props: {
            id: 'c1',
            children: [
              // No id on this child — must be rejected, not silently accepted.
              { type: 'Card', props: { label: 'Hello' } },
            ],
          },
        },
      ],
    }
    let error: GissenValidationError | null = null
    try {
      validateData(data, config)
    }
    catch (e) {
      error = e as GissenValidationError
    }
    expect(error).toBeInstanceOf(GissenValidationError)
    expect(error!.message).toMatch(/children\[0\]\.props\.id/)
  })

  it('throws when an empty-string id is given to a nested child', () => {
    const data = {
      root: { props: {} },
      content: [
        {
          type: 'Container',
          props: {
            id: 'c1',
            children: [{ type: 'Card', props: { id: '', label: 'Hello' } }],
          },
        },
      ],
    }
    expect(() => validateData(data, config)).toThrow(GissenValidationError)
  })

  it('throws when data is not an object', () => {
    expect(() => validateData(null, config)).toThrow(GissenValidationError)
    expect(() => validateData('string', config)).toThrow(GissenValidationError)
  })

  it('throws when content contains props not in component fields', () => {
    const data = {
      root: { props: {} },
      content: [{ type: 'Card', props: { id: 'x', label: 'Hi', unknownProp: true } }],
    }
    expect(() => validateData(data, config)).toThrow(GissenValidationError)
  })
})
