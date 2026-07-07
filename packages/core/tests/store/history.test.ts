import type { Component } from 'vue'
import type { EditorStore } from '../../src/composables/useEditorStore'
import type { GissenConfig, GissenData } from '../../src/types'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, nextTick, ref } from 'vue'
import NumberInput from '../../src/components/editor/fields/NumberInput.vue'
import TextInput from '../../src/components/editor/fields/TextInput.vue'
import { createHistory } from '../../src/composables/history'
import { createEditorStore, provideEditorStore } from '../../src/composables/useEditorStore'

const Stub: Component = () => h('div')

const config: GissenConfig = {
  components: {
    Hero: {
      fields: { title: { type: 'text' }, subtitle: { type: 'text' } },
      defaultProps: { title: 'Hello' },
      render: Stub,
    },
    Text: {
      fields: { body: { type: 'text' } },
      defaultProps: { body: '' },
      render: Stub,
    },
    Container: {
      fields: { children: { type: 'slot' } },
      render: Stub,
    },
    TextOnlyContainer: {
      fields: { children: { type: 'slot', allow: ['Text'] } },
      render: Stub,
    },
  },
}

function emptyData(): GissenData {
  return { version: 1, root: { props: {} }, content: [] }
}

/** Plain deep clone for structural comparisons across commits. */
function snap(data: GissenData): GissenData {
  return JSON.parse(JSON.stringify(data)) as GissenData
}

describe('createHistory', () => {
  // A minimal live-document stand-in: the store's role (clone on take, swap on
  // apply) reduced to a mutable local, so stack semantics are tested in isolation.
  function harness(capacity = 100) {
    let live = emptyData()
    const history = createHistory({
      takeSnapshot: () => structuredClone(live),
      applySnapshot: (s) => { live = s },
      capacity,
    })
    return {
      history,
      get live() { return live },
      // Simulates a store mutation: record the before-state, then change the doc.
      edit(marker: number): void {
        const before = structuredClone(live)
        live = { ...emptyData(), root: { props: { marker } } }
        history.record(before)
      },
    }
  }

  it('starts at the baseline: nothing to undo or redo, undo/redo are no-ops', () => {
    const { history, live } = harness()
    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(false)
    history.undo()
    history.redo()
    expect(live.root.props).toEqual({})
  })

  it('walks back and forward through recorded states', () => {
    const t = harness()
    t.edit(1)
    t.edit(2)
    t.edit(3)
    t.history.undo()
    expect(t.live.root.props.marker).toBe(2)
    t.history.undo()
    t.history.undo()
    expect(t.live.root.props).toEqual({})
    expect(t.history.canUndo).toBe(false)
    t.history.redo()
    t.history.redo()
    t.history.redo()
    expect(t.live.root.props.marker).toBe(3)
    expect(t.history.canRedo).toBe(false)
  })

  it('clears the redo stack on a new edit', () => {
    const t = harness()
    t.edit(1)
    t.history.undo()
    expect(t.history.canRedo).toBe(true)
    t.edit(2)
    expect(t.history.canRedo).toBe(false)
    t.history.redo()
    expect(t.live.root.props.marker).toBe(2)
  })

  it('drops the oldest entry beyond capacity', () => {
    const t = harness(2)
    t.edit(1)
    t.edit(2)
    t.edit(3)
    t.history.undo()
    t.history.undo()
    // The state before edit 1 (the baseline) was dropped: the floor is now
    // the state before edit 2.
    expect(t.live.root.props.marker).toBe(1)
    expect(t.history.canUndo).toBe(false)
  })

  it('reset drops both stacks (new baseline)', () => {
    const t = harness()
    t.edit(1)
    t.edit(2)
    t.history.undo()
    t.history.reset()
    expect(t.history.canUndo).toBe(false)
    expect(t.history.canRedo).toBe(false)
  })

  it('canUndo/canRedo are reactive', () => {
    const t = harness()
    const canUndo = computed(() => t.history.canUndo)
    const canRedo = computed(() => t.history.canRedo)
    expect(canUndo.value).toBe(false)
    t.edit(1)
    expect(canUndo.value).toBe(true)
    expect(canRedo.value).toBe(false)
    t.history.undo()
    expect(canUndo.value).toBe(false)
    expect(canRedo.value).toBe(true)
  })
})

