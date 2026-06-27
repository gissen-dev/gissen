import type { Component } from 'vue'
import type { GissenConfig, GissenData } from '../../src/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { createEditorStore, provideEditorStore } from '../../src/composables/useEditorStore'
import { useCanvasZoneDnD, useSidebarDnD } from '../../src/composables/useGissenDnD'
import { useSelection } from '../../src/composables/useSelection'

// ── Mock vue-draggable-plus ────────────────────────────────────────────────

vi.mock('vue-draggable-plus', () => ({
  useDraggable: vi.fn(() => ({ start: vi.fn(), pause: vi.fn(), resume: vi.fn() })),
}))

// Import the mock AFTER vi.mock is set up
const { useDraggable } = await import('vue-draggable-plus')
const mockUseDraggable = vi.mocked(useDraggable)

// ── Test helpers ───────────────────────────────────────────────────────────

const Stub: Component = () => h('div')

const testConfig: GissenConfig = {
  components: {
    Button: {
      fields: { label: { type: 'text' } },
      defaultProps: { label: 'Click me' },
      render: Stub,
    },
    Container: {
      fields: { items: { type: 'slot' } },
      defaultProps: { items: [] },
      render: Stub,
    },
  },
}

function makeData(overrides: Partial<GissenData> = {}): GissenData {
  return { root: { props: {} }, content: [], ...overrides }
}

function makeFakeEl(attrs: Record<string, string> = {}): HTMLElement {
  const el = document.createElement('div')
  for (const [k, v] of Object.entries(attrs)) {
    el.dataset[k] = v
  }
  return el
}

/**
 * Mounts a component inside a store-providing wrapper.
 * Returns the store and the last options object passed to useDraggable.
 */
function mountWithDnD(
  setupFn: () => void,
  store = createEditorStore(testConfig, makeData()),
) {
  mockUseDraggable.mockClear()

  const Inner = defineComponent({
    setup() { setupFn() },
    render() { return h('div') },
  })

  const Wrapper = defineComponent({
    setup() { provideEditorStore(store) },
    render() { return h(Inner) },
  })

  mount(Wrapper, { attachTo: document.body })

  // Options are in call index 1 (useDraggable(el, options))
  const calls = mockUseDraggable.mock.calls
  const options = calls.length > 0 ? (calls[calls.length - 1][1] as Record<string, unknown>) : {}
  return { store, options }
}

// ── useSidebarDnD ──────────────────────────────────────────────────────────

describe('useSidebarDnD', () => {
  it('initializes with clone pull and no put', () => {
    const { options } = mountWithDnD(() => {
      const el = ref<HTMLElement | null>(null)
      useSidebarDnD(el)
    })
    const group = options.group as Record<string, unknown>
    expect(group.name).toBe('gissen')
    expect(group.pull).toBe('clone')
    expect(group.put).toBe(false)
  })

  it('disables sorting within the sidebar', () => {
    const { options } = mountWithDnD(() => {
      const el = ref<HTMLElement | null>(null)
      useSidebarDnD(el)
    })
    expect(options.sort).toBe(false)
  })
})

// ── useCanvasZoneDnD — onAdd ───────────────────────────────────────────────

