import type { GissenData } from 'gissen'
import { validateData } from 'gissen'
import { describe, expect, it } from 'vitest'
import { addComponent } from '../../src/document/add-component'
import { deleteComponent } from '../../src/document/delete-component'
import { moveComponent } from '../../src/document/move-component'
import { updateComponent } from '../../src/document/update-component'
import { testConfig, testContext } from './helpers'

// The C-1 regression class (mirroring packages/core/tests/store/invariants.test.ts):
// a document operation must never produce a tree that its own config's
// validateData would reject — otherwise a saved document bricks its next load.
describe('document operation invariant', () => {
  it('any tree produced through document operations passes validateData against the same config', () => {
    let data: GissenData = { version: 1, root: { props: {} }, content: [] }
    const valid = (d: GissenData): void => {
      expect(() => validateData(d, testConfig)).not.toThrow()
    }

    // Inserts: top level and nested slots (restricted and unrestricted).
    data = addComponent(data, testContext, { type: 'Container', index: 0 }).data
    valid(data)
    data = addComponent(data, testContext, { type: 'TextOnlyContainer', index: 1 }).data
    valid(data)
    data = addComponent(data, testContext, { type: 'Hero', index: 2 }).data
    valid(data)

    const containerId = data.content[0].props.id
    const restrictedId = data.content[1].props.id
    const heroId = data.content[2].props.id

    const addedText = addComponent(data, testContext, { type: 'Text', parentId: containerId, slot: 'children', index: 0 })
    data = addedText.data
    valid(data)
    const textId = addedText.id
    data = addComponent(data, testContext, { type: 'Text', parentId: restrictedId, slot: 'children', index: 0 }).data
    valid(data)

    // Disallowed placements must throw AND leave the tree valid.
    expect(() => addComponent(data, testContext, { type: 'Hero', parentId: restrictedId, slot: 'children' })).toThrow()
    valid(data)
    expect(() => moveComponent(data, testContext, { id: heroId, parentId: restrictedId, slot: 'children' })).toThrow()
    valid(data)

    // Moves: reorder at top level, into a slot, out of a slot.
    data = moveComponent(data, testContext, { id: heroId, index: 0 }).data
    valid(data)
    data = moveComponent(data, testContext, { id: heroId, parentId: containerId, slot: 'children', index: 1 }).data
    valid(data)
    data = moveComponent(data, testContext, { id: textId, index: 0 }).data
    valid(data)

    // Prop edits keep the tree valid.
    data = updateComponent(data, testContext, { id: heroId, props: { title: 'Updated' } }).data
    valid(data)
    data = updateComponent(data, testContext, { id: heroId, props: { level: 2 } }).data
    valid(data)

    // Clearing a field stores undefined (never 0) — absent values are
    // tolerated by validateData, including after a JSON round-trip that
    // drops the key entirely.
    data = updateComponent(data, testContext, { id: heroId, props: { level: null } }).data
    valid(data)
    expect(() => validateData(JSON.parse(JSON.stringify(data)), testConfig)).not.toThrow()

    // Removals: a leaf and a subtree (container with the Hero inside).
    data = deleteComponent(data, testContext, { id: textId }).data
    valid(data)
    data = deleteComponent(data, testContext, { id: containerId }).data
    valid(data)
  })
})

describe('previously-verified sequences', () => {
  it('a cleared number field survives the JSON round-trip', () => {
    let data: GissenData = { version: 1, root: { props: {} }, content: [] }
    data = addComponent(data, testContext, { type: 'Hero' }).data
    const heroId = data.content[0].props.id
    data = updateComponent(data, testContext, { id: heroId, props: { level: null } }).data
    expect(() => validateData(data, testConfig)).not.toThrow()
    expect(() => validateData(JSON.parse(JSON.stringify(data)), testConfig)).not.toThrow()
  })

  it('a cleared text field round-trips as ""', () => {
    let data: GissenData = { version: 1, root: { props: {} }, content: [] }
    data = addComponent(data, testContext, { type: 'Hero' }).data
    const heroId = data.content[0].props.id
    data = updateComponent(data, testContext, { id: heroId, props: { title: null } }).data
    const roundTripped = JSON.parse(JSON.stringify(data)) as GissenData
    expect(roundTripped.content[0]?.props.title).toBe('')
    expect(() => validateData(roundTripped, testConfig)).not.toThrow()
  })

  it('a non-finite number can never enter the document', () => {
    let data: GissenData = { version: 1, root: { props: {} }, content: [] }
    data = addComponent(data, testContext, { type: 'Hero' }).data
    const heroId = data.content[0].props.id
    expect(() => updateComponent(data, testContext, { id: heroId, props: { level: Number.NaN } })).toThrow()
    // JSON.stringify(NaN) === 'null', which would fail validateData on reload
    // if it had been allowed through — confirm the door stays shut.
    expect(() => validateData(data, testConfig)).not.toThrow()
  })

  it('a hand-written document omitting slot keys validates and stays valid after an insert into that slot', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [{ type: 'Container', props: { id: 'c-1' } }] }
    expect(() => validateData(data, testConfig)).not.toThrow()
    const result = addComponent(data, testContext, { type: 'Hero', parentId: 'c-1', slot: 'children', index: 0 })
    expect(() => validateData(result.data, testConfig)).not.toThrow()
  })

  it('every operation returns a new document and never mutates its input', () => {
    let data: GissenData = { version: 1, root: { props: {} }, content: [] }
    data = addComponent(data, testContext, { type: 'Container' }).data
    data = addComponent(data, testContext, { type: 'Hero', parentId: data.content[0].props.id, slot: 'children' }).data

    const snapshot = structuredClone(data)
    const heroId = (data.content[0].props.children as { props: { id: string } }[])[0].props.id

    addComponent(data, testContext, { type: 'Hero' })
    updateComponent(data, testContext, { id: heroId, props: { title: 'x' } })
    moveComponent(data, testContext, { id: heroId, index: 0 })
    deleteComponent(data, testContext, { id: heroId })

    expect(data).toStrictEqual(snapshot)
  })

  it('a normalized document is stable under repeated read_page-style normalization', () => {
    let data: GissenData = { version: 1, root: { props: {} }, content: [] }
    data = addComponent(data, testContext, { type: 'Container' }).data
    const first = structuredClone(data)
    // Re-running an operation (which normalizes internally) on already-normalized data changes nothing structurally.
    const again = updateComponent(data, testContext, { id: data.content[0].props.id, props: {} }).data
    expect(again).toStrictEqual(first)
  })
})