describe('undo/redo through the store', () => {
  it('undo removes an inserted node; redo restores the deep-equal document, id preserved', () => {
    const store = createEditorStore(config, emptyData())
    store.insertComponent('Hero', null, null, 0)
    const id = store.data.content[0].props.id
    const afterInsert = snap(store.data)
    store.undo()
    expect(store.data.content).toHaveLength(0)
    store.redo()
    expect(snap(store.data)).toEqual(afterInsert)
    expect(store.data.content[0].props.id).toBe(id)
  })

  it('undo/redo a same-slot reorder restores the exact prior order', () => {
    const store = createEditorStore(config, emptyData())
    store.insertComponent('Hero', null, null, 0)
    store.insertComponent('Text', null, null, 1)
    const heroId = store.data.content[0].props.id
    const beforeMove = snap(store.data)
    store.moveComponent(heroId, null, null, 2)
    const afterMove = snap(store.data)
    expect(afterMove).not.toEqual(beforeMove)
    store.undo()
    expect(snap(store.data)).toEqual(beforeMove)
    store.redo()
    expect(snap(store.data)).toEqual(afterMove)
  })

  it('undo/redo a cross-slot move restores the exact prior tree', () => {
    const store = createEditorStore(config, emptyData())
    store.insertComponent('Container', null, null, 0)
    store.insertComponent('Text', null, null, 1)
    const containerId = store.data.content[0].props.id
    const textId = store.data.content[1].props.id
    const beforeMove = snap(store.data)
    store.moveComponent(textId, containerId, 'children', 0)
    const afterMove = snap(store.data)
    store.undo()
    expect(snap(store.data)).toEqual(beforeMove)
    store.redo()
    expect(snap(store.data)).toEqual(afterMove)
  })

  it('undo restores a deleted node at its exact position', () => {
    const store = createEditorStore(config, emptyData())
    store.insertComponent('Hero', null, null, 0)
    store.insertComponent('Text', null, null, 1)
    store.insertComponent('Hero', null, null, 2)
    const middleId = store.data.content[1].props.id
    const beforeDelete = snap(store.data)
    store.removeComponent(middleId)
    expect(store.data.content).toHaveLength(2)
    store.undo()
    expect(snap(store.data)).toEqual(beforeDelete)
    expect(store.data.content[1].props.id).toBe(middleId)
  })

  it('keeps the selection when the selected node still exists after undo', () => {
    const store = createEditorStore(config, emptyData())
    store.insertComponent('Hero', null, null, 0)
    const heroId = store.data.content[0].props.id
    store.insertComponent('Text', null, null, 1)
    store.selectComponent(heroId)
    store.undo() // removes the Text; the Hero survives
    expect(store.selectedId).toBe(heroId)
  })

  it('clears the selection when the selected node is gone from the restored tree', () => {
    const store = createEditorStore(config, emptyData())
    store.insertComponent('Hero', null, null, 0)
    store.selectComponent(store.data.content[0].props.id)
    store.undo() // restores the empty baseline; the selected node no longer exists
    expect(store.selectedId).toBeNull()
  })

  it('a node deleted then restored by undo stays deselected (delete cleared the selection)', () => {
    const store = createEditorStore(config, emptyData())
    store.insertComponent('Hero', null, null, 0)
    const id = store.data.content[0].props.id
    store.selectComponent(id)
    store.removeComponent(id)
    expect(store.selectedId).toBeNull()
    store.undo()
    expect(store.data.content[0].props.id).toBe(id)
    expect(store.selectedId).toBeNull()
  })

  it('a new edit after undo clears the redo stack', () => {
    const store = createEditorStore(config, emptyData())
    store.insertComponent('Hero', null, null, 0)
    store.undo()
    expect(store.canRedo).toBe(true)
    store.insertComponent('Text', null, null, 0)
    expect(store.canRedo).toBe(false)
    const afterEdit = snap(store.data)
    store.redo() // must be a no-op
    expect(snap(store.data)).toEqual(afterEdit)
  })

  it('caps history at 100 entries, dropping the oldest', () => {
    const store = createEditorStore(config, emptyData())
    for (let i = 0; i < 101; i++) {
      store.insertComponent('Hero', null, null, 0)
    }
    let steps = 0
    while (store.canUndo && steps < 200) {
      store.undo()
      steps++
    }
    expect(steps).toBe(100)
    // The record of the very first insert was dropped: the floor is the state
    // after it, not the empty baseline.
    expect(store.data.content).toHaveLength(1)
  })

  it('a rejected operation leaves history untouched', () => {
    const store = createEditorStore(config, emptyData())
    expect(() => store.insertComponent('Text', 'missing', 'children', 0)).toThrow()
    expect(store.canUndo).toBe(false)

    store.insertComponent('TextOnlyContainer', null, null, 0)
    const containerId = store.data.content[0].props.id
    expect(() => store.insertComponent('Hero', containerId, 'children', 0)).toThrow()
    store.undo() // exactly one entry: the container insert
    expect(store.data.content).toHaveLength(0)
    expect(store.canUndo).toBe(false)
  })

  it('undo/redo write a fresh top-level object into the bound ref (update:data contract)', () => {
    const dataRef = ref<GissenData>(emptyData())
    const store = createEditorStore(config, dataRef)
    store.insertComponent('Hero', null, null, 0)
    const afterInsert = snap(dataRef.value)

    const beforeUndo = dataRef.value
    store.undo()
    expect(dataRef.value).not.toBe(beforeUndo)
    expect(snap(dataRef.value)).toEqual(emptyData())

    const beforeRedo = dataRef.value
    store.redo()
    expect(dataRef.value).not.toBe(beforeRedo)
    expect(snap(dataRef.value)).toEqual(afterInsert)
    // The store still writes through the very ref the host bound.
    expect(store.data).toBe(dataRef.value)
  })

  it('undo/redo at the boundaries are silent no-ops (no write, no emission)', () => {
    const dataRef = ref<GissenData>(emptyData())
    const store = createEditorStore(config, dataRef)
    const before = dataRef.value
    store.undo()
    store.redo()
    expect(dataRef.value).toBe(before)
  })

  it('external replacement of the bound ref resets history and normalizes the incoming document', () => {
    const dataRef = ref<GissenData>(emptyData())
    const store = createEditorStore(config, dataRef)
    store.insertComponent('Hero', null, null, 0)
    expect(store.canUndo).toBe(true)
    store.undo()
    expect(store.canRedo).toBe(true)

    // The host swaps in a hand-authored document that omits the slot key.
    dataRef.value = {
      version: 1,
      root: { props: {} },
      content: [{ type: 'Container', props: { id: 'c-1' } }],
    }
    expect(store.canUndo).toBe(false)
    expect(store.canRedo).toBe(false)
    // Acceptance-time normalization ran on the replacement.
    expect(store.data.content[0].props.children).toEqual([])

    // The replaced document is the new baseline: one edit, one undo back to it.
    store.insertComponent('Text', 'c-1', 'children', 0)
    store.undo()
    expect(store.data.content[0].props.children).toEqual([])
    expect(store.canUndo).toBe(false)
  })

  it('replacement through the store data setter also resets history', () => {
    const store = createEditorStore(config, emptyData())
    store.insertComponent('Hero', null, null, 0)
    expect(store.canUndo).toBe(true)
    store.data = { version: 1, root: { props: {} }, content: [{ type: 'Container', props: { id: 'c-1' } }] }
    expect(store.canUndo).toBe(false)
    expect(store.data.content[0].props.children).toEqual([])
  })

  it('updateProp is undoable (one entry per committed edit in Phase A)', () => {
    const store = createEditorStore(config, emptyData())
    store.insertComponent('Hero', null, null, 0)
    const id = store.data.content[0].props.id
    store.updateProp(id, 'title', 'Changed')
    store.undo()
    expect(store.data.content[0].props.title).toBe('Hello')
    store.redo()
    expect(store.data.content[0].props.title).toBe('Changed')
  })

  it('snapshots carry the version envelope through unchanged', () => {
    const store = createEditorStore(config, emptyData())
    store.insertComponent('Hero', null, null, 0)
    store.undo()
    expect(store.data.version).toBe(1)
    store.redo()
    expect(store.data.version).toBe(1)

    // A document without a version stays version-less across history moves.
    const versionless = createEditorStore(config, { root: { props: {} }, content: [] })
    versionless.insertComponent('Hero', null, null, 0)
    versionless.undo()
    expect('version' in versionless.data).toBe(false)
  })
})