describe('useCanvasZoneDnD — onAdd', () => {
  it('inserts a new component when sidebar clone dropped (data-gissen-type)', async () => {
    const { store, options } = mountWithDnD(() => {
      const el = ref<HTMLElement | null>(null)
      useCanvasZoneDnD(el, () => ({ parentId: null, slotName: null }))
    })

    const item = makeFakeEl({ gissenType: 'Button' })
    const parent = document.createElement('div')
    parent.appendChild(item)

    const onAdd = options.onAdd as (evt: Record<string, unknown>) => void
    onAdd({ item, newIndex: 0 })

    expect(store.data.content).toHaveLength(1)
    expect(store.data.content[0].type).toBe('Button')
  })

  it('removes the Sortable-inserted DOM node after insert', async () => {
    const { options } = mountWithDnD(() => {
      const el = ref<HTMLElement | null>(null)
      useCanvasZoneDnD(el, () => ({ parentId: null, slotName: null }))
    })

    const item = makeFakeEl({ gissenType: 'Button' })
    const parent = document.createElement('div')
    parent.appendChild(item)

    const onAdd = options.onAdd as (evt: Record<string, unknown>) => void
    onAdd({ item, newIndex: 0 })

    expect(parent.contains(item)).toBe(false)
  })

  it('moves an existing component when canvas node dropped (data-gissen-id)', async () => {
    const existing = {
      type: 'Button',
      props: { id: 'btn-1', label: 'Hi' },
    }
    const store = createEditorStore(testConfig, makeData({ content: [existing] as never }))

    const { options } = mountWithDnD(() => {
      const el = ref<HTMLElement | null>(null)
      useCanvasZoneDnD(el, () => ({ parentId: null, slotName: null }))
    }, store)

    const moveSpy = vi.spyOn(store, 'moveComponent')

    const item = makeFakeEl({ gissenId: 'btn-1' })
    const parent = document.createElement('div')
    parent.appendChild(item)

    const onAdd = options.onAdd as (evt: Record<string, unknown>) => void
    onAdd({ item, newIndex: 0 })

    expect(moveSpy).toHaveBeenCalledWith('btn-1', null, null, 0)
  })

  it('inserts into a slot zone when parentId and slotName are provided', async () => {
    const container = {
      type: 'Container',
      props: { id: 'c-1', items: [] as never[] },
    }
    const store = createEditorStore(testConfig, makeData({ content: [container] as never }))

    const { options } = mountWithDnD(() => {
      const el = ref<HTMLElement | null>(null)
      useCanvasZoneDnD(el, () => ({ parentId: 'c-1', slotName: 'items' }))
    }, store)

    const item = makeFakeEl({ gissenType: 'Button' })
    const parent = document.createElement('div')
    parent.appendChild(item)

    const onAdd = options.onAdd as (evt: Record<string, unknown>) => void
    onAdd({ item, newIndex: 0 })

    expect((store.data.content[0].props.items as unknown[]).length).toBe(1)
  })
})

// ── useCanvasZoneDnD — onUpdate ────────────────────────────────────────────

describe('useCanvasZoneDnD — onUpdate', () => {
  it('calls moveComponent with new index on same-zone reorder', () => {
    const btn1 = { type: 'Button', props: { id: 'btn-a', label: 'A' } }
    const btn2 = { type: 'Button', props: { id: 'btn-b', label: 'B' } }
    const store = createEditorStore(testConfig, makeData({ content: [btn1, btn2] as never }))

    const { options } = mountWithDnD(() => {
      const el = ref<HTMLElement | null>(null)
      useCanvasZoneDnD(el, () => ({ parentId: null, slotName: null }))
    }, store)

    const moveSpy = vi.spyOn(store, 'moveComponent')

    const item = makeFakeEl({ gissenId: 'btn-a' })
    const parent = document.createElement('div')
    parent.appendChild(document.createElement('div')) // placeholder sibling
    parent.appendChild(item)

    const onUpdate = options.onUpdate as (evt: Record<string, unknown>) => void
    onUpdate({ item, oldIndex: 0, newIndex: 1 })

    // Moving forward: storeIndex = newIndex(1) + 1 = 2
    expect(moveSpy).toHaveBeenCalledWith('btn-a', null, null, 2)
  })

  it('calls moveComponent with unmodified index when moving backward', () => {
    const btn1 = { type: 'Button', props: { id: 'btn-c', label: 'C' } }
    const btn2 = { type: 'Button', props: { id: 'btn-d', label: 'D' } }
    const store = createEditorStore(testConfig, makeData({ content: [btn1, btn2] as never }))

    const { options } = mountWithDnD(() => {
      const el = ref<HTMLElement | null>(null)
      useCanvasZoneDnD(el, () => ({ parentId: null, slotName: null }))
    }, store)

    const moveSpy = vi.spyOn(store, 'moveComponent')
    const item = makeFakeEl({ gissenId: 'btn-d' })
    const onUpdate = options.onUpdate as (evt: Record<string, unknown>) => void
    onUpdate({ item, oldIndex: 1, newIndex: 0 })

    // Moving backward: storeIndex = newIndex(0) unchanged
    expect(moveSpy).toHaveBeenCalledWith('btn-d', null, null, 0)
  })

  it('skips moveComponent when old and new index are equal', () => {
    const store = createEditorStore(testConfig, makeData())
    const { options } = mountWithDnD(() => {
      const el = ref<HTMLElement | null>(null)
      useCanvasZoneDnD(el, () => ({ parentId: null, slotName: null }))
    }, store)

    const moveSpy = vi.spyOn(store, 'moveComponent')
    const item = makeFakeEl({ gissenId: 'btn-a' })
    const onUpdate = options.onUpdate as (evt: Record<string, unknown>) => void
    onUpdate({ item, oldIndex: 1, newIndex: 1 })

    expect(moveSpy).not.toHaveBeenCalled()
  })
})

