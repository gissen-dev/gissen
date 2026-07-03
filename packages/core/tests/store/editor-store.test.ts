import type { Component } from 'vue'
import type { GissenConfig, GissenData } from '../../src/types'
import { describe, expect, it } from 'vitest'
import { h, ref } from 'vue'
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
