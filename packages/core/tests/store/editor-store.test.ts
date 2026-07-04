import type { Component } from 'vue'
import type { GissenConfig, GissenData } from '../../src/types'
import { describe, expect, it, vi } from 'vitest'
import { h, ref, shallowRef } from 'vue'
import { createEditorStore } from '../../src/composables/useEditorStore'

const Stub: Component = () => h('div')

const config: GissenConfig = {
  components: {
    Hero: {
      fields: { title: { type: 'text' } },
      defaultProps: { title: 'Hello' },
      render: Stub,
    },
    Container: {
      fields: { children: { type: 'slot' } },
      defaultProps: { children: [] },
      render: Stub,
    },
    // Regression: a slot component WITHOUT a defaultProps slot default.
    BareContainer: {
      fields: { children: { type: 'slot' } },
      render: Stub,
    },
    Text: {
      fields: { body: { type: 'text' } },
      defaultProps: { body: '' },
      render: Stub,
    },
    // A slot restricted to Text children via `allow`.
    TextOnlyContainer: {
      fields: { children: { type: 'slot', allow: ['Text'] } },
      render: Stub,
    },
  },
}

function emptyData(): GissenData {
  return { version: 1, root: { props: {} }, content: [] }
}

describe('createEditorStore', () => {
  describe('insertComponent', () => {
    it('inserts a component at top level', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('Hero', null, null, 0)
      expect(store.data.content).toHaveLength(1)
      expect(store.data.content[0].type).toBe('Hero')
    })

    it('inserts at the specified index', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('Hero', null, null, 0)
      store.insertComponent('Text', null, null, 0)
      expect(store.data.content[0].type).toBe('Text')
      expect(store.data.content[1].type).toBe('Hero')
    })

    it('inserts into a nested slot', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('Container', null, null, 0)
      const containerId = store.data.content[0].props.id
      store.insertComponent('Text', containerId, 'children', 0)
      const children = store.data.content[0].props.children as Array<{ type: string }>
      expect(children).toHaveLength(1)
      expect(children[0].type).toBe('Text')
    })

    it('gives each inserted component a unique id', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('Hero', null, null, 0)
      store.insertComponent('Hero', null, null, 1)
      const ids = store.data.content.map(c => c.props.id)
      expect(ids[0]).not.toBe(ids[1])
    })

    it('inserts into the slot of a container that has no defaultProps', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('BareContainer', null, null, 0)
      const containerId = store.data.content[0].props.id
      // Must not throw even though the config declared no `children` default.
      expect(() => store.insertComponent('Text', containerId, 'children', 0)).not.toThrow()
      const children = store.data.content[0].props.children as Array<{ type: string }>
      expect(children).toHaveLength(1)
      expect(children[0].type).toBe('Text')
    })

    it('throws for an unknown component type', () => {
      const store = createEditorStore(config, emptyData())
      expect(() => store.insertComponent('Unknown', null, null, 0)).toThrow()
    })

    it('throws when parentId not found', () => {
      const store = createEditorStore(config, emptyData())
      expect(() => store.insertComponent('Text', 'nonexistent', 'children', 0)).toThrow()
    })
  })

  describe('removeComponent', () => {
    it('removes from top level', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('Hero', null, null, 0)
      const id = store.data.content[0].props.id
      store.removeComponent(id)
      expect(store.data.content).toHaveLength(0)
    })

    it('removes from a nested slot', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('Container', null, null, 0)
      const containerId = store.data.content[0].props.id
      store.insertComponent('Text', containerId, 'children', 0)
      const textId = (store.data.content[0].props.children as Array<{ props: { id: string } }>)[0].props.id
      store.removeComponent(textId)
      expect((store.data.content[0].props.children as unknown[]).length).toBe(0)
    })

    it('clears selectedId when the selected component is removed', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('Hero', null, null, 0)
      const id = store.data.content[0].props.id
      store.selectComponent(id)
      expect(store.selectedId).toBe(id)
      store.removeComponent(id)
      expect(store.selectedId).toBeNull()
    })

    it('throws when the id is not found', () => {
      const store = createEditorStore(config, emptyData())
      expect(() => store.removeComponent('missing')).toThrow()
    })
  })

  describe('updateProp', () => {
    it('writes a value onto the resolved node', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('Hero', null, null, 0)
      const id = store.data.content[0].props.id
      store.updateProp(id, 'title', 'Changed')
      expect(store.data.content[0].props.title).toBe('Changed')
    })

    it('refuses to edit the reserved "id" prop (H-3)', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('Hero', null, null, 0)
      const id = store.data.content[0].props.id
      expect(() => store.updateProp(id, 'id', 'hijacked')).toThrow(/reserved/)
      // Identity must be intact.
      expect(store.data.content[0].props.id).toBe(id)
    })

    it('throws when the target id is not found', () => {
      const store = createEditorStore(config, emptyData())
      expect(() => store.updateProp('missing', 'title', 'x')).toThrow()
    })

    it('updates a prop on a nested slot child', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('Container', null, null, 0)
      const containerId = store.data.content[0].props.id
      store.insertComponent('Text', containerId, 'children', 0)
      const child = (store.data.content[0].props.children as Array<{ props: { id: string, body: string } }>)[0]
      store.updateProp(child.props.id, 'body', 'nested value')
      const after = (store.data.content[0].props.children as Array<{ props: { body: string } }>)[0]
      expect(after.props.body).toBe('nested value')
    })

    it('reassigns a fresh top-level data object so update:data fires', () => {
      const dataRef = ref<GissenData>(emptyData())
      const store = createEditorStore(config, dataRef)
      store.insertComponent('Hero', null, null, 0)
      const before = dataRef.value
      store.updateProp(dataRef.value.content[0].props.id, 'title', 'Changed')
      expect(dataRef.value).not.toBe(before)
      expect(dataRef.value.content[0].props.title).toBe('Changed')
    })
  })

  describe('selectComponent', () => {
    it('sets selectedId', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('Hero', null, null, 0)
      const id = store.data.content[0].props.id
      store.selectComponent(id)
      expect(store.selectedId).toBe(id)
    })

    it('clears selectedId when null is passed', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('Hero', null, null, 0)
      store.selectComponent(store.data.content[0].props.id)
      store.selectComponent(null)
      expect(store.selectedId).toBeNull()
    })
  })

  describe('v-model propagation (fresh top-level reference)', () => {
    it('reassigns a new data object on insert so update:data fires', () => {
      const dataRef = ref<GissenData>(emptyData())
      const before = dataRef.value
      const store = createEditorStore(config, dataRef)
      store.insertComponent('Hero', null, null, 0)
      expect(dataRef.value).not.toBe(before)
      expect(dataRef.value.content).toHaveLength(1)
    })

    it('reassigns a new data object on remove', () => {
      const dataRef = ref<GissenData>(emptyData())
      const store = createEditorStore(config, dataRef)
      store.insertComponent('Hero', null, null, 0)
      const afterInsert = dataRef.value
      const id = dataRef.value.content[0].props.id
      store.removeComponent(id)
      expect(dataRef.value).not.toBe(afterInsert)
    })

    it('reassigns a new data object on move', () => {
      const dataRef = ref<GissenData>(emptyData())
      const store = createEditorStore(config, dataRef)
      store.insertComponent('Hero', null, null, 0)
      store.insertComponent('Text', null, null, 1)
      const afterInserts = dataRef.value
      store.moveComponent(dataRef.value.content[0].props.id, null, null, 2)
      expect(dataRef.value).not.toBe(afterInserts)
    })
  })

  describe('deep-reactivity dev guard (M-2/M-3)', () => {
    it('warns when the bound data is not deeply reactive (shallowRef)', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      createEditorStore(config, shallowRef(emptyData()))
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('not deeply reactive'))
      warn.mockRestore()
    })

    it('does not warn for a deeply reactive ref', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      createEditorStore(config, ref(emptyData()))
      expect(warn).not.toHaveBeenCalled()
      warn.mockRestore()
    })

    it('does not warn for a plain object (wrapped in a reactive ref internally)', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      createEditorStore(config, emptyData())
      expect(warn).not.toHaveBeenCalled()
      warn.mockRestore()
    })
  })

  describe('reactive config', () => {
    it('reflects a config provided as a getter', () => {
      let current = config
      const store = createEditorStore(() => current, emptyData())
      expect(store.config).toBe(config)
      const replacement: GissenConfig = { components: {} }
      current = replacement
      expect(store.config).toBe(replacement)
    })
  })

  describe('slot allow enforcement', () => {
    it('inserts an allowed type into a restricted slot', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('TextOnlyContainer', null, null, 0)
      const containerId = store.data.content[0].props.id
      store.insertComponent('Text', containerId, 'children', 0)
      const children = store.data.content[0].props.children as Array<{ type: string }>
      expect(children).toHaveLength(1)
      expect(children[0].type).toBe('Text')
    })

    it('rejects inserting a disallowed type into a restricted slot', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('TextOnlyContainer', null, null, 0)
      const containerId = store.data.content[0].props.id
      expect(() => store.insertComponent('Hero', containerId, 'children', 0))
        .toThrow(/not allowed in slot "children"/)
      expect((store.data.content[0].props.children as unknown[])).toHaveLength(0)
    })

    it('rejects moving a disallowed component into a restricted slot and leaves the tree untouched', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('TextOnlyContainer', null, null, 0)
      store.insertComponent('Hero', null, null, 1)
      const containerId = store.data.content[0].props.id
      const heroId = store.data.content[1].props.id
      expect(() => store.moveComponent(heroId, containerId, 'children', 0))
        .toThrow(/not allowed in slot "children"/)
      // The Hero must still be at its original top-level position.
      expect(store.data.content).toHaveLength(2)
      expect(store.data.content[1].props.id).toBe(heroId)
      expect((store.data.content[0].props.children as unknown[])).toHaveLength(0)
    })

    it('moves an allowed component into a restricted slot', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('TextOnlyContainer', null, null, 0)
      store.insertComponent('Text', null, null, 1)
      const containerId = store.data.content[0].props.id
      const textId = store.data.content[1].props.id
      store.moveComponent(textId, containerId, 'children', 0)
      expect(store.data.content).toHaveLength(1)
      const children = store.data.content[0].props.children as Array<{ props: { id: string } }>
      expect(children[0].props.id).toBe(textId)
    })

    it('leaves unrestricted slots permissive', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('Container', null, null, 0)
      const containerId = store.data.content[0].props.id
      expect(() => store.insertComponent('Hero', containerId, 'children', 0)).not.toThrow()
    })
  })

  describe('slot normalization (data acceptance)', () => {
    // A hand-authored document that omits the Container's `children` slot key —
    // valid data (absent props are tolerated), but store ops assume an array.
    function slotlessData(): GissenData {
      return {
        version: 1,
        root: { props: {} },
        content: [{ type: 'Container', props: { id: 'c-1' } }],
      }
    }

    it('initializes a missing slot prop to [] at store creation', () => {
      const store = createEditorStore(config, slotlessData())
      expect(store.data.content[0].props.children).toEqual([])
    })

    it('accepts a drop (insert) into a slot that was missing from the document', () => {
      const store = createEditorStore(config, slotlessData())
      store.insertComponent('Text', 'c-1', 'children', 0)
      const children = store.data.content[0].props.children as Array<{ type: string }>
      expect(children).toHaveLength(1)
      expect(children[0].type).toBe('Text')
    })

    it('accepts a move into a slot that was missing from the document', () => {
      const store = createEditorStore(config, {
        version: 1,
        root: { props: {} },
        content: [
          { type: 'Container', props: { id: 'c-1' } },
          { type: 'Text', props: { id: 't-1', body: 'x' } },
        ],
      })
      store.moveComponent('t-1', 'c-1', 'children', 0)
      const children = store.data.content[0].props.children as Array<{ props: { id: string } }>
      expect(store.data.content).toHaveLength(1)
      expect(children[0].props.id).toBe('t-1')
    })

    it('normalizes nested slot-less components', () => {
      const store = createEditorStore(config, {
        version: 1,
        root: { props: {} },
        content: [{
          type: 'Container',
          props: { id: 'outer', children: [{ type: 'Container', props: { id: 'inner' } }] },
        }],
      })
      store.insertComponent('Text', 'inner', 'children', 0)
      const outer = store.data.content[0].props.children as Array<{ props: { id: string, children: unknown[] } }>
      expect(outer[0].props.children).toHaveLength(1)
    })

    it('normalizes a document replaced through the store', () => {
      const store = createEditorStore(config, emptyData())
      store.data = slotlessData()
      expect(store.data.content[0].props.children).toEqual([])
      expect(() => store.insertComponent('Text', 'c-1', 'children', 0)).not.toThrow()
    })

    it('does not clobber existing slot content', () => {
      const store = createEditorStore(config, {
        version: 1,
        root: { props: {} },
        content: [{
          type: 'Container',
          props: { id: 'c-1', children: [{ type: 'Text', props: { id: 't-1', body: 'kept' } }] },
        }],
      })
      const children = store.data.content[0].props.children as Array<{ props: { body: string } }>
      expect(children).toHaveLength(1)
      expect(children[0].props.body).toBe('kept')
    })

    it('leaves unknown component types untouched', () => {
      // No config entry — validation reports it; normalization invents nothing.
      const store = createEditorStore(config, {
        version: 1,
        root: { props: {} },
        content: [{ type: 'Mystery', props: { id: 'm-1' } }],
      })
      expect('children' in store.data.content[0].props).toBe(false)
    })
  })

  describe('moveComponent', () => {
    it('moves a component within the top-level list', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('Hero', null, null, 0)
      store.insertComponent('Text', null, null, 1)
      const heroId = store.data.content[0].props.id
      // Move Hero from index 0 to index 1 (after Text)
      store.moveComponent(heroId, null, null, 2)
      expect(store.data.content[0].type).toBe('Text')
      expect(store.data.content[1].type).toBe('Hero')
    })

    it('moves a component from top level into a slot', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('Container', null, null, 0)
      store.insertComponent('Text', null, null, 1)
      const containerId = store.data.content[0].props.id
      const textId = store.data.content[1].props.id
      store.moveComponent(textId, containerId, 'children', 0)
      expect(store.data.content).toHaveLength(1)
      const children = store.data.content[0].props.children as Array<{ type: string }>
      expect(children).toHaveLength(1)
      expect(children[0].type).toBe('Text')
    })

    it('moves a component from a slot back to top level', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('Container', null, null, 0)
      const containerId = store.data.content[0].props.id
      store.insertComponent('Text', containerId, 'children', 0)
      const textId = (store.data.content[0].props.children as Array<{ props: { id: string } }>)[0].props.id
      store.moveComponent(textId, null, null, 1)
      expect(store.data.content).toHaveLength(2)
      expect(store.data.content[1].type).toBe('Text')
    })

    it('throws when moving a component into itself', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('Container', null, null, 0)
      const containerId = store.data.content[0].props.id
      expect(() => store.moveComponent(containerId, containerId, 'children', 0)).toThrow()
    })

    it('throws when moving a component into its own descendant', () => {
      const store = createEditorStore(config, emptyData())
      store.insertComponent('Container', null, null, 0)
      const outerContainerId = store.data.content[0].props.id
      store.insertComponent('Container', outerContainerId, 'children', 0)
      const innerContainerId = (store.data.content[0].props.children as Array<{ props: { id: string } }>)[0].props.id
      expect(() => store.moveComponent(outerContainerId, innerContainerId, 'children', 0)).toThrow()
    })

    it('throws when the component is not found', () => {
      const store = createEditorStore(config, emptyData())
      expect(() => store.moveComponent('nonexistent', null, null, 0)).toThrow()
    })
  })
})