// ── useCanvasZoneDnD — put (cycle prevention) ──────────────────────────────

describe('useCanvasZoneDnD — put (cycle prevention)', () => {
  it('allows drop when dragged element has no gissenId (sidebar clone)', () => {
    const { options } = mountWithDnD(() => {
      const el = ref<HTMLElement | null>(null)
      useCanvasZoneDnD(el, () => ({ parentId: 'c-1', slotName: 'items' }))
    })
    const group = options.group as Record<string, unknown>
    const putFn = group.put as (to: unknown, from: unknown, dragEl: HTMLElement) => boolean
    expect(putFn({}, {}, makeFakeEl())).toBe(true)
  })

  it('rejects drop when target zone parentId equals dragged component id (own slot)', () => {
    const container = { type: 'Container', props: { id: 'c-1', items: [] as never[] } }
    const store = createEditorStore(testConfig, makeData({ content: [container] as never }))

    const { options } = mountWithDnD(() => {
      const el = ref<HTMLElement | null>(null)
      useCanvasZoneDnD(el, () => ({ parentId: 'c-1', slotName: 'items' }))
    }, store)

    const group = options.group as Record<string, unknown>
    const putFn = group.put as (to: unknown, from: unknown, dragEl: HTMLElement) => boolean
    expect(putFn({}, {}, makeFakeEl({ gissenId: 'c-1' }))).toBe(false)
  })

  it('rejects drop when target zone is inside dragged component subtree', () => {
    const inner = { type: 'Container', props: { id: 'inner', items: [] as never[] } }
    const outer = { type: 'Container', props: { id: 'outer', items: [inner] as never[] } }
    const store = createEditorStore(testConfig, makeData({ content: [outer] as never }))

    const { options } = mountWithDnD(() => {
      const el = ref<HTMLElement | null>(null)
      // Dropping into inner's slot
      useCanvasZoneDnD(el, () => ({ parentId: 'inner', slotName: 'items' }))
    }, store)

    const group = options.group as Record<string, unknown>
    const putFn = group.put as (to: unknown, from: unknown, dragEl: HTMLElement) => boolean
    // Dragging outer into inner (which is inside outer) → reject
    expect(putFn({}, {}, makeFakeEl({ gissenId: 'outer' }))).toBe(false)
  })

  it('allows drop for unrelated components', () => {
    const btn = { type: 'Button', props: { id: 'btn-x', label: 'X' } }
    const container = { type: 'Container', props: { id: 'c-2', items: [] as never[] } }
    const store = createEditorStore(testConfig, makeData({ content: [btn, container] as never }))

    const { options } = mountWithDnD(() => {
      const el = ref<HTMLElement | null>(null)
      useCanvasZoneDnD(el, () => ({ parentId: 'c-2', slotName: 'items' }))
    }, store)

    const group = options.group as Record<string, unknown>
    const putFn = group.put as (to: unknown, from: unknown, dragEl: HTMLElement) => boolean
    expect(putFn({}, {}, makeFakeEl({ gissenId: 'btn-x' }))).toBe(true)
  })
})

// ── useSelection ───────────────────────────────────────────────────────────

