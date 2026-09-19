import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { DocumentContext } from '../../src/document/types'
import { readFile, stat } from 'node:fs/promises'
import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { afterEach, describe, expect, it } from 'vitest'
import { createGissenServer } from '../../src/server/create-server'
import { loadFixtureDocumentContext } from '../helpers/load-fixture-context'
import { createTempWorkspace } from '../helpers/temp-workspace'

const emptyPage = JSON.stringify({ version: 1, root: { props: {} }, content: [] })

interface Connected {
  client: Client
  close: () => Promise<void>
}

async function connect(dataPath: string, document: DocumentContext): Promise<Connected> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const server = createGissenServer({ dataPath, document })
  await server.connect(serverTransport)

  const client = new McpClient({ name: 'test-client', version: '0.0.0' })
  await client.connect(clientTransport)

  return {
    client,
    close: async () => {
      await client.close()
      await server.close()
    },
  }
}

function textOf(result: Awaited<ReturnType<Client['callTool']>>): string {
  const content = result.content as { type: string, text?: string }[]
  const first = content[0]
  if (!first || first.type !== 'text' || typeof first.text !== 'string')
    throw new Error('Expected a text content part')
  return first.text
}

const cleanups: (() => Promise<void>)[] = []
afterEach(async () => {
  while (cleanups.length > 0)
    await cleanups.pop()?.()
})

async function setup(fixture: string, initialJson = emptyPage) {
  const ws = await createTempWorkspace(initialJson)
  const document = await loadFixtureDocumentContext(fixture)
  const connected = await connect(ws.dataPath, document)
  cleanups.push(async () => {
    await connected.close()
    await ws.cleanup()
  })
  return { ws, document, ...connected }
}

