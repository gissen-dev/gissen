import { describe, expect, it } from 'vitest'
import { addComponent } from '../../src/document/add-component'
import { deleteComponent } from '../../src/document/delete-component'
import { moveComponent } from '../../src/document/move-component'
import { readPage } from '../../src/document/read-page'
import { updateComponent } from '../../src/document/update-component'
import {
  describePlacement,
  formatAddComponentSuccess,
  formatDeleteComponentSuccess,
  formatMoveComponentSuccess,
  formatReadPageSuccess,
  formatUpdateComponentSuccess,
} from '../../src/server/success-messages'
import { emptyData, testContext, testGrammar } from '../document/helpers'

const dataPath = '/tmp/page.json'

describe('describePlacement', () => {
  it('renders a slot placement', () => {
    expect(describePlacement({ parentId: 'c1', slot: 'children', index: 1 })).toBe('"c1" slot "children" (index 1)')
  })

  it('renders a top-level placement', () => {
    expect(describePlacement({ parentId: null, slot: null, index: 2 })).toBe('the top level of the page (index 2)')
  })
})

describe('formatReadPageSuccess', () => {
  it('reports the component count, the tree, and the grammar block', () => {
    const data = addComponent(emptyData(), testContext, { type: 'Hero' }).data
    const result = readPage(data, testContext)
    const text = formatReadPageSuccess(result, dataPath)

    expect(text).toContain('Gissen page at /tmp/page.json — 1 component (1 at the top level).')
    expect(text).toContain('"title": "Hello"')
    expect(text).toContain('Component types in this project:')
    expect(text).toContain('Container — children: slot (accepts: any registered type)')
    expect(text).toContain('TextOnlyContainer — children: slot (accepts: Text)')
    expect(text).toContain('Page root props (read-only here): siteName: text')
  })

  it('pluralizes "component" correctly and counts nested components', () => {
    let data = addComponent(emptyData(), testContext, { type: 'Container' }).data
    const containerId = data.content[0]!.props.id
    data = addComponent(data, testContext, { type: 'Hero', parentId: containerId, slot: 'children' }).data
    const text = formatReadPageSuccess(readPage(data, testContext), dataPath)
    expect(text).toContain('2 components (1 at the top level).')
  })

  it('reports 0 components for an empty page without pluralization trouble', () => {
    const text = formatReadPageSuccess(readPage(emptyData(), testContext), dataPath)
    expect(text).toContain('0 components (0 at the top level).')
  })
})

describe('formatAddComponentSuccess', () => {
  it('reports the placement and applied defaults', () => {
    const result = addComponent(emptyData(), testContext, { type: 'Hero' })
    const text = formatAddComponentSuccess(result, testGrammar, dataPath)
    expect(text).toContain(`Added a "Hero" with id "${result.id}" at the top level of the page at index 0.`)
    expect(text).toContain('Defaults applied: title="Hello", level=1.')
    expect(text).toContain(`Use update_component with id "${result.id}" to change them.`)
    expect(text).toContain(`Wrote ${dataPath}.`)
  })

  it('reports no defaults when the type declares none', () => {
    const result = addComponent(emptyData(), testContext, { type: 'Container' })
    const text = formatAddComponentSuccess(result, testGrammar, dataPath)
    expect(text).toContain('The configured defaults set no fields.')
    // The slot field itself is not reported as a "default" even though it's initialized to [].
    expect(text).not.toContain('children=')
  })

  it('reports a nested placement', () => {
    const container = addComponent(emptyData(), testContext, { type: 'Container' })
    const result = addComponent(container.data, testContext, { type: 'Hero', parentId: container.id, slot: 'children' })
    const text = formatAddComponentSuccess(result, testGrammar, dataPath)
    expect(text).toContain(`inside "${container.id}" slot "children" at index 0`)
  })
})

describe('formatUpdateComponentSuccess', () => {
  it('reports each applied key and value', () => {
    const added = addComponent(emptyData(), testContext, { type: 'Hero' })
    const result = updateComponent(added.data, testContext, { id: added.id, props: { title: 'New', level: 4 } })
    const text = formatUpdateComponentSuccess(added.id, result, testGrammar, dataPath)
    expect(text).toContain(`Updated component "${added.id}" (type "Hero").`)
    expect(text).toContain('title="New"')
    expect(text).toContain('level=4')
    expect(text).toContain(`Wrote ${dataPath}.`)
  })

  it('marks a cleared non-text field as absent from the saved file', () => {
    const added = addComponent(emptyData(), testContext, { type: 'Hero' })
    const result = updateComponent(added.data, testContext, { id: added.id, props: { level: null } })
    const text = formatUpdateComponentSuccess(added.id, result, testGrammar, dataPath)
    expect(text).toContain('level cleared (absent from the saved file)')
  })

  it('renders a cleared text field as an empty string, self-explanatory without extra wording', () => {
    const added = addComponent(emptyData(), testContext, { type: 'Hero' })
    const result = updateComponent(added.data, testContext, { id: added.id, props: { title: null } })
    const text = formatUpdateComponentSuccess(added.id, result, testGrammar, dataPath)
    expect(text).toContain('title=""')
  })

  it('reports an empty props object plainly', () => {
    const added = addComponent(emptyData(), testContext, { type: 'Hero' })
    const result = updateComponent(added.data, testContext, { id: added.id, props: {} })
    const text = formatUpdateComponentSuccess(added.id, result, testGrammar, dataPath)
    expect(text).toContain('(nothing — an empty props object was given)')
  })
})

describe('formatDeleteComponentSuccess', () => {
  it('reports a leaf deletion with no children', () => {
    const added = addComponent(emptyData(), testContext, { type: 'Hero' })
    const result = deleteComponent(added.data, testContext, { id: added.id })
    const text = formatDeleteComponentSuccess(result, dataPath)
    expect(text).toContain(`Deleted component "${added.id}" (type "Hero"). It had no children.`)
  })

  it('reports every removed descendant id', () => {
    const container = addComponent(emptyData(), testContext, { type: 'Container' })
    const hero = addComponent(container.data, testContext, { type: 'Hero', parentId: container.id, slot: 'children' })
    const result = deleteComponent(hero.data, testContext, { id: container.id })
    const text = formatDeleteComponentSuccess(result, dataPath)
    expect(text).toContain(`Deleted component "${container.id}" (type "Container") and 1 component nested inside it.`)
    expect(text).toContain(`"${container.id}"`)
    expect(text).toContain(`"${hero.id}"`)
  })
})

describe('formatMoveComponentSuccess', () => {
  it('reports the from and to placements', () => {
    // [Hero, Text, Text]; moving Hero (index 0) to index 2 lands at index 1
    // (post-removal shift) — see move-component.ts's own index adjustment.
    let data = addComponent(emptyData(), testContext, { type: 'Hero' }).data
    data = addComponent(data, testContext, { type: 'Text' }).data
    data = addComponent(data, testContext, { type: 'Text' }).data
    const heroId = data.content[0]!.props.id
    const result = moveComponent(data, testContext, { id: heroId, index: 2 })
    const text = formatMoveComponentSuccess(heroId, result, dataPath)
    expect(text).toContain(`Moved component "${heroId}" from the top level of the page (index 0) to the top level of the page (index 1).`)
  })

  it('notes when the resolved placement is unchanged', () => {
    const added = addComponent(emptyData(), testContext, { type: 'Hero' })
    const result = moveComponent(added.data, testContext, { id: added.id, index: 0 })
    const text = formatMoveComponentSuccess(added.id, result, dataPath)
    expect(text).toContain('The component was already in that position')
  })
})
