import type { Component } from 'vue'
import type { GissenConfig, GissenData } from '../../src/types'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import EditorCanvas from '../../src/components/editor/EditorCanvas.vue'
import { createEditorStore, provideEditorStore } from '../../src/composables/useEditorStore'

// Deliberately NO vi.mock('vue-draggable-plus') here, unlike the other
// component tests: this suite pins the app-killing failure mode where the
// real Sortable used to be handed a null element during app init (a
// `root.render` component that never renders its default slot). The guard
// must skip real DnD init, not a mock's.

const TestButton: Component = defineComponent({
  props: { id: String, label: String },
  setup: props => () => h('button', props.label),
})

/** A root wrapper that ignores its default slot — the invalid-but-shipped setup. */
const SlotlessRoot: Component = defineComponent({
  name: 'SlotlessRoot',
  setup: () => () => h('main', { 'data-testid': 'slotless-root' }, 'no slot here'),
})

/** A well-behaved root wrapper, as the docs prescribe. */
const SlottedRoot: Component = defineComponent({
  name: 'SlottedRoot',
  setup: (_, { slots }) => () => h('main', { 'data-testid': 'slotted-root' }, slots.default?.()),
})

function makeConfig(root: Component): GissenConfig {
  return {
    components: {
      Button: {
        fields: { label: { type: 'text' } },
        defaultProps: { label: 'Click me' },
        render: TestButton,
      },
    },
    root: { render: root },
  }
}

function emptyData(): GissenData {
  return { version: 1, root: { props: {} }, content: [] }
}

function mountCanvas(config: GissenConfig) {
  const store = createEditorStore(config, emptyData())
  const Wrapper = defineComponent({
    setup() {
      provideEditorStore(store)
    },
    render() {
      return h(EditorCanvas)
    },
  })
  return { wrapper: mount(Wrapper, { attachTo: document.body }), store }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('editorCanvas graceful degradation (root.render without a default slot)', () => {
  it('mounts without throwing, logs a dev error naming the likely cause, and skips DnD', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    let result!: ReturnType<typeof mountCanvas>
    expect(() => {
      result = mountCanvas(makeConfig(SlotlessRoot))
    }).not.toThrow()

    // The editor is alive: the root component rendered, the app did not die.
    expect(result.wrapper.find('[data-testid="slotless-root"]').exists()).toBe(true)
    // The zone element really is absent — the degraded state under test.
    expect(result.wrapper.find('.gissen-canvas__inner').exists()).toBe(false)

    const messages = errorSpy.mock.calls.map(args => String(args[0]))
    const gissenError = messages.find(m => m.startsWith('[Gissen]'))
    expect(gissenError).toBeDefined()
    expect(gissenError).toContain('drag-and-drop is disabled')
    expect(gissenError).toContain('root.render')
    expect(gissenError).toContain('default slot')

    // The editor still edits without DnD: store operations keep working.
    result.store.insertComponent('Button', null, null, 0)
    expect(result.store.data.content).toHaveLength(1)
  })

  it('still initializes real DnD when the root renders its slot', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { wrapper } = mountCanvas(makeConfig(SlottedRoot))

    // The zone mounted inside the root wrapper and no degradation error fired
    // — manual (immediate: false) init must not regress the normal path.
    const inner = wrapper.get('[data-testid="slotted-root"] .gissen-canvas__inner')
    expect(errorSpy.mock.calls.map(args => String(args[0]))
      .filter(m => m.startsWith('[Gissen]'))).toHaveLength(0)

    // Real Sortable marks the element it attached to: init actually happened.
    const sortableExpando = Object.keys(inner.element).find(k => k.startsWith('Sortable'))
    expect(sortableExpando).toBeDefined()
  })
})