describe('createGissenServer', () => {
  it('lists exactly the five tools, by name', async () => {
    const { client } = await setup('gissen.config.ts')
    const { tools } = await client.listTools()
    expect(tools.map(t => t.name).sort()).toEqual(
      ['add_component', 'delete_component', 'move_component', 'read_page', 'update_component'].sort(),
    )
  })

  it('derives add_component\'s type enum from the loaded config', async () => {
    const { client } = await setup('gissen.config.ts')
    const { tools } = await client.listTools()
    const addComponentTool = tools.find(t => t.name === 'add_component')
    const typeSchema = addComponentTool?.inputSchema.properties?.type as { enum?: string[] } | undefined
    expect(typeSchema?.enum).toEqual(['Hero', 'Container', 'Freeform'])
  })

  it('derives a DIFFERENT type enum from a second config (acceptance C bullet 3)', async () => {
    const { client } = await setup('minimal.config.ts')
    const { tools } = await client.listTools()
    const addComponentTool = tools.find(t => t.name === 'add_component')
    const typeSchema = addComponentTool?.inputSchema.properties?.type as { enum?: string[] } | undefined
    expect(typeSchema?.enum).toEqual(['Note'])
  })

  it('update_component has no type enum in its schema, but carries the types in its description', async () => {
    const { client } = await setup('gissen.config.ts')
    const { tools } = await client.listTools()
    const updateComponentTool = tools.find(t => t.name === 'update_component')
    expect(updateComponentTool?.inputSchema.properties?.type).toBeUndefined()
    expect(updateComponentTool?.description).toContain('Hero — title: text')
  })

  it('enumerates each type\'s fields, select options, and slot allow-lists in tool descriptions', async () => {
    const { client } = await setup('gissen.config.ts')
    const { tools } = await client.listTools()
    const addComponentTool = tools.find(t => t.name === 'add_component')
    expect(addComponentTool?.description).toContain('Container — children: slot (accepts: Hero)')
    expect(addComponentTool?.description).toContain('theme: select ("primary" | "secondary")')
    expect(addComponentTool?.description).toContain('Freeform — items: slot (accepts: any registered type)')
  })

  it('read_page returns the tree and the grammar without writing the data file', async () => {
    const { client, ws } = await setup('gissen.config.ts')
    const before = await stat(ws.dataPath)

    const result = await client.callTool({ name: 'read_page', arguments: {} })
    expect(result.isError).toBeFalsy()
    expect(textOf(result)).toContain('Component types in this project:')

    const after = await stat(ws.dataPath)
    expect(after.mtimeMs).toBe(before.mtimeMs)
    expect((await readFile(ws.dataPath, 'utf8'))).toBe(emptyPage)
  })

  it('runs read → add → update → move → delete → read, with assertions on messages and the file', async () => {
    const { client, ws } = await setup('gissen.config.ts')

    const read1 = await client.callTool({ name: 'read_page', arguments: {} })
    expect(textOf(read1)).toContain('0 components')

    const add = await client.callTool({ name: 'add_component', arguments: { type: 'Hero' } })
    expect(add.isError).toBeFalsy()
    const addedIdMatch = textOf(add).match(/with id "([^"]+)"/)
    const heroId = addedIdMatch?.[1]
    expect(heroId).toBeTruthy()

    const update = await client.callTool({
      name: 'update_component',
      arguments: { id: heroId, props: { title: 'Updated title', rating: 3 } },
    })
    expect(update.isError).toBeFalsy()
    expect(textOf(update)).toContain('title="Updated title"')

    const addContainer = await client.callTool({ name: 'add_component', arguments: { type: 'Container' } })
    const containerIdMatch = textOf(addContainer).match(/with id "([^"]+)"/)
    const containerId = containerIdMatch?.[1]

    const move = await client.callTool({
      name: 'move_component',
      arguments: { id: heroId, parentId: containerId, slot: 'children' },
    })
    expect(move.isError).toBeFalsy()
    expect(textOf(move)).toContain(`Moved component "${heroId}"`)

    const afterMoveFile = JSON.parse(await readFile(ws.dataPath, 'utf8'))
    expect(afterMoveFile.content).toHaveLength(1)
    expect(afterMoveFile.content[0].props.children).toHaveLength(1)
    expect(afterMoveFile.content[0].props.children[0].props.title).toBe('Updated title')

    const del = await client.callTool({ name: 'delete_component', arguments: { id: containerId } })
    expect(del.isError).toBeFalsy()
    expect(textOf(del)).toContain(`"${heroId}"`)

    const read2 = await client.callTool({ name: 'read_page', arguments: {} })
    expect(textOf(read2)).toContain('0 components')

    const finalFile = JSON.parse(await readFile(ws.dataPath, 'utf8'))
    expect(finalFile.content).toEqual([])
  })

  it('a rejected mutation leaves the data file byte identical (acceptance C bullet 2)', async () => {
    const { client, ws } = await setup('gissen.config.ts')
    const add = await client.callTool({ name: 'add_component', arguments: { type: 'Hero' } })
    const heroId = textOf(add).match(/with id "([^"]+)"/)?.[1]

    const before = await readFile(ws.dataPath)

    const rejected = await client.callTool({
      name: 'update_component',
      arguments: { id: heroId, props: { rating: 999 } },
    })
    expect(rejected.isError).toBe(true)
    expect(textOf(rejected)).toContain('out of range')
    expect(textOf(rejected)).toContain('The page was not changed.')

    const after = await readFile(ws.dataPath)
    expect(after).toStrictEqual(before)
  })

  it('rejects an unknown field, listing the component\'s field names', async () => {
    const { client } = await setup('gissen.config.ts')
    const add = await client.callTool({ name: 'add_component', arguments: { type: 'Hero' } })
    const heroId = textOf(add).match(/with id "([^"]+)"/)?.[1]

    const result = await client.callTool({ name: 'update_component', arguments: { id: heroId, props: { nope: 1 } } })
    expect(result.isError).toBe(true)
    expect(textOf(result)).toContain('has no field "nope"')
    expect(textOf(result)).toContain('"title"')
  })

  it('rejects an invalid select value, listing the allowed options', async () => {
    const { client } = await setup('gissen.config.ts')
    const add = await client.callTool({ name: 'add_component', arguments: { type: 'Hero' } })
    const heroId = textOf(add).match(/with id "([^"]+)"/)?.[1]

    const result = await client.callTool({ name: 'update_component', arguments: { id: heroId, props: { theme: 'dark' } } })
    expect(result.isError).toBe(true)
    expect(textOf(result)).toContain('Allowed values')
    expect(textOf(result)).toContain('primary')
  })

  it('rejects an allow-list violation on add_component', async () => {
    // gissen.config.ts's Container.children only allows Hero.
    const { client } = await setup('gissen.config.ts')
    const addContainer = await client.callTool({ name: 'add_component', arguments: { type: 'Container' } })
    const containerId = textOf(addContainer).match(/with id "([^"]+)"/)?.[1]

    const rejected = await client.callTool({
      name: 'add_component',
      arguments: { type: 'Freeform', parentId: containerId, slot: 'children' },
    })
    expect(rejected.isError).toBe(true)
    expect(textOf(rejected)).toContain('is not allowed in slot "children"')
    expect(textOf(rejected)).toContain('accepts: "Hero"')
  })

  it('rejects moving a component into its own descendant', async () => {
    const { client } = await setup('gissen.config.ts')
    const addContainer = await client.callTool({ name: 'add_component', arguments: { type: 'Container' } })
    const containerId = textOf(addContainer).match(/with id "([^"]+)"/)?.[1]
    const addHero = await client.callTool({
      name: 'add_component',
      arguments: { type: 'Hero', parentId: containerId, slot: 'children' },
    })
    const heroId = textOf(addHero).match(/with id "([^"]+)"/)?.[1]

    const result = await client.callTool({
      name: 'move_component',
      arguments: { id: containerId, parentId: heroId, slot: 'children' },
    })
    expect(result.isError).toBe(true)
    expect(textOf(result)).toContain('is inside it')
    expect(textOf(result)).toContain('would detach that subtree from the page')
  })

  it('rejects an out-of-range index', async () => {
    const { client } = await setup('gissen.config.ts')
    const result = await client.callTool({ name: 'add_component', arguments: { type: 'Hero', index: 5 } })
    expect(result.isError).toBe(true)
    expect(textOf(result)).toContain('is out of range')
  })

  it('rejects an unknown node id', async () => {
    const { client } = await setup('gissen.config.ts')
    const result = await client.callTool({ name: 'update_component', arguments: { id: 'nope', props: {} } })
    expect(result.isError).toBe(true)
    expect(textOf(result)).toContain('No component with id "nope"')
  })

  it('duplicate ids in the data file block every tool with an instructive message', async () => {
    const dupPage = JSON.stringify({
      version: 1,
      root: { props: {} },
      content: [
        { type: 'Hero', props: { id: 'dup', title: 'a' } },
        { type: 'Hero', props: { id: 'dup', title: 'b' } },
      ],
    })
    const { client } = await setup('gissen.config.ts', dupPage)

    const readResult = await client.callTool({ name: 'read_page', arguments: {} })
    expect(readResult.isError).toBe(true)
    expect(textOf(readResult)).toContain('duplicate component ids')

    const addResult = await client.callTool({ name: 'add_component', arguments: { type: 'Hero' } })
    expect(addResult.isError).toBe(true)
    expect(textOf(addResult)).toContain('duplicate component ids')
  })
})