describe('property-edit coalescing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function storeWithHero(): { store: EditorStore, id: string } {
    const store = createEditorStore(config, emptyData())
    store.insertComponent('Hero', null, null, 0)
    return { store, id: store.data.content[0].props.id }
  }

  it('a typing burst into one field collapses into a single undo step', () => {
    const { store, id } = storeWithHero()
    for (const draft of ['H', 'Ha', 'Hal', 'Halo']) {
      store.updateProp(id, 'title', draft)
    }
    store.undo()
    expect(store.data.content[0].props.title).toBe('Hello')
    store.redo()
    expect(store.data.content[0].props.title).toBe('Halo')
    // Exactly two entries exist in total: the insert and the one run.
    store.undo()
    store.undo()
    expect(store.data.content).toHaveLength(0)
    expect(store.canUndo).toBe(false)
  })

  it('edits to two fields of the same component are two undo steps', () => {
    const { store, id } = storeWithHero()
    store.updateProp(id, 'title', 'T')
    store.updateProp(id, 'subtitle', 'S')
    store.undo()
    expect(store.data.content[0].props.subtitle).toBeUndefined()
    expect(store.data.content[0].props.title).toBe('T')
    store.undo()
    expect(store.data.content[0].props.title).toBe('Hello')
  })

  it('edits to the same field on two components are two undo steps', () => {
    const store = createEditorStore(config, emptyData())
    store.insertComponent('Hero', null, null, 0)
    store.insertComponent('Hero', null, null, 1)
    const [a, b] = store.data.content.map(c => c.props.id)
    store.updateProp(a, 'title', 'A-edited')
    store.updateProp(b, 'title', 'B-edited')
    store.undo()
    expect(store.data.content[1].props.title).toBe('Hello')
    expect(store.data.content[0].props.title).toBe('A-edited')
    store.undo()
    expect(store.data.content[0].props.title).toBe('Hello')
  })

  it('a structural operation splits a run: edit → insert → edit is three steps', () => {
    const { store, id } = storeWithHero()
    store.updateProp(id, 'title', 'X')
    store.insertComponent('Text', null, null, 1)
    store.updateProp(id, 'title', 'XY')
    store.undo()
    expect(store.data.content[0].props.title).toBe('X')
    expect(store.data.content).toHaveLength(2)
    store.undo()
    expect(store.data.content).toHaveLength(1)
    expect(store.data.content[0].props.title).toBe('X')
    store.undo()
    expect(store.data.content[0].props.title).toBe('Hello')
  })

  it('an idle gap longer than the timeout splits a run', () => {
    const { store, id } = storeWithHero()
    store.updateProp(id, 'title', 'H')
    vi.advanceTimersByTime(700)
    store.updateProp(id, 'title', 'He')
    store.undo()
    expect(store.data.content[0].props.title).toBe('H')
    store.undo()
    expect(store.data.content[0].props.title).toBe('Hello')
  })

  it('a gap within the timeout does not split a run', () => {
    const { store, id } = storeWithHero()
    store.updateProp(id, 'title', 'H')
    vi.advanceTimersByTime(300)
    store.updateProp(id, 'title', 'He')
    store.undo()
    expect(store.data.content[0].props.title).toBe('Hello')
  })

  it('undo closes the run: retyping right after an undo is a fresh step', () => {
    const { store, id } = storeWithHero()
    store.updateProp(id, 'title', 'H')
    store.updateProp(id, 'title', 'He')
    store.undo()
    expect(store.data.content[0].props.title).toBe('Hello')
    expect(store.canRedo).toBe(true)
    // Same field, still within the idle window — but the undo closed the run.
    store.updateProp(id, 'title', 'X')
    expect(store.canRedo).toBe(false)
    store.undo()
    expect(store.data.content[0].props.title).toBe('Hello')
    store.redo()
    expect(store.data.content[0].props.title).toBe('X')
  })
})

