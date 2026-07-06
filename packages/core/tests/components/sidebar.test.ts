import type { Component } from 'vue'
import type { GissenConfig, GissenData } from '../../src/types'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import EditorSidebar from '../../src/components/editor/EditorSidebar.vue'
import { createEditorStore, provideEditorStore } from '../../src/composables/useEditorStore'

vi.mock('vue-draggable-plus', () => ({
  useDraggable: vi.fn(() => ({ start: vi.fn(), pause: vi.fn(), resume: vi.fn() })),
}))

const Stub: Component = () => h('div')

const testConfig: GissenConfig = {
  components: {
    Hero: {
      fields: {
        title: { type: 'text', label: 'Title' },
        subtitle: { type: 'textarea', label: 'Subtitle' },
        cta: {
          type: 'select',
          label: 'CTA',
          options: [
            { label: 'Get started free', value: 'get-started' },
            { label: 'Learn more', value: 'learn-more' },
          ],
        },
      },
      defaultProps: {
        title: 'Build pages visually',
        subtitle: 'Drag and drop your own Vue components.',
        cta: 'get-started',
      },
      render: Stub,
    },
    TextBlock: {
      fields: {
        heading: { type: 'text', label: 'Heading' },
        body: { type: 'textarea', label: 'Body' },
      },
      defaultProps: {
        heading: 'How it works',
        body: 'Register your Vue components with a typed config.',
      },
      render: Stub,
    },
    FeatureCard: {
      fields: {
        icon: { type: 'text', label: 'Icon' },
        title: { type: 'text', label: 'Title' },
        description: { type: 'textarea', label: 'Description' },
      },
      defaultProps: {
        icon: 'Icon',
        title: 'Feature',
        description: 'Describe what makes this feature great.',
      },
      render: Stub,
    },
    Container: {
      fields: {
        children: { type: 'slot', label: 'Children' },
      },
      defaultProps: { children: [] },
      render: Stub,
    },
  },
}

function emptyData(): GissenData {
  return { root: { props: {} }, content: [] }
}

function mountSidebar(data = emptyData()) {
  const store = createEditorStore(testConfig, data)

  const Wrapper = defineComponent({
    setup() {
      provideEditorStore(store)
    },
    render() {
      return h(EditorSidebar, { config: testConfig })
    },
  })

  return { wrapper: mount(Wrapper, { attachTo: document.body }), store }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('editorSidebar', () => {
  it('renders a labelled palette with roving tabindex', () => {
    const { wrapper } = mountSidebar()
    const list = wrapper.get('.gissen-sidebar__list')
    const items = wrapper.findAll('.gissen-sidebar__item')

    expect(list.attributes('aria-label')).toBe('Component palette')
    expect(list.attributes('role')).toBe('listbox')
    expect(items).toHaveLength(4)
    expect(items[0].attributes('role')).toBe('option')
    expect(items[0].attributes('tabindex')).toBe('0')
    expect(items[0].attributes('aria-selected')).toBe('true')
    expect(items[1].attributes('tabindex')).toBe('-1')
    expect(items[1].attributes('aria-selected')).toBe('false')
    expect(items[0].attributes('aria-label')).toBe('Add Hero component to canvas')
    expect(items[0].attributes('aria-keyshortcuts')).toBe('Enter')
    expect(items[0].attributes('data-gissen-type')).toBe('Hero')
  })

  it('moves focus through palette items with arrow keys', async () => {
    const { wrapper } = mountSidebar()
    const items = wrapper.findAll('.gissen-sidebar__item')

    const firstItem = items[0].element as HTMLElement
    firstItem.focus()
    await items[0].trigger('keydown', { key: 'ArrowDown' })
    await nextTick()

    expect(document.activeElement).toBe(items[1].element)
    expect(items[0].attributes('tabindex')).toBe('-1')
    expect(items[0].attributes('aria-selected')).toBe('false')
    expect(items[1].attributes('tabindex')).toBe('0')
    expect(items[1].attributes('aria-selected')).toBe('true')

    await items[1].trigger('keydown', { key: 'ArrowUp' })
    await nextTick()

    expect(document.activeElement).toBe(items[0].element)
    expect(items[0].attributes('tabindex')).toBe('0')
    expect(items[0].attributes('aria-selected')).toBe('true')
    expect(items[1].attributes('tabindex')).toBe('-1')
    expect(items[1].attributes('aria-selected')).toBe('false')
  })

  it('moves focus to palette edges with Home and End', async () => {
    const { wrapper } = mountSidebar()
    const items = wrapper.findAll('.gissen-sidebar__item')

    const firstItem = items[0].element as HTMLElement
    firstItem.focus()
    await items[0].trigger('keydown', { key: 'End' })
    await nextTick()

    expect(document.activeElement).toBe(items[3].element)
    expect(items[3].attributes('tabindex')).toBe('0')
    expect(items[3].attributes('aria-selected')).toBe('true')

    await items[3].trigger('keydown', { key: 'Home' })
    await nextTick()

    expect(document.activeElement).toBe(items[0].element)
    expect(items[0].attributes('tabindex')).toBe('0')
    expect(items[0].attributes('aria-selected')).toBe('true')
  })

  it('appends each focused component to the root canvas on Enter', async () => {
    const { wrapper, store } = mountSidebar()
    const items = wrapper.findAll('.gissen-sidebar__item')

    for (const item of items) {
      await item.trigger('keydown', { key: 'Enter' })
    }

    expect(store.data.content).toHaveLength(4)
    expect(store.data.content.map(component => component.type)).toEqual([
      'Hero',
      'TextBlock',
      'FeatureCard',
      'Container',
    ])
    expect(store.data.content[0].props).toMatchObject({
      title: 'Build pages visually',
      subtitle: 'Drag and drop your own Vue components.',
      cta: 'get-started',
    })
    expect(store.data.content[1].props).toMatchObject({
      heading: 'How it works',
      body: 'Register your Vue components with a typed config.',
    })
    expect(store.data.content[2].props).toMatchObject({
      icon: 'Icon',
      title: 'Feature',
      description: 'Describe what makes this feature great.',
    })
    expect(store.data.content[3].props).toMatchObject({
      children: [],
    })
    expect(store.data.content.every(component => typeof component.props.id === 'string')).toBe(true)
  })
})
