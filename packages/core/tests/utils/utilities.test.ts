import type { GissenConfig } from '../../src'
import { describe, expect, it } from 'vitest'
import { createComponent, createEmptyData, ensureId, generateId } from '../../src'

function mockRender() {}

const config: GissenConfig = {
  components: {
    Hero: {
      fields: {
        title: { type: 'text' },
        count: { type: 'number' },
      },
      defaultProps: { title: 'Default Title', count: 0 },
      render: mockRender,
    },
    Empty: {
      fields: {},
      render: mockRender,
    },
    // A container whose slot field has NO default — the regression case.
    Container: {
      fields: {
        children: { type: 'slot' },
      },
      render: mockRender,
    },
    // A container with two slots, one of which has an explicit default.
    TwoSlot: {
      fields: {
        header: { type: 'slot' },
        body: { type: 'slot' },
      },
      defaultProps: {
        body: [{ type: 'Empty', props: { id: 'preset' } }],
      },
      render: mockRender,
    },
    // A container whose defaultProps declare a child with a HARDCODED id.
    Hardcoded: {
      fields: {
        children: { type: 'slot' },
      },
      defaultProps: {
        children: [{ type: 'Empty', props: { id: 'fixed-card' } }],
      },
      render: mockRender,
    },
    // A container whose defaultProps declare children WITHOUT ids.
    Seeded: {
      fields: {
        children: { type: 'slot' },
      },
      defaultProps: {
        // Intentionally id-less children to exercise createComponent's ensureId.
        children: [
          { type: 'Empty', props: {} as never },
          { type: 'Empty', props: { children: [{ type: 'Empty', props: {} as never }] } as never },
        ],
      },
      render: mockRender,
    },
  },
}

