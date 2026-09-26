import { describe, expect, it } from 'vitest'
import { GissenValidationError, validateConfig } from '../../src'

function mockRender() {}

const minimalConfig = {
  components: {
    Hero: {
      fields: { title: { type: 'text' } },
      render: mockRender,
    },
  },
}

describe('validateConfig', () => {
  it('accepts a valid minimal config', () => {
    expect(() => validateConfig(minimalConfig)).not.toThrow()
    const result = validateConfig(minimalConfig)
    expect(result.components.Hero.fields.title.type).toBe('text')
  })

  it('accepts a config with all six field types', () => {
    const config = {
      components: {
        Full: {
          fields: {
            title: { type: 'text' },
            bio: { type: 'textarea', rows: 4 },
            count: { type: 'number', min: 0, max: 100 },
            active: { type: 'boolean' },
            size: { type: 'select', options: [{ label: 'S', value: 'small' }, { label: 'L', value: 'large' }] },
            items: { type: 'slot' },
          },
          render: mockRender,
        },
      },
    }
    expect(() => validateConfig(config)).not.toThrow()
  })

  it('throws GissenValidationError when components entry is missing fields', () => {
    const config = {
      components: {
        Bad: { render: mockRender },
      },
    }
    expect(() => validateConfig(config)).toThrow(GissenValidationError)
  })

  it('throws GissenValidationError when field type is invalid', () => {
    const config = {
      components: {
        Bad: {
          fields: { title: { type: 'richtext' } },
          render: mockRender,
        },
      },
    }
    expect(() => validateConfig(config)).toThrow(GissenValidationError)
  })

  it('throws GissenValidationError when render is missing', () => {
    const config = {
      components: {
        Bad: { fields: { title: { type: 'text' } } },
      },
    }
    expect(() => validateConfig(config)).toThrow(GissenValidationError)
  })

  it('throws GissenValidationError when defaultProps has keys not in fields', () => {
    const config = {
      components: {
        Bad: {
          fields: { title: { type: 'text' } },
          defaultProps: { title: 'Hello', unknownKey: 'extra' },
          render: mockRender,
        },
      },
    }
    expect(() => validateConfig(config)).toThrow(GissenValidationError)
  })

  it('throws GissenValidationError when select defaultProps value is not in options', () => {
    const config = {
      components: {
        Bad: {
          fields: {
            size: {
              type: 'select',
              options: [{ label: 'Small', value: 'small' }, { label: 'Large', value: 'large' }],
            },
          },
          defaultProps: { size: 'medium' },
          render: mockRender,
        },
      },
    }
    let error: GissenValidationError | null = null
    try {
      validateConfig(config)
    }
    catch (e) {
      error = e as GissenValidationError
    }
    expect(error).toBeInstanceOf(GissenValidationError)
    expect(error!.message).toMatch(/size/)
    expect(error!.message).toMatch(/not among select options/)
  })

  it('accepts a select field with a non-readonly options array at runtime', () => {
    const config = {
      components: {
        Card: {
          fields: {
            variant: {
              type: 'select',
              options: [{ label: 'Primary', value: 'primary' }],
            },
          },
          defaultProps: { variant: 'primary' },
          render: mockRender,
        },
      },
    }
    expect(() => validateConfig(config)).not.toThrow()
  })

  it('throws GissenValidationError when the config root is not an object', () => {
    expect(() => validateConfig(null)).toThrow(GissenValidationError)
    expect(() => validateConfig('string')).toThrow(GissenValidationError)
    expect(() => validateConfig(42)).toThrow(GissenValidationError)
  })

  it('throws GissenValidationError when components is missing', () => {
    expect(() => validateConfig({})).toThrow(GissenValidationError)
  })

  it('includes a human-readable message with path and reason', () => {
    const config = {
      components: {
        Bad: {
          fields: { title: { type: 'text' } },
          defaultProps: { title: 'Hello', extra: 'value' },
          render: mockRender,
        },
      },
    }
    let error: GissenValidationError | null = null
    try {
      validateConfig(config)
    }
    catch (e) {
      error = e as GissenValidationError
    }
    expect(error).toBeInstanceOf(GissenValidationError)
    expect(error!.message).toMatch(/extra/)
    expect(error!.issues.length).toBeGreaterThan(0)
    expect(error!.issues[0].path).toBeDefined()
  })

  it('throws GissenValidationError when a field is named "id" (reserved key)', () => {
    const config = {
      components: {
        Bad: {
          fields: { id: { type: 'text' }, title: { type: 'text' } },
          render: mockRender,
        },
      },
    }
    expect(() => validateConfig(config)).toThrow(GissenValidationError)
  })

  it('gives a clear message when a field is named "id"', () => {
    const config = {
      components: {
        Bad: {
          fields: { id: { type: 'text' } },
          render: mockRender,
        },
      },
    }
    let error: GissenValidationError | null = null
    try {
      validateConfig(config)
    }
    catch (e) {
      error = e as GissenValidationError
    }
    expect(error).toBeInstanceOf(GissenValidationError)
    expect(error!.message).toMatch(/reserved/)
  })

  it('throws GissenValidationError when a number default is out of range', () => {
    const config = {
      components: {
        Hero: {
          fields: { level: { type: 'number', min: 1, max: 6 } },
          defaultProps: { level: 99 },
          render: mockRender,
        },
      },
    }
    let error: GissenValidationError | null = null
    try {
      validateConfig(config)
    }
    catch (e) {
      error = e as GissenValidationError
    }
    expect(error).toBeInstanceOf(GissenValidationError)
    expect(error!.message).toMatch(/Hero/)
    expect(error!.message).toMatch(/level/)
    expect(error!.message).toMatch(/99/)
    expect(error!.message).toMatch(/<= 6/)
  })

  // Regression pin: `NaN < min` and `NaN > max` are both `false`, so a naive
  // reuse of the min/max check alone would silently accept a non-finite
  // default — it must survive a round trip through JSON too, where
  // `NaN`/`Infinity` serialize to `null` and fail validateData downstream
  // with a confusing, config-blind error instead of this one.
  it('throws GissenValidationError when a number default is NaN', () => {
    const config = {
      components: {
        Hero: {
          fields: { rating: { type: 'number', min: 0, max: 5 } },
          defaultProps: { rating: Number.NaN },
          render: mockRender,
        },
      },
    }
    let error: GissenValidationError | null = null
    try {
      validateConfig(config)
    }
    catch (e) {
      error = e as GissenValidationError
    }
    expect(error).toBeInstanceOf(GissenValidationError)
    expect(error!.message).toMatch(/rating/)
    expect(error!.message).toMatch(/finite/)
  })

  it('throws GissenValidationError when a number default is Infinity', () => {
    const config = {
      components: {
        Hero: {
          fields: { rating: { type: 'number', min: 0, max: 5 } },
          defaultProps: { rating: Number.POSITIVE_INFINITY },
          render: mockRender,
        },
      },
    }
    expect(() => validateConfig(config)).toThrow(GissenValidationError)
  })

  it('throws GissenValidationError when a defaultProps value has the wrong JSON type', () => {
    const config = {
      components: {
        Bad: {
          fields: { title: { type: 'text' } },
          defaultProps: { title: 42 },
          render: mockRender,
        },
      },
    }
    const error = (() => {
      try {
        validateConfig(config)
        return null
      }
      catch (e) {
        return e as GissenValidationError
      }
    })()
    expect(error).toBeInstanceOf(GissenValidationError)
    expect(error!.message).toMatch(/title/)
    expect(error!.message).toMatch(/must be a string/)
  })

  it('throws GissenValidationError when a defaultProps key does not correspond to a declared field', () => {
    const config = {
      components: {
        Bad: {
          fields: { title: { type: 'text' } },
          defaultProps: { title: 'Hello', ghost: 'value' },
          render: mockRender,
        },
      },
    }
    let error: GissenValidationError | null = null
    try {
      validateConfig(config)
    }
    catch (e) {
      error = e as GissenValidationError
    }
    expect(error).toBeInstanceOf(GissenValidationError)
    expect(error!.message).toMatch(/ghost/)
    expect(error!.message).toMatch(/does not correspond to a declared field/)
  })

  it('throws GissenValidationError when a defaultProps value is a literal null', () => {
    const config = {
      components: {
        Bad: {
          fields: { title: { type: 'text' } },
          defaultProps: { title: null },
          render: mockRender,
        },
      },
    }
    let error: GissenValidationError | null = null
    try {
      validateConfig(config)
    }
    catch (e) {
      error = e as GissenValidationError
    }
    expect(error).toBeInstanceOf(GissenValidationError)
    expect(error!.message).toMatch(/title/)
    expect(error!.message).toMatch(/cannot be null/)
  })

  it('throws GissenValidationError when defaultProps sets the reserved "id" key', () => {
    const config = {
      components: {
        Bad: {
          fields: { title: { type: 'text' } },
          defaultProps: { title: 'Hello', id: 'hardcoded-id' },
          render: mockRender,
        },
      },
    }
    let error: GissenValidationError | null = null
    try {
      validateConfig(config)
    }
    catch (e) {
      error = e as GissenValidationError
    }
    expect(error).toBeInstanceOf(GissenValidationError)
    expect(error!.message).toMatch(/reserved/)
    expect(error!.message).toMatch(/defaultProps/)
  })

  it('does not validate defaultProps declared for slot fields (deferred, see AUDIT_BACKLOG.md)', () => {
    const config = {
      components: {
        Container: {
          fields: {
            children: { type: 'slot', allow: ['Text'] },
          },
          // Deliberately malformed: not even an array. Documents current,
          // intentionally-unvalidated behavior — not a desired outcome.
          defaultProps: { children: 'not-an-array' },
          render: mockRender,
        },
      },
    }
    expect(() => validateConfig(config)).not.toThrow()
  })

  it('accepts a config with valid defaults across every scalar field type', () => {
    const config = {
      components: {
        Full: {
          fields: {
            title: { type: 'text' },
            bio: { type: 'textarea', rows: 4 },
            count: { type: 'number', min: 0, max: 100 },
            active: { type: 'boolean' },
            size: { type: 'select', options: [{ label: 'S', value: 'small' }, { label: 'L', value: 'large' }] },
            items: { type: 'slot' },
          },
          defaultProps: {
            title: 'Hello',
            bio: 'A short bio',
            count: 42,
            active: true,
            size: 'small',
          },
          render: mockRender,
        },
      },
    }
    expect(() => validateConfig(config)).not.toThrow()
  })

  it('accepts a valid config with optional root config', () => {
    const config = {
      components: {},
      root: {
        fields: { background: { type: 'text' } },
        defaultProps: { background: '#fff' },
        render: mockRender,
      },
    }
    expect(() => validateConfig(config)).not.toThrow()
  })
})
