import type { Component } from 'vue'
import type { GissenConfig, GissenData } from '../../src/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import NumberInput from '../../src/components/editor/fields/NumberInput.vue'
import { createEditorStore, provideEditorStore } from '../../src/composables/useEditorStore'
import { createEmptyData } from '../../src/utils'
import { validateData } from '../../src/validation'

const Stub: Component = () => h('div')

// Every non-slot field carries a default so freshly inserted components are
// complete, mirroring how real configs are written.
const config: GissenConfig = {
  components: {
    Hero: {
      fields: {
        title: { type: 'text' },
        level: { type: 'number' },
      },
      defaultProps: { title: 'Hello', level: 1 },
      render: Stub,
    },
    Text: {
      fields: { body: { type: 'textarea' } },
      defaultProps: { body: 'Lorem' },
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

// The C-1 regression class: the editor must never produce a tree that its own
// mount-time validation would reject — otherwise saved documents brick their
// next load.
describe('editor operation invariant', () => {
  it('any tree produced through editor operations passes validateData against the same config', () => {
    const store = createEditorStore(config, emptyData())
    const valid = (): void => {
      expect(() => validateData(store.data, config)).not.toThrow()
    }

    // Inserts: top level and nested slots (restricted and unrestricted).
    store.insertComponent('Container', null, null, 0)
    valid()
    store.insertComponent('TextOnlyContainer', null, null, 1)
    valid()
    store.insertComponent('Hero', null, null, 2)
    valid()

    const containerId = store.data.content[0].props.id
    const restrictedId = store.data.content[1].props.id
    const heroId = store.data.content[2].props.id

    store.insertComponent('Text', containerId, 'children', 0)
    valid()
    const textId = (store.data.content[0].props.children as Array<{ props: { id: string } }>)[0].props.id
    store.insertComponent('Text', restrictedId, 'children', 0)
    valid()

    // Disallowed placements must throw AND leave the tree valid.
    expect(() => store.insertComponent('Hero', restrictedId, 'children', 0)).toThrow()
    valid()
    expect(() => store.moveComponent(heroId, restrictedId, 'children', 0)).toThrow()
    valid()

    // Moves: reorder at top level, into a slot, out of a slot.
    store.moveComponent(heroId, null, null, 0)
    valid()
    store.moveComponent(heroId, containerId, 'children', 1)
    valid()
    store.moveComponent(textId, null, null, 0)
    valid()

    // Prop edits keep the tree valid.
    store.updateProp(heroId, 'title', 'Updated')
    valid()
    store.updateProp(heroId, 'level', 2)
    valid()

    // Clearing a field stores undefined (locked decision: never 0) — absent
    // values are tolerated by validateData, including after a JSON round-trip
    // that drops the key entirely.
    store.updateProp(heroId, 'level', undefined)
    valid()
    expect(() => validateData(JSON.parse(JSON.stringify(store.data)), config)).not.toThrow()

    // Removals: a leaf and a subtree (container with the Hero inside).
    store.removeComponent(textId)
    valid()
    store.removeComponent(containerId)
    valid()
  })
})

// The three sequences that used to produce documents rejected by validateData
// (FIX_VERIFICATION.md P1 / D-1 / D-2), pinned so the invariant stays true.
describe('previously-violating sequences', () => {
  it('clearing a number field keeps the document valid, in memory and after JSON round-trip (P1)', () => {
    const store = createEditorStore(config, emptyData())
    store.insertComponent('Hero', null, null, 0)
    const heroId = store.data.content[0].props.id
    // What NumberInput does on a cleared input:
    store.updateProp(heroId, 'level', undefined)
    expect(() => validateData(store.data, config)).not.toThrow()
    expect(() => validateData(JSON.parse(JSON.stringify(store.data)), config)).not.toThrow()
  })

  it('an out-of-range draft mid-typing never reaches the model — every snapshot stays valid (D-1)', async () => {
    const rangeConfig: GissenConfig = {
      components: {
        Box: {
          fields: { size: { type: 'number', min: 0, max: 50 } },
          defaultProps: { size: 10 },
          render: Stub,
        },
      },
    }
    const store = createEditorStore(rangeConfig, {
      version: 1,
      root: { props: {} },
      content: [{ type: 'Box', props: { id: 'box-1', size: 10 } }],
    })
    const Wrapper = defineComponent({
      setup() { provideEditorStore(store) },
      render() {
        return h(NumberInput, {
          componentId: 'box-1',
          name: 'size',
          inputId: 'in',
          field: { type: 'number', min: 0, max: 50 },
        })
      },
    })
    const wrapper = mount(Wrapper, { attachTo: document.body })
    const input = wrapper.find('input')

    // Mid-typing over-max snapshot: model keeps 10, document valid.
    await input.setValue('500')
    expect(store.data.content[0].props.size).toBe(10)
    expect(() => validateData(store.data, rangeConfig)).not.toThrow()

    // Blur normalizes to the clamped value; document still valid.
    await input.trigger('blur')
    expect(store.data.content[0].props.size).toBe(50)
    expect(() => validateData(store.data, rangeConfig)).not.toThrow()
  })

  it('a hand-written document omitting slot keys validates and stays valid after a drop into that slot', () => {
    const doc: GissenData = {
      version: 1,
      root: { props: {} },
      content: [{ type: 'Container', props: { id: 'c-1' } }],
    }
    // Absent slot props are valid data…
    expect(() => validateData(doc, config)).not.toThrow()
    // …and acceptance-time normalization makes the slot immediately droppable.
    const store = createEditorStore(config, doc)
    store.insertComponent('Text', 'c-1', 'children', 0)
    expect(() => validateData(store.data, config)).not.toThrow()
  })

  it('an empty document for a config with root.fields passes validation (D-2)', () => {
    const rootConfig: GissenConfig = {
      components: {},
      root: {
        fields: { background: { type: 'text' }, columns: { type: 'number', min: 1, max: 12 } },
        defaultProps: { background: '#fff' },
      },
    }
    // With a config, root.defaultProps is applied…
    const withDefaults = createEmptyData(rootConfig)
    expect(withDefaults.root.props).toEqual({ background: '#fff' })
    expect(() => validateData(withDefaults, rootConfig)).not.toThrow()
    // …and even a bare empty document validates (absent root props tolerated).
    expect(() => validateData(createEmptyData(), rootConfig)).not.toThrow()
  })
})
