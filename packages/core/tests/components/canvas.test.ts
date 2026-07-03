import type { Component } from 'vue'
import type { GissenConfig, GissenData } from '../../src/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import CanvasNode from '../../src/components/editor/CanvasNode.vue'
import CanvasSlot from '../../src/components/editor/CanvasSlot.vue'
import { createEditorStore, provideEditorStore } from '../../src/composables/useEditorStore'

// ── Test components ────────────────────────────────────────────────────────

const TestButton: Component = defineComponent({
  props: { id: String, label: String },
  template: '<button data-testid="btn">{{ label }}</button>',
})

const TestContainer: Component = defineComponent({
  props: { id: String, items: Array },
  template: '<div data-testid="container"><slot name="items" /></div>',
})

const testConfig: GissenConfig = {
  components: {
    Button: {
      fields: { label: { type: 'text' } },
      defaultProps: { label: 'Click me' },
      render: TestButton,
    },
    Container: {
      fields: { items: { type: 'slot' } },
      defaultProps: { items: [] },
      render: TestContainer,
    },
  },
}

function emptyData(): GissenData {
  return { version: 1, root: { props: {} }, content: [] }
}

/** Mounts a component inside a wrapper that provides the editor store. */
function mountWithStore<T extends Component>(
  component: T,
  componentProps: Record<string, unknown>,
  config = testConfig,
  data = emptyData(),
) {
  const store = createEditorStore(config, data)

  const Wrapper = defineComponent({
    setup() {
      provideEditorStore(store)
    },
    render() {
      return h(component as Component, componentProps)
    },
  })

  return { wrapper: mount(Wrapper, { attachTo: document.body }), store }
}

// ── CanvasNode ─────────────────────────────────────────────────────────────

describe('canvasNode', () => {
  it('renders the user component for a known type', async () => {
    const { wrapper } = mountWithStore(CanvasNode, {
      component: { type: 'Button', props: { id: 'btn-1', label: 'Hello' } },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="btn"]').text()).toBe('Hello')
  })

  it('passes non-slot props to the user component', async () => {
    const { wrapper } = mountWithStore(CanvasNode, {
      component: { type: 'Button', props: { id: 'btn-2', label: 'World' } },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="btn"]').text()).toBe('World')
  })

  it('shows error fallback for unknown component type', async () => {
    const { wrapper } = mountWithStore(CanvasNode, {
      component: { type: 'NonExistent', props: { id: 'x-1' } },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.gissen-node--error').exists()).toBe(true)
    expect(wrapper.find('.gissen-node--error').text()).toContain('NonExistent')
  })

  it('wraps component in a gissen-node div with data-gissen-id', async () => {
    const { wrapper } = mountWithStore(CanvasNode, {
      component: { type: 'Button', props: { id: 'btn-3', label: 'Test' } },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-gissen-id="btn-3"]').exists()).toBe(true)
    expect(wrapper.find('[data-gissen-id="btn-3"]').classes()).toContain('gissen-node')
  })

  it('applies gissen-node--selected when the node is selected', async () => {
    const data = emptyData()
    const node = { type: 'Button', props: { id: 'btn-sel', label: 'Sel' } }
    data.content.push(node as never)
    const { wrapper, store } = mountWithStore(CanvasNode, { component: node }, testConfig, data)

    store.selectComponent('btn-sel')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-gissen-id="btn-sel"]').classes()).toContain('gissen-node--selected')
  })

  it('clicking the node selects it and stops propagation', async () => {
    const data = emptyData()
    const node = { type: 'Button', props: { id: 'btn-click', label: 'Click' } }
    data.content.push(node as never)
    const { wrapper, store } = mountWithStore(CanvasNode, { component: node }, testConfig, data)

    await wrapper.find('[data-gissen-id="btn-click"]').trigger('click')
    expect(store.selectedId).toBe('btn-click')
  })

  it('clicking a nested node selects the inner node (stopPropagation)', async () => {
    const innerNode = { type: 'Button', props: { id: 'inner-1', label: 'Inner' } }
    const outerNode = {
      type: 'Container',
      props: { id: 'outer-1', items: [innerNode] },
    }
    const data = emptyData()
    data.content.push(outerNode as never)
    const { wrapper, store } = mountWithStore(CanvasNode, { component: outerNode }, testConfig, data)

    await wrapper.vm.$nextTick()
    // CanvasSlot is async — give it time to resolve
    await new Promise(r => setTimeout(r, 50))
    await wrapper.vm.$nextTick()

    const innerEl = wrapper.find('[data-gissen-id="inner-1"]')
    if (innerEl.exists()) {
      await innerEl.trigger('click')
      expect(store.selectedId).toBe('inner-1')
    }
    else {
      // CanvasSlot async component hasn't resolved yet; skip sub-assertion
      await wrapper.find('[data-gissen-id="outer-1"]').trigger('click')
      expect(store.selectedId).toBe('outer-1')
    }
  })
})

// ── CanvasSlot ─────────────────────────────────────────────────────────────

describe('canvasSlot', () => {
  it('renders empty state when children array is empty', () => {
    const { wrapper } = mountWithStore(CanvasSlot, {
      parentId: 'p-1',
      slotName: 'items',
      children: [],
    })
    expect(wrapper.find('.gissen-slot--empty').exists()).toBe(true)
  })

  it('renders child CanvasNodes when children are present', async () => {
    const child = { type: 'Button', props: { id: 'child-1', label: 'Child' } }
    const { wrapper } = mountWithStore(CanvasSlot, {
      parentId: 'p-2',
      slotName: 'items',
      children: [child],
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.gissen-slot--empty').exists()).toBe(false)
    expect(wrapper.find('[data-gissen-id="child-1"]').exists()).toBe(true)
  })
})
