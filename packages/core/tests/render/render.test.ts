import type { Component } from 'vue'
import type { GissenConfig, GissenData } from '../../src/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import GissenEditor from '../../src/components/GissenEditor.vue'
import { createEditorStore } from '../../src/composables/useEditorStore'
import GissenRender from '../../src/render/GissenRender'

// The live-preview integration test mounts the full editor, whose canvas and
// sidebar wire up vue-draggable-plus.
vi.mock('vue-draggable-plus', () => ({
  useDraggable: vi.fn(() => ({ start: vi.fn(), pause: vi.fn(), resume: vi.fn() })),
}))

// ── Test components ────────────────────────────────────────────────────────
// Plain user components with their own natural DOM — the assertions below
// check that GissenRender emits exactly this markup and nothing else.

const Hero: Component = defineComponent({
  props: {
    id: String,
    title: String, // text
    subtitle: String, // textarea
    cta: String, // select
    priority: Number, // number
    featured: Boolean, // boolean
  },
  template: '<section class="hero" :data-cta="cta" :data-priority="priority" :data-featured="featured">'
    + '<h1>{{ title }}</h1><p>{{ subtitle }}</p></section>',
})

const Columns: Component = defineComponent({
  props: { id: String },
  template: '<div class="columns">'
    + '<div class="col-left"><slot name="left" /></div>'
    + '<div class="col-right"><slot name="right" /></div>'
    + '</div>',
})

const Button: Component = defineComponent({
  props: { id: String, label: String },
  template: '<button class="btn">{{ label }}</button>',
})

const config: GissenConfig = {
  components: {
    Hero: {
      fields: {
        title: { type: 'text' },
        subtitle: { type: 'textarea' },
        cta: { type: 'select', options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }] },
        priority: { type: 'number' },
        featured: { type: 'boolean' },
      },
      render: Hero,
    },
    Columns: {
      fields: { left: { type: 'slot' }, right: { type: 'slot' } },
      render: Columns,
    },
    Button: {
      fields: { label: { type: 'text' } },
      render: Button,
    },
  },
}

function doc(content: GissenData['content'], root: GissenData['root'] = { props: {} }): GissenData {
  return { version: 1, root, content }
}

/**
 * Mounts GissenRender inside a plain host div so assertions can run against
 * the host's exact innerHTML — the fragment output has no root element of its
 * own to query.
 */
function mountRender(data: GissenData, cfg: GissenConfig = config) {
  const Host = defineComponent({
    setup: () => () => h('div', [h(GissenRender, { config: cfg, data })]),
  })
  return mount(Host)
}

// ── Zero-wrapper output ────────────────────────────────────────────────────

describe('gissenRender output structure', () => {
  it('renders a single node as exactly the component\'s own markup', () => {
    const wrapper = mountRender(doc([
      { type: 'Button', props: { id: 'btn-1', label: 'Hi' } },
    ]))
    expect(wrapper.element.innerHTML).toBe('<button class="btn">Hi</button>')
  })

  it('renders a representative tree with zero wrapper elements at any level', () => {
    const wrapper = mountRender(doc([
      {
        type: 'Hero',
        // All five value field types; `priority` (number) deliberately absent.
        props: { id: 'hero-1', title: 'Hello', subtitle: 'Sub', cta: 'a', featured: true },
      },
      {
        type: 'Columns',
        props: {
          id: 'cols-1',
          left: [
            { type: 'Button', props: { id: 'btn-1', label: 'Left CTA' } },
            {
              type: 'Columns',
              props: {
                id: 'cols-2',
                left: [{ type: 'Button', props: { id: 'btn-2', label: 'Deep' } }],
                right: [],
              },
            },
          ],
          right: [{ type: 'Button', props: { id: 'btn-3', label: 'Right CTA' } }],
        },
      },
    ]))

    // Top level: exactly the two user components' root elements, no wrapper.
    const host = wrapper.element
    expect(host.children).toHaveLength(2)
    const hero = host.children[0]
    const columns = host.children[1]
    expect(hero.matches('section.hero')).toBe(true)
    expect(columns.matches('div.columns')).toBe(true)

    // The absent number prop stays absent — no injected default.
    expect(hero.getAttribute('data-priority')).toBeNull()
    expect(hero.getAttribute('data-cta')).toBe('a')
    expect(hero.getAttribute('data-featured')).toBe('true')

    // Nested levels: slot children sit directly inside the component's own
    // slot outlet elements, again with no wrapper.
    const left = columns.querySelector(':scope > .col-left')
    expect(left).not.toBeNull()
    expect(left?.children).toHaveLength(2)
    expect(left?.children[0].className).toBe('btn')
    expect(left?.children[1].className).toBe('columns')
    expect(left?.querySelector(':scope > .columns > .col-left > .btn')?.textContent).toBe('Deep')
    expect(columns.querySelector(':scope > .col-right > .btn')?.textContent).toBe('Right CTA')

    // No editor chrome anywhere in the output.
    expect(host.querySelectorAll('[data-gissen-id], [class*="gissen"]')).toHaveLength(0)
  })

  it('routes children into the right named slots, recursively', () => {
    const wrapper = mountRender(doc([
      {
        type: 'Columns',
        props: {
          id: 'cols-1',
          left: [{ type: 'Button', props: { id: 'btn-l', label: 'in left' } }],
          right: [{
            type: 'Columns',
            props: {
              id: 'cols-2',
              left: [],
              right: [{ type: 'Button', props: { id: 'btn-rr', label: 'in right right' } }],
            },
          }],
        },
      },
    ]))
    expect(wrapper.find('.col-left > .btn').text()).toBe('in left')
    expect(wrapper.find('.col-right > .columns > .col-right > .btn').text()).toBe('in right right')
    expect(wrapper.find('.col-right > .columns > .col-left').element.children).toHaveLength(0)
  })
})

