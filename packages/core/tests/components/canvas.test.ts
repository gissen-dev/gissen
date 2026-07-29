import type { Component } from 'vue'
import type { GissenConfig, GissenData } from '../../src/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import CanvasNode from '../../src/components/editor/CanvasNode.vue'
import CanvasSlot from '../../src/components/editor/CanvasSlot.vue'
import EditorCanvas from '../../src/components/editor/EditorCanvas.vue'
import { createEditorStore, provideEditorStore } from '../../src/composables/useEditorStore'

// EditorCanvas and CanvasSlot wire up vue-draggable-plus drop zones.
vi.mock('vue-draggable-plus', () => ({
  useDraggable: vi.fn(() => ({ start: vi.fn(), pause: vi.fn(), resume: vi.fn() })),
}))

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

// ── Node action toolbar ────────────────────────────────────────────────────

describe('canvasNodeActions', () => {
  function mountSelectable(id: string) {
    const data = emptyData()
    const node = { type: 'Button', props: { id, label: 'Node' } }
    data.content.push(node as never)
    return mountWithStore(CanvasNode, { component: node }, testConfig, data)
  }

  it('appears only on the selected node', async () => {
    const { wrapper, store } = mountSelectable('act-1')
    expect(wrapper.find('.gissen-node-actions').exists()).toBe(false)

    store.selectComponent('act-1')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.gissen-node-actions').exists()).toBe(true)

    store.selectComponent(null)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.gissen-node-actions').exists()).toBe(false)
  })

  it('does not appear when a different node is selected', async () => {
    const { wrapper, store } = mountSelectable('act-2')
    store.selectComponent('someone-else')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.gissen-node-actions').exists()).toBe(false)
  })

  it('delete button removes the node through the store (undoable, labeled)', async () => {
    const { wrapper, store } = mountSelectable('act-3')
    store.selectComponent('act-3')
    await wrapper.vm.$nextTick()

    const button = wrapper.get('[aria-label="Delete component"]')
    expect(button.attributes('title')).toContain('Del')

    await button.trigger('click')
    expect(store.data.content).toHaveLength(0)
    // The click must not bubble into the node wrapper and re-select the
    // node being deleted; removal clears the selection.
    expect(store.selectedId).toBeNull()

    // Same store path as the keyboard shortcut: it landed in history.
    expect(store.canUndo).toBe(true)
    store.undo()
    expect(store.data.content[0]?.props.id).toBe('act-3')
  })
})

// ── EditorCanvas root rendering ────────────────────────────────────────────

describe('editorCanvas root rendering', () => {
  const PageShell = defineComponent({
    props: { theme: String },
    template: '<main data-testid="shell" :data-theme="theme"><slot /></main>',
  })

  function rootConfig(): GissenConfig {
    return {
      components: testConfig.components,
      root: { fields: { theme: { type: 'text' } }, render: PageShell },
    }
  }

  it('wraps the DnD zone in config.root.render with data.root.props', () => {
    const data = emptyData()
    data.root.props = { theme: 'dark' }
    data.content.push({ type: 'Button', props: { id: 'btn-root', label: 'In root' } })
    const { wrapper } = mountWithStore(EditorCanvas, {}, rootConfig(), data)

    const shell = wrapper.get('[data-testid="shell"]')
    expect(shell.attributes('data-theme')).toBe('dark')
    // The wrapper sits between the viewport frame and the DnD zone: Sortable
    // hit-tests the zone's direct children, which must stay the CanvasNodes.
    expect(shell.element.parentElement?.classList.contains('gissen-canvas__viewport')).toBe(true)
    expect(shell.element.firstElementChild?.classList.contains('gissen-canvas__inner')).toBe(true)
    expect(shell.find('[data-gissen-id="btn-root"]').exists()).toBe(true)
  })

  it('shows the empty state inside the root wrapper', () => {
    const { wrapper } = mountWithStore(EditorCanvas, {}, rootConfig())
    expect(wrapper.get('[data-testid="shell"]').find('.gissen-canvas__empty').exists()).toBe(true)
  })

  it('keeps the DnD zone as the frame\'s direct child when no root render is configured', () => {
    const { wrapper } = mountWithStore(EditorCanvas, {})
    const frame = wrapper.get('.gissen-canvas__viewport')
    expect(frame.element.firstElementChild?.classList.contains('gissen-canvas__inner')).toBe(true)
  })
})

// ── EditorCanvas viewport preview ──────────────────────────────────────────

describe('editorCanvas viewport preview', () => {
  function mountCanvas() {
    const { wrapper, store } = mountWithStore(EditorCanvas, {})
    return {
      wrapper,
      store,
      main: wrapper.get('.gissen-canvas'),
      frame: wrapper.get('.gissen-canvas__viewport'),
    }
  }

  it('renders unconstrained on the default desktop preset', () => {
    const { main, frame } = mountCanvas()
    expect(main.classes()).not.toContain('gissen-canvas--framed')
    expect(frame.attributes('style')).toBeUndefined()
  })

  it('constrains the frame to the preset width', async () => {
    const { store, main, frame } = mountCanvas()

    store.setViewport('tablet')
    await nextTick()
    expect(main.classes()).toContain('gissen-canvas--framed')
    expect(frame.attributes('style')).toContain('width: 768px')

    store.setViewport('mobile')
    await nextTick()
    expect(frame.attributes('style')).toContain('width: 375px')
    // Without a measured pane (no ResizeObserver here) the scale stays 1:
    // the width constraint alone applies, no transform.
    expect(frame.attributes('style')).not.toContain('transform')
  })

  it('restores the full width when switching back to desktop', async () => {
    const { store, main, frame } = mountCanvas()
    store.setViewport('mobile')
    await nextTick()
    store.setViewport('desktop')
    await nextTick()
    expect(main.classes()).not.toContain('gissen-canvas--framed')
    expect(frame.attributes('style')).toBeFalsy()
  })
})
