import type { ComponentData, GissenConfig, GissenData } from 'gissen'
import type { DocumentContext, NodeStep } from '../../src/document/types'
import { buildGrammar } from '../../src/grammar/build-grammar'

function mockRender(): null {
  return null
}

/**
 * Shared fixture config for document-module tests. Covers all six field
 * types across multiple components, a slot with an `allow` list and one
 * without, and root fields — built once so every test file addresses the
 * same shape.
 */
export const testConfig: GissenConfig = {
  components: {
    Hero: {
      fields: {
        title: { type: 'text' },
        level: { type: 'number', min: 1, max: 6 },
      },
      defaultProps: { title: 'Hello', level: 1 },
      render: mockRender,
    },
    Text: {
      fields: {
        body: { type: 'textarea' },
      },
      defaultProps: { body: 'Lorem' },
      render: mockRender,
    },
    Banner: {
      fields: {
        tone: {
          type: 'select',
          options: [{ label: 'Primary', value: 'primary' }, { label: 'Secondary', value: 'secondary' }],
        },
        featured: { type: 'boolean' },
        weight: { type: 'number' },
        rank: {
          type: 'select',
          options: [{ label: 'First', value: 1 }, { label: 'Second', value: 2 }],
        },
      },
      render: mockRender,
    },
    Container: {
      fields: {
        children: { type: 'slot' },
      },
      render: mockRender,
    },
    TextOnlyContainer: {
      fields: {
        children: { type: 'slot', allow: ['Text'] },
      },
      render: mockRender,
    },
  },
  root: {
    fields: {
      siteName: { type: 'text' },
    },
  },
}

export const testGrammar = buildGrammar(testConfig)

export const testContext: DocumentContext = { config: testConfig, grammar: testGrammar }

export function emptyData(): GissenData {
  return { version: 1, root: { props: {} }, content: [] }
}

/** Walks a `NodeStep[]` path to the node it addresses, for assertions that need to read back a result by path rather than by id. */
export function nodeAt(data: GissenData, path: readonly NodeStep[]): ComponentData {
  const [first, ...rest] = path
  if (!first)
    throw new Error('Empty path')

  let node = data.content[first.index]
  if (!node)
    throw new Error(`No node at index ${first.index} in content`)

  for (const step of rest) {
    if (step.slot === null)
      throw new Error('Non-first path step is missing a slot name')
    const children = node.props[step.slot]
    if (!Array.isArray(children))
      throw new Error(`props.${step.slot} is not an array`)
    const next = children[step.index]
    if (!next)
      throw new Error(`No node at index ${step.index} in slot "${step.slot}"`)
    node = next
  }

  return node
}

/**
 * Runs `fn`, returning what it threw. Throws (failing the test) if `fn`
 * didn't throw — used throughout these tests to assert on a thrown error's
 * own fields, not just its class/message.
 */
export function captureError(fn: () => unknown): unknown {
  try {
    fn()
  }
  catch (error) {
    return error
  }
  throw new Error('Expected fn to throw, but it did not')
}

/** Every id present in the tree, depth-first — for asserting a full id set after a mutation. */
export function idsOf(data: GissenData): string[] {
  const ids: string[] = []
  const visit = (node: ComponentData): void => {
    ids.push(node.props.id)
    for (const value of Object.values(node.props)) {
      if (Array.isArray(value)) {
        for (const child of value) visit(child)
      }
    }
  }
  for (const node of data.content) visit(node)
  return ids
}