describe('undo and the panel field machinery', () => {
  function mountField(store: EditorStore, field: Component, props: Record<string, unknown>) {
    const Wrapper = defineComponent({
      setup() { provideEditorStore(store) },
      render() { return h(field, props) },
    })
    return mount(Wrapper, { attachTo: document.body })
  }

  it('a text-field typing burst undoes in one step, input value included', async () => {
    const store = createEditorStore(config, {
      version: 1,
      root: { props: {} },
      content: [{ type: 'Hero', props: { id: 'h-1', title: 'Hi' } }],
    })
    const wrapper = mountField(store, TextInput, { componentId: 'h-1', name: 'title', inputId: 'in' })
    const input = wrapper.find('input')
    for (const draft of ['HiX', 'HiXY', 'HiXYZ']) {
      await input.setValue(draft)
    }
    expect(store.data.content[0].props.title).toBe('HiXYZ')
    store.undo()
    await nextTick()
    expect(store.data.content[0].props.title).toBe('Hi')
    expect((input.element as HTMLInputElement).value).toBe('Hi')
    expect(store.canUndo).toBe(false)
    wrapper.unmount()
  })

  const rangeConfig: GissenConfig = {
    components: {
      Box: {
        fields: { size: { type: 'number', min: 0, max: 50 } },
        defaultProps: { size: 10 },
        render: Stub,
      },
    },
  }

  function mountNumberField(): { store: EditorStore, wrapper: ReturnType<typeof mountField> } {
    const store = createEditorStore(rangeConfig, {
      version: 1,
      root: { props: {} },
      content: [{ type: 'Box', props: { id: 'box-1', size: 10 } }],
    })
    const wrapper = mountField(store, NumberInput, {
      componentId: 'box-1',
      name: 'size',
      inputId: 'in',
      field: { type: 'number', min: 0, max: 50 },
    })
    return { store, wrapper }
  }

  it('out-of-range typing then blur-clamp undoes to the pre-run value, draft included', async () => {
    const { store, wrapper } = mountNumberField()
    const input = wrapper.find('input')
    await input.setValue('5') // commits 5 — the run's before-state is size: 10
    await input.setValue('50') // commits 50, coalesced
    await input.setValue('500') // out of range: model keeps 50, draft shows 500
    expect(store.data.content[0].props.size).toBe(50)
    await input.trigger('blur') // clamp: draft normalizes to 50, model already 50
    expect((input.element as HTMLInputElement).value).toBe('50')

    store.undo()
    await nextTick()
    expect(store.data.content[0].props.size).toBe(10)
    expect((input.element as HTMLInputElement).value).toBe('10')
    wrapper.unmount()
  })

  it('undo with a focused number field re-seeds the visible draft', async () => {
    const { store, wrapper } = mountNumberField()
    const input = wrapper.find('input')
    input.element.focus()
    await input.setValue('25')
    expect(store.data.content[0].props.size).toBe(25)

    store.undo()
    await nextTick()
    expect(document.activeElement).toBe(input.element)
    expect(store.data.content[0].props.size).toBe(10)
    expect((input.element as HTMLInputElement).value).toBe('10')
    wrapper.unmount()
  })

  it('an in-progress invalid draft does not fight history navigation', async () => {
    const { store, wrapper } = mountNumberField()
    const input = wrapper.find('input')
    await input.setValue('25') // commits 25
    await input.setValue('abc') // invalid: model keeps 25, draft shows abc
    expect(store.data.content[0].props.size).toBe(25)

    store.undo()
    await nextTick()
    // The restored model wins over the garbage draft: re-seeded, not fought.
    expect(store.data.content[0].props.size).toBe(10)
    expect((input.element as HTMLInputElement).value).toBe('10')
    wrapper.unmount()
  })
})