// ── Resilience ─────────────────────────────────────────────────────────────

describe('gissenRender resilience', () => {
  it('skips an unknown type, renders its siblings, and dev-warns with id and type', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mountRender(doc([
      { type: 'Button', props: { id: 'btn-1', label: 'Before' } },
      { type: 'Vanished', props: { id: 'gone-1' } },
      { type: 'Button', props: { id: 'btn-2', label: 'After' } },
    ]))

    expect(wrapper.findAll('.btn').map(b => b.text())).toEqual(['Before', 'After'])
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('"Vanished"')
    expect(warn.mock.calls[0][0]).toContain('gone-1')
    warn.mockRestore()
  })

  it('skips an unknown type nested in a slot while its slot siblings render', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mountRender(doc([
      {
        type: 'Columns',
        props: {
          id: 'cols-1',
          left: [
            { type: 'Vanished', props: { id: 'gone-2' } },
            { type: 'Button', props: { id: 'btn-1', label: 'Survivor' } },
          ],
          right: [],
        },
      },
    ]))
    expect(wrapper.find('.col-left > .btn').text()).toBe('Survivor')
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

  it('renders an editor round-tripped document (cleared number → absent prop) without warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Produce the document the way the editor does: clear a number field via
    // the store, then round-trip through JSON (undefined keys drop out).
    const store = createEditorStore(config, doc([
      { type: 'Hero', props: { id: 'hero-1', title: 'T', subtitle: 'S', cta: 'a', priority: 5, featured: false } },
    ]))
    store.updateProp('hero-1', 'priority', undefined)
    const roundTripped = JSON.parse(JSON.stringify(store.data)) as GissenData

    const wrapper = mountRender(roundTripped)
    expect(wrapper.find('section.hero').exists()).toBe(true)
    expect(wrapper.find('section.hero').attributes('data-priority')).toBeUndefined()
    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    warn.mockRestore()
    error.mockRestore()
  })

  it('ignores the envelope version field', () => {
    const data = doc([{ type: 'Button', props: { id: 'btn-1', label: 'Hi' } }])
    data.version = 999
    const wrapper = mountRender(data)
    expect(wrapper.get('.btn').text()).toBe('Hi')
  })
})

// ── Root rendering ─────────────────────────────────────────────────────────

const PageShell: Component = defineComponent({
  props: { theme: String },
  template: '<main class="shell" :data-theme="theme"><slot /></main>',
})

describe('gissenRender root rendering', () => {
  it('wraps the content in config.root.render with data.root.props', () => {
    const rootConfig: GissenConfig = {
      components: config.components,
      root: { fields: { theme: { type: 'text' } }, render: PageShell },
    }
    const wrapper = mountRender(
      doc([{ type: 'Button', props: { id: 'btn-1', label: 'Hi' } }], { props: { theme: 'dark' } }),
      rootConfig,
    )
    expect(wrapper.element.innerHTML).toBe(
      '<main class="shell" data-theme="dark"><button class="btn">Hi</button></main>',
    )
  })

  it('renders a bare fragment when no root render is configured', () => {
    const wrapper = mountRender(doc([
      { type: 'Button', props: { id: 'btn-1', label: 'One' } },
      { type: 'Button', props: { id: 'btn-2', label: 'Two' } },
    ]))
    expect(wrapper.element.innerHTML).toBe(
      '<button class="btn">One</button><button class="btn">Two</button>',
    )
  })
})

// ── Reactivity ─────────────────────────────────────────────────────────────

describe('gissenRender reactivity', () => {
  it('re-renders when the data prop is replaced', async () => {
    const data = ref<GissenData>(doc([{ type: 'Button', props: { id: 'btn-1', label: 'One' } }]))
    const Host = defineComponent({
      setup: () => () => h('div', [h(GissenRender, { config, data: data.value })]),
    })
    const wrapper = mount(Host)
    expect(wrapper.get('.btn').text()).toBe('One')

    data.value = doc([{ type: 'Button', props: { id: 'btn-1', label: 'Two' } }])
    await nextTick()
    expect(wrapper.get('.btn').text()).toBe('Two')
  })

  it('live-preview: a panel edit in GissenEditor updates GissenRender bound to the same ref', async () => {
    const data = ref<GissenData>(doc([{ type: 'Button', props: { id: 'btn-1', label: 'Hi' } }]))
    const Host = defineComponent({
      setup() {
        return () => h('div', [
          h(GissenEditor, {
            'config': config,
            'data': data.value,
            'onUpdate:data': (v: GissenData) => { data.value = v },
          }),
          h('section', { class: 'preview' }, [h(GissenRender, { config, data: data.value })]),
        ])
      },
    })
    const wrapper = mount(Host, { attachTo: document.body })

    expect(wrapper.get('.preview .btn').text()).toBe('Hi')

    // Select the node on the canvas, edit its label in the properties panel.
    await wrapper.find('[data-gissen-id="btn-1"]').trigger('click')
    const input = wrapper.find('.gissen-panel input')
    expect(input.exists()).toBe(true)
    await input.setValue('Updated live')
    await nextTick()
    await nextTick()

    expect(wrapper.get('.preview .btn').text()).toBe('Updated live')
    wrapper.unmount()
  })
})
