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
    expect(() => validateConfig(config)).toThrow(GissenValidationError)
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
