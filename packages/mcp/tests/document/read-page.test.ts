import type { GissenData } from 'gissen'
import { describe, expect, it } from 'vitest'
import { readPage } from '../../src/document/read-page'
import { testContext, testGrammar } from './helpers'

describe('readPage', () => {
  it('returns the page alongside the grammar', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [] }
    const result = readPage(data, testContext)
    expect(result.grammar).toBe(testGrammar)
  })

  it('normalizes absent declared slots to [] in the output', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [{ type: 'Container', props: { id: 'c1' } }] }
    const result = readPage(data, testContext)
    expect(result.page.content[0]?.props.children).toEqual([])
  })

  it('passes version and root.props through unchanged', () => {
    const data: GissenData = { version: 1, root: { props: { siteName: 'Acme' } }, content: [] }
    const result = readPage(data, testContext)
    expect(result.page.version).toBe(1)
    expect(result.page.root.props).toEqual({ siteName: 'Acme' })
  })

  it('does not mutate the input', () => {
    const data: GissenData = { version: 1, root: { props: {} }, content: [{ type: 'Container', props: { id: 'c1' } }] }
    const before = structuredClone(data)
    readPage(data, testContext)
    expect(data).toStrictEqual(before)
  })
})