describe('generateId', () => {
  it('returns a string of length 10', () => {
    expect(generateId()).toHaveLength(10)
  })

  it('returns unique values on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

describe('ensureId', () => {
  it('returns the component unchanged when id is already set', () => {
    const component = { type: 'Hero', props: { id: 'existing-id', title: 'Hi' } }
    const result = ensureId(component)
    expect(result.props.id).toBe('existing-id')
    expect(result).toBe(component)
  })

  it('fills in a generated id when id is missing', () => {
    const component = { type: 'Hero', props: { id: '', title: 'Hi' } }
    const result = ensureId(component)
    expect(result.props.id).toHaveLength(10)
    expect(result).not.toBe(component)
  })

  it('preserves all other props', () => {
    const component = { type: 'Hero', props: { id: '', title: 'Hello', count: 5 } }
    const result = ensureId(component)
    expect(result.props.title).toBe('Hello')
    expect(result.props.count).toBe(5)
  })

  it('fills ids on nested slot children recursively', () => {
    const tree = {
      type: 'Container',
      props: {
        id: '',
        children: [
          { type: 'Text', props: { id: '', body: 'a' } },
          {
            type: 'Container',
            props: {
              id: 'inner-has-id',
              children: [{ type: 'Text', props: { id: '', body: 'deep' } }],
            },
          },
        ],
      },
    }
    const result = ensureId(tree)
    const children = result.props.children as Array<{ props: { id: string, children?: Array<{ props: { id: string } }> } }>
    expect(result.props.id).toHaveLength(10)
    expect(children[0].props.id).toHaveLength(10)
    expect(children[1].props.id).toBe('inner-has-id')
    expect(children[1].props.children![0].props.id).toHaveLength(10)
  })

  it('returns the same reference when the whole subtree already has ids', () => {
    const tree = {
      type: 'Container',
      props: {
        id: 'root',
        children: [{ type: 'Text', props: { id: 'child', body: 'a' } }],
      },
    }
    const result = ensureId(tree)
    expect(result).toBe(tree)
  })

  it('returns a new object but leaves untouched children by reference', () => {
    const okChild = { type: 'Text', props: { id: 'ok', body: 'a' } }
    const tree = {
      type: 'Container',
      props: {
        id: '', // missing → forces a new root
        children: [okChild],
      },
    }
    const result = ensureId(tree)
    expect(result).not.toBe(tree)
    const children = result.props.children as unknown[]
    // The child already had an id, so it is reused, not cloned.
    expect(children[0]).toBe(okChild)
  })
})

describe('createEmptyData', () => {
  it('returns an empty root with no content', () => {
    const data = createEmptyData()
    expect(data.root.props).toEqual({})
    expect(data.content).toEqual([])
  })

  it('returns a fresh object on each call', () => {
    const a = createEmptyData()
    const b = createEmptyData()
    expect(a).not.toBe(b)
  })

  it('applies root.defaultProps when a config is given', () => {
    const rootConfig: GissenConfig = {
      components: {},
      root: {
        fields: { background: { type: 'text' } },
        defaultProps: { background: '#fff' },
      },
    }
    const data = createEmptyData(rootConfig)
    expect(data.root.props).toEqual({ background: '#fff' })
  })

  it('clones root.defaultProps so documents never share objects with the config', () => {
    const defaults = { palette: { primary: '#111' } }
    const rootConfig: GissenConfig = {
      components: {},
      root: { defaultProps: defaults },
    }
    const data = createEmptyData(rootConfig)
    expect(data.root.props.palette).toEqual(defaults.palette)
    expect(data.root.props.palette).not.toBe(defaults.palette)
  })

  it('returns empty root props for a config without root defaults', () => {
    const data = createEmptyData({ components: {} })
    expect(data.root.props).toEqual({})
  })
})

describe('createComponent', () => {
  it('creates a component with defaultProps and a generated id', () => {
    const component = createComponent('Hero', config)
    expect(component.type).toBe('Hero')
    expect(component.props.title).toBe('Default Title')
    expect(component.props.count).toBe(0)
    expect(typeof component.props.id).toBe('string')
    expect((component.props.id as string).length).toBe(10)
  })

  it('creates a component with only an id when no defaultProps are defined', () => {
    const component = createComponent('Empty', config)
    expect(component.type).toBe('Empty')
    expect(typeof component.props.id).toBe('string')
  })

  it('throws when the component type is not registered', () => {
    expect(() => createComponent('Unknown', config)).toThrow('not registered in config')
  })

  it('generates a unique id on each call', () => {
    const a = createComponent('Hero', config)
    const b = createComponent('Hero', config)
    expect(a.props.id).not.toBe(b.props.id)
  })

  it('initializes a slot field to [] when no default is given', () => {
    const component = createComponent('Container', config)
    expect(Array.isArray(component.props.children)).toBe(true)
    expect(component.props.children).toEqual([])
  })

  it('gives each instance its own slot array (not shared)', () => {
    const a = createComponent('Container', config)
    const b = createComponent('Container', config)
    expect(a.props.children).not.toBe(b.props.children)
  })

  it('keeps an explicit slot default over the auto-initialized []', () => {
    const component = createComponent('TwoSlot', config)
    // header has no default → auto-initialized empty
    expect(component.props.header).toEqual([])
    // body has an explicit default → preserved
    expect((component.props.body as Array<{ type: string }>)[0].type).toBe('Empty')
  })

  it('assigns ids to id-less children declared in defaultProps (recursively)', () => {
    const component = createComponent('Seeded', config)
    const children = component.props.children as Array<{ props: { id: string, children?: Array<{ props: { id: string } }> } }>
    expect(children[0].props.id).toHaveLength(10)
    expect(children[1].props.id).toHaveLength(10)
    expect(children[1].props.children![0].props.id).toHaveLength(10)
  })

  it('regenerates hardcoded child ids so repeated instances do not collide', () => {
    const a = createComponent('Hardcoded', config)
    const b = createComponent('Hardcoded', config)
    const aChild = (a.props.children as Array<{ props: { id: string } }>)[0]
    const bChild = (b.props.children as Array<{ props: { id: string } }>)[0]
    // The literal 'fixed-card' must not survive — each instance gets a fresh id.
    expect(aChild.props.id).not.toBe('fixed-card')
    expect(aChild.props.id).toHaveLength(10)
    expect(aChild.props.id).not.toBe(bChild.props.id)
  })
})
