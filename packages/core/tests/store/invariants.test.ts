import type { Component } from 'vue'
import type { GissenConfig, GissenData } from '../../src/types'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { createEditorStore } from '../../src/composables/useEditorStore'
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

    // Removals: a leaf and a subtree (container with the Hero inside).
    store.removeComponent(textId)
    valid()
    store.removeComponent(containerId)
    valid()
  })
})
