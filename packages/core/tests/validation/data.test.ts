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

  it('round-trips a numeric version field', () => {
    const result = validateData({ ...emptyData, version: 1 }, config)
    expect(result.version).toBe(1)
  })

  it('accepts data with an absent version (no migration layer yet)', () => {
    const result = validateData(emptyData, config)
    expect(result.version).toBeUndefined()
  })

  it('throws GissenValidationError for a non-numeric version', () => {
    expect(() => validateData({ ...emptyData, version: 'v1' }, config)).toThrow(GissenValidationError)
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

  it('reports a GissenValidationError (not a TypeError) for a null slot child', () => {
    const data = {
      root: { props: {} },
      content: [
        { type: 'Container', props: { id: 'c1', children: [null] } },
      ],
    }
    let error: unknown
    try {
      validateData(data, config)
    }
    catch (e) {
      error = e
    }
    expect(error).toBeInstanceOf(GissenValidationError)
    expect((error as GissenValidationError).message).toMatch(/children\[0\]/)
  })

  it('reports a GissenValidationError for a null child in an allow-list slot', () => {
    // `Container.children` has allow: ['Card'] — the allow-check must not throw on null.
    const data = {
      root: { props: {} },
      content: [
        { type: 'Container', props: { id: 'c1', children: [null] } },
      ],
    }
    expect(() => validateData(data, config)).toThrow(GissenValidationError)
  })

  it('reports a GissenValidationError for a slot child missing props', () => {
    const data = {
      root: { props: {} },
      content: [
        { type: 'Container', props: { id: 'c1', children: [{ type: 'Card' }] } },
      ],
    }
    let error: unknown
    try {
      validateData(data, config)
    }
    catch (e) {
      error = e
    }
    expect(error).toBeInstanceOf(GissenValidationError)
    expect((error as GissenValidationError).message).toMatch(/props/)
  })

  it('reports a GissenValidationError for a primitive slot child', () => {
    const data = {
      root: { props: {} },
      content: [
        { type: 'Container', props: { id: 'c1', children: [42] } },
      ],
    }
    expect(() => validateData(data, config)).toThrow(GissenValidationError)
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

  describe('number range checks (H-2)', () => {
    const rangeConfig: GissenConfig = {
      components: {
        Box: {
          fields: { size: { type: 'number', min: 0, max: 100 } },
          render: mockRender,
        },
      },
    }

    function boxData(size: number) {
      return { root: { props: {} }, content: [{ type: 'Box', props: { id: 'b1', size } }] }
    }

    it('accepts a value within [min, max]', () => {
      expect(() => validateData(boxData(50), rangeConfig)).not.toThrow()
    })

    it('accepts the exact min and max bounds', () => {
      expect(() => validateData(boxData(0), rangeConfig)).not.toThrow()
      expect(() => validateData(boxData(100), rangeConfig)).not.toThrow()
    })

    it('throws when a number is below min', () => {
      expect(() => validateData(boxData(-1), rangeConfig)).toThrow(GissenValidationError)
    })

    it('throws when a number is above max', () => {
      expect(() => validateData(boxData(101), rangeConfig)).toThrow(GissenValidationError)
    })

    it('includes min/max detail in the error message', () => {
      let error: GissenValidationError | null = null
      try {
        validateData(boxData(200), rangeConfig)
      }
      catch (e) {
        error = e as GissenValidationError
      }
      expect(error).toBeInstanceOf(GissenValidationError)
      expect(error!.message).toMatch(/<= 100/)
    })
  })

  describe('root props validation (M-4)', () => {
    const rootConfig: GissenConfig = {
      components: {},
      root: {
        fields: {
          background: { type: 'text' },
          columns: { type: 'number', min: 1, max: 12 },
        },
      },
    }

    it('accepts root props matching the configured root fields', () => {
      const data = { root: { props: { background: '#fff', columns: 3 } }, content: [] }
      expect(() => validateData(data, rootConfig)).not.toThrow()
    })

    it('throws when a root prop has the wrong type', () => {
      const data = { root: { props: { background: 123, columns: 3 } }, content: [] }
      expect(() => validateData(data, rootConfig)).toThrow(GissenValidationError)
    })

    it('throws when a required root prop is missing', () => {
      const data = { root: { props: { background: '#fff' } }, content: [] }
      expect(() => validateData(data, rootConfig)).toThrow(GissenValidationError)
    })

    it('throws when a root prop is out of range', () => {
      const data = { root: { props: { background: '#fff', columns: 99 } }, content: [] }
      expect(() => validateData(data, rootConfig)).toThrow(GissenValidationError)
    })

    it('throws when root props contain a key not defined in root fields', () => {
      const data = { root: { props: { background: '#fff', columns: 3, extra: true } }, content: [] }
      expect(() => validateData(data, rootConfig)).toThrow(GissenValidationError)
    })

    it('reports the error path under root.props', () => {
      const data = { root: { props: { background: 123, columns: 3 } }, content: [] }
      let error: GissenValidationError | null = null
      try {
        validateData(data, rootConfig)
      }
      catch (e) {
        error = e as GissenValidationError
      }
      expect(error!.message).toMatch(/root\.props\.background/)
    })

    it('ignores root props when the config declares no root fields', () => {
      // `config` has no root.fields — arbitrary root props are accepted as-is.
      const data = { root: { props: { anything: 'goes', n: 999 } }, content: [] }
      expect(() => validateData(data, config)).not.toThrow()
    })
  })
})