describe('useSelection', () => {
  // Renders a focusable editor root containing an input and a contenteditable,
  // and wires useSelection to that root. The listener is scoped to the root, so
  // tests dispatch events on it (or its descendants) — not on `document`.
  function mountSelection(store = createEditorStore(testConfig, makeData())) {
    mockUseDraggable.mockClear()
    const Comp = defineComponent({
      setup() {
        const elRef = ref<HTMLElement | null>(null)
        useSelection(elRef)
        return { elRef }
      },
      render() {
        return h('div', { 'ref': 'elRef', 'tabindex': -1, 'data-test': 'root' }, [
          h('input', { 'data-test': 'inner-input' }),
          h('div', { 'data-test': 'inner-editable', 'contenteditable': 'true' }),
        ])
      },
    })
    const Wrapper = defineComponent({
      setup() { provideEditorStore(store) },
      render() { return h(Comp) },
    })
    const wrapper = mount(Wrapper, { attachTo: document.body })
    const root = wrapper.get('[data-test="root"]').element as HTMLElement
    const input = wrapper.get('[data-test="inner-input"]').element as HTMLElement
    const editable = wrapper.get('[data-test="inner-editable"]').element as HTMLElement
    // jsdom does not derive isContentEditable from the attribute; force it.
    Object.defineProperty(editable, 'isContentEditable', { value: true, configurable: true })
    return { wrapper, store, root, input, editable }
  }

  it('deselects on Escape', () => {
    const { store, root } = mountSelection()
    store.selectComponent('some-id')
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(store.selectedId).toBeNull()
  })

  it('removes selected component on Delete', () => {
    const btn = { type: 'Button', props: { id: 'del-1', label: 'Del' } }
    const store = createEditorStore(testConfig, makeData({ content: [btn] as never }))
    store.selectComponent('del-1')
    const { root } = mountSelection(store)

    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))
    expect(store.data.content).toHaveLength(0)
    expect(store.selectedId).toBeNull()
  })

  it('removes selected component on Backspace', () => {
    const btn = { type: 'Button', props: { id: 'del-2', label: 'Del' } }
    const store = createEditorStore(testConfig, makeData({ content: [btn] as never }))
    store.selectComponent('del-2')
    const { root } = mountSelection(store)

    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))
    expect(store.data.content).toHaveLength(0)
  })

  it('does nothing on Delete when nothing is selected', () => {
    const btn = { type: 'Button', props: { id: 'del-3', label: 'Del' } }
    const store = createEditorStore(testConfig, makeData({ content: [btn] as never }))
    // No selectComponent call — selectedId is null
    const { root } = mountSelection(store)

    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))
    expect(store.data.content).toHaveLength(1)
  })

  it('does not delete the selected component on Backspace from an input field', () => {
    const btn = { type: 'Button', props: { id: 'keep-1', label: 'Keep' } }
    const store = createEditorStore(testConfig, makeData({ content: [btn] as never }))
    store.selectComponent('keep-1')
    const { input } = mountSelection(store)

    // Event bubbles from the input (inside the editor) up to the root listener.
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))

    expect(store.data.content).toHaveLength(1)
    expect(store.selectedId).toBe('keep-1')
  })

  it('does not delete on Delete from a contenteditable element', () => {
    const btn = { type: 'Button', props: { id: 'keep-2', label: 'Keep' } }
    const store = createEditorStore(testConfig, makeData({ content: [btn] as never }))
    store.selectComponent('keep-2')
    const { editable } = mountSelection(store)

    editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))

    expect(store.data.content).toHaveLength(1)
  })

  it('ignores Delete when the event is outside the editor root', () => {
    const btn = { type: 'Button', props: { id: 'out-1', label: 'Outside' } }
    const store = createEditorStore(testConfig, makeData({ content: [btn] as never }))
    store.selectComponent('out-1')
    mountSelection(store)

    // Dispatched on document.body (an ancestor) — never reaches the root listener.
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))

    expect(store.data.content).toHaveLength(1)
    expect(store.selectedId).toBe('out-1')
  })

  it('clears a stale selection instead of throwing on Delete', () => {
    // selectedId points at a node that is not in the tree (e.g. data replaced
    // externally while something was selected).
    const store = createEditorStore(testConfig, makeData())
    store.selectComponent('ghost')
    const { root } = mountSelection(store)

    expect(() =>
      root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true })),
    ).not.toThrow()
    expect(store.selectedId).toBeNull()
  })
})
