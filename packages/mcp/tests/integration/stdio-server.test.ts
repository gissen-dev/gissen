import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { afterEach, describe, expect, it } from 'vitest'
import { createTempWorkspace } from '../helpers/temp-workspace'

// `packages/mcp` — up two levels from `tests/integration/`.
const pkgRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const cliPath = path.join(pkgRoot, 'dist', 'cli.js')
const configPath = path.join(pkgRoot, 'tests', 'fixtures', 'config', 'gissen.config.ts')
const emptyPage = JSON.stringify({ version: 1, root: { props: {} }, content: [] })

function textOf(result: Awaited<ReturnType<Client['callTool']>>): string {
  const content = result.content as { type: string, text?: string }[]
  const first = content[0]
  if (!first || first.type !== 'text' || typeof first.text !== 'string')
    throw new Error('Expected a text content part')
  return first.text
}

const cleanups: (() => Promise<unknown>)[] = []
afterEach(async () => {
  while (cleanups.length > 0)
    await cleanups.pop()?.()
})

/**
 * Connects the SDK's own `Client` to the real, built `dist/cli.js` over a
 * real OS pipe (`StdioClientTransport` spawns the child itself) — this is
 * literally Acceptance C's "spawns the server over stdio", not an
 * in-process stand-in. `command: process.execPath`, never a bare `'node'`:
 * this environment's `node` isn't on `PATH` outside an nvm-sourced shell.
 */
async function connectOverStdio(dataPath: string): Promise<Client> {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [cliPath, '--config', configPath, '--data', dataPath],
    cwd: pkgRoot,
    // Default is "inherit", which would spam the test runner's own terminal
    // with every spawned server's startup grammar dump; the dedicated raw-pipe
    // test below is what actually verifies stderr content.
    stderr: 'ignore',
  })
  const client = new McpClient({ name: 'integration-test', version: '0.0.0' })
  await client.connect(transport)
  cleanups.push(() => client.close())
  return client
}

describe('stdio server (spawned subprocess)', () => {
  it('lists the five tools over a real stdio subprocess', async () => {
    const ws = await createTempWorkspace(emptyPage)
    cleanups.push(() => ws.cleanup())
    const client = await connectOverStdio(ws.dataPath)

    const { tools } = await client.listTools()
    expect(tools.map(t => t.name).sort()).toEqual(
      ['add_component', 'delete_component', 'move_component', 'read_page', 'update_component'].sort(),
    )
  }, 30_000)

  it('runs read → add → update → move → delete → read and leaves a valid data file', async () => {
    const ws = await createTempWorkspace(emptyPage)
    cleanups.push(() => ws.cleanup())
    const client = await connectOverStdio(ws.dataPath)

    const read1 = await client.callTool({ name: 'read_page', arguments: {} })
    expect(textOf(read1)).toContain('0 components')

    const add = await client.callTool({ name: 'add_component', arguments: { type: 'Hero' } })
    const heroId = textOf(add).match(/with id "([^"]+)"/)?.[1]
    expect(heroId).toBeTruthy()

    const update = await client.callTool({
      name: 'update_component',
      arguments: { id: heroId, props: { title: 'Spawned' } },
    })
    expect(update.isError).toBeFalsy()
    expect(textOf(update)).toContain('title="Spawned"')

    const move = await client.callTool({ name: 'move_component', arguments: { id: heroId, index: 0 } })
    expect(move.isError).toBeFalsy()

    const del = await client.callTool({ name: 'delete_component', arguments: { id: heroId } })
    expect(del.isError).toBeFalsy()

    const read2 = await client.callTool({ name: 'read_page', arguments: {} })
    expect(textOf(read2)).toContain('0 components')

    const final = JSON.parse(await readFile(ws.dataPath, 'utf8'))
    expect(final.content).toEqual([])
  }, 30_000)

  it('a rejected mutation leaves the data file byte identical', async () => {
    const ws = await createTempWorkspace(emptyPage)
    cleanups.push(() => ws.cleanup())
    const client = await connectOverStdio(ws.dataPath)

    const add = await client.callTool({ name: 'add_component', arguments: { type: 'Hero' } })
    const heroId = textOf(add).match(/with id "([^"]+)"/)?.[1]

    const before = await readFile(ws.dataPath)
    const rejected = await client.callTool({
      name: 'update_component',
      arguments: { id: heroId, props: { rating: 999 } },
    })
    expect(rejected.isError).toBe(true)

    const after = await readFile(ws.dataPath)
    expect(after).toStrictEqual(before)
  }, 30_000)

  it('writes atomically, leaving no temp files behind', async () => {
    const ws = await createTempWorkspace(emptyPage)
    cleanups.push(() => ws.cleanup())
    const client = await connectOverStdio(ws.dataPath)

    await client.callTool({ name: 'add_component', arguments: { type: 'Hero' } })
    await client.callTool({ name: 'add_component', arguments: { type: 'Container' } })

    expect(await readdir(ws.dir)).toEqual(['page.json'])
  }, 30_000)

  it('picks up a data file changed underneath it between calls (decision 7: nothing is held in memory)', async () => {
    const ws = await createTempWorkspace(emptyPage)
    cleanups.push(() => ws.cleanup())
    const client = await connectOverStdio(ws.dataPath)

    const read1 = await client.callTool({ name: 'read_page', arguments: {} })
    expect(textOf(read1)).toContain('0 components')

    await ws.seed(JSON.stringify({
      version: 1,
      root: { props: {} },
      content: [{ type: 'Hero', props: { id: 'external', title: 'Changed on disk' } }],
    }))

    const read2 = await client.callTool({ name: 'read_page', arguments: {} })
    expect(textOf(read2)).toContain('1 component')
    expect(textOf(read2)).toContain('Changed on disk')
  }, 30_000)

  it('stdout carries only JSON-RPC while the grammar goes to stderr (raw pipe, not the SDK client)', async () => {
    const ws = await createTempWorkspace(emptyPage)
    cleanups.push(() => ws.cleanup())

    const child = spawn(process.execPath, [cliPath, '--config', configPath, '--data', ws.dataPath], {
      cwd: pkgRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    cleanups.push(() => {
      child.kill()
      return Promise.resolve()
    })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8')
    })

    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'raw', version: '0.0.0' } },
    }
    child.stdin.write(`${JSON.stringify(initRequest)}\n`)

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out waiting for a stdout response')), 10_000)
      const onData = (): void => {
        if (stdout.includes('\n')) {
          clearTimeout(timer)
          child.stdout.off('data', onData)
          resolve()
        }
      }
      child.stdout.on('data', onData)
    })

    child.stdin.end()
    await once(child, 'exit')

    const lines = stdout.split('\n').filter(line => line.length > 0)
    expect(lines).toHaveLength(1)
    const parsed = JSON.parse(lines[0]!)
    expect(parsed.result.serverInfo.name).toBe('gissen-mcp')

    expect(stderr).toContain('Hero')
    expect(stderr).toContain('gissen-mcp ready')
  }, 30_000)

  it('exits cleanly (code 0) when the client closes stdin', async () => {
    const ws = await createTempWorkspace(emptyPage)
    cleanups.push(() => ws.cleanup())

    const child = spawn(process.execPath, [cliPath, '--config', configPath, '--data', ws.dataPath], {
      cwd: pkgRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    const exited = once(child, 'exit')
    child.stdin.end()
    const [code] = await exited
    expect(code).toBe(0)
  }, 30_000)
})
