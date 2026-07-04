import type { Component } from 'vue'
import type { GissenConfig, GissenData } from '../../src/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import EditorPanel from '../../src/components/editor/EditorPanel.vue'
import { createEditorStore, provideEditorStore } from '../../src/composables/useEditorStore'

const Stub: Component = () => h('div')

const config: GissenConfig = {
  components: {
    Hero: {
      fields: { title: { type: 'text' } },
      render: Stub,
    },
    // A component with only a slot field — the panel has nothing to edit.
    Container: {
      fields: { children: { type: 'slot' } },
      render: Stub,
    },
  },
}

function twoHeroes(): GissenData {
  return {
    version: 1,
    root: { props: {} },
    content: [
      { type: 'Hero', props: { id: 'a', title: 'AAA' } },
      { type: 'Hero', props: { id: 'b', title: 'BBB' } },
    ],
  }
}

function mountPanel(store = createEditorStore(config, twoHeroes())) {
  const Wrapper = defineComponent({
    setup() { provideEditorStore(store) },
    render() { return h(EditorPanel) },
  })
  const wrapper = mount(Wrapper, { attachTo: document.body })
  return { wrapper, store }
}

describe('editorPanel', () => {
  it('shows the empty prompt when nothing is selected', () => {
    const { wrapper } = mountPanel()
    expect(wrapper.find('.gissen-panel__empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('Select a component')
  })

  it('renders a field editor for the selected component', async () => {
    const { wrapper, store } = mountPanel()
    store.selectComponent('a')
    await nextTick()
    const input = wrapper.find('.gissen-panel input')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('AAA')
  })

  it('shows the "no editable properties" state for a slot-only component', async () => {
    const store = createEditorStore(config, {
      version: 1,
      root: { props: {} },
      content: [{ type: 'Container', props: { id: 'c', children: [] } }],
    })
    const { wrapper } = mountPanel(store)
    store.selectComponent('c')
    await nextTick()
    expect(wrapper.text()).toContain('no editable properties')
  })

  it('does not leak values across selection: A → edit → B → re-select A', async () => {
    const { wrapper, store } = mountPanel()

    // Select A: panel shows A's value.
    store.selectComponent('a')
    await nextTick()
    let input = wrapper.find('.gissen-panel input')
    expect((input.element as HTMLInputElement).value).toBe('AAA')

    // Edit A.
    await input.setValue('A-edited')
    expect(store.data.content[0].props.title).toBe('A-edited')

    // Select B: panel must show B's own value, not A's edited value.
    store.selectComponent('b')
    await nextTick()
    input = wrapper.find('.gissen-panel input')
    expect((input.element as HTMLInputElement).value).toBe('BBB')

    // Edit B.
    await input.setValue('B-edited')
    expect(store.data.content[1].props.title).toBe('B-edited')

    // Re-select A: the panel shows A's edited value, and B is untouched.
    store.selectComponent('a')
    await nextTick()
    input = wrapper.find('.gissen-panel input')
    expect((input.element as HTMLInputElement).value).toBe('A-edited')
    expect(store.data.content[0].props.title).toBe('A-edited')
    expect(store.data.content[1].props.title).toBe('B-edited')
  })
})
