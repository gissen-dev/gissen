import type { Component } from 'vue'
import type { EditorStore } from '../../src/composables/useEditorStore'
import type { GissenConfig, GissenData } from '../../src/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import EditorToolbar from '../../src/components/editor/EditorToolbar.vue'
import { createEditorStore, provideEditorStore } from '../../src/composables/useEditorStore'

const Stub: Component = () => h('div')

const config: GissenConfig = {
  components: {
    Hero: {
      fields: { title: { type: 'text' } },
      defaultProps: { title: 'Hello' },
      render: Stub,
    },
  },
}

function emptyData(): GissenData {
  return { version: 1, root: { props: {} }, content: [] }
}

function mountToolbar(store: EditorStore = createEditorStore(config, emptyData())) {
  const Wrapper = defineComponent({
    setup() { provideEditorStore(store) },
    render() { return h(EditorToolbar) },
  })
  const wrapper = mount(Wrapper, { attachTo: document.body })
  return {
    wrapper,
    store,
    undoButton: wrapper.get('[aria-label="Undo"]'),
    redoButton: wrapper.get('[aria-label="Redo"]'),
  }
}

describe('editorToolbar', () => {
  it('renders an accessible toolbar with shortcut tooltips', () => {
    const { wrapper, undoButton, redoButton } = mountToolbar()
    expect(wrapper.find('[role="toolbar"]').exists()).toBe(true)
    // jsdom is not an Apple platform, so the Ctrl labels apply.
    expect(undoButton.attributes('title')).toBe('Undo (Ctrl+Z)')
    expect(redoButton.attributes('title')).toBe('Redo (Ctrl+Shift+Z)')
  })

  it('disables undo/redo on the baseline document', () => {
    const { undoButton, redoButton } = mountToolbar()
    expect(undoButton.attributes('disabled')).toBeDefined()
    expect(redoButton.attributes('disabled')).toBeDefined()
  })

  it('tracks canUndo/canRedo reactively', async () => {
    const { store, undoButton, redoButton } = mountToolbar()

    store.insertComponent('Hero', null, null, 0)
    await nextTick()
    expect(undoButton.attributes('disabled')).toBeUndefined()
    expect(redoButton.attributes('disabled')).toBeDefined()

    store.undo()
    await nextTick()
    expect(undoButton.attributes('disabled')).toBeDefined()
    expect(redoButton.attributes('disabled')).toBeUndefined()
  })

  it('undo and redo buttons drive document history', async () => {
    const { store, undoButton, redoButton } = mountToolbar()
    store.insertComponent('Hero', null, null, 0)
    await nextTick()

    await undoButton.trigger('click')
    expect(store.data.content).toHaveLength(0)

    await redoButton.trigger('click')
    expect(store.data.content).toHaveLength(1)
  })

  it('renders the viewport switcher with desktop active by default', () => {
    const { wrapper } = mountToolbar()
    const items = wrapper.findAll('.gissen-toolbar__toggle')
    expect(items).toHaveLength(3)
    expect(wrapper.get('[aria-label="Desktop preview"]').attributes('data-state')).toBe('on')
    expect(wrapper.get('[aria-label="Tablet preview"]').attributes('data-state')).toBe('off')
  })

  it('switches the store viewport and never deselects to nothing', async () => {
    const { wrapper, store } = mountToolbar()
    const tablet = wrapper.get('[aria-label="Tablet preview"]')

    await tablet.trigger('click')
    expect(store.viewport).toBe('tablet')
    expect(tablet.attributes('data-state')).toBe('on')

    // Clicking the active preset again must not clear the selection.
    await tablet.trigger('click')
    expect(store.viewport).toBe('tablet')

    await wrapper.get('[aria-label="Mobile preview"]').trigger('click')
    expect(store.viewport).toBe('mobile')
  })
})
