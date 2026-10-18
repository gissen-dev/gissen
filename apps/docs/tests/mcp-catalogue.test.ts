import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { describe, expect, it } from 'vitest'
import { docsRoot } from './helpers/markdown'

// Captures gissen-mcp's actual error wording against the actual config and
// data shown on the MCP guide page — the guide's catalogue is these files,
// read verbatim, not paraphrased. Each case runs against the real built CLI
// (packages/mcp/dist/cli.js) and the exact failure is written to a
// committed .txt snapshot under snippets/agents/catalogue/. A change in
// wording fails this test and shows up as a diff in the snapshot, in the
// same PR as the docs page that would otherwise go stale.

const snippetsDir = path.join(docsRoot, 'snippets', 'agents')
const fixturesDir = path.join(docsRoot, 'tests', 'fixtures', 'mcp-catalogue')
const catalogueDir = path.join(snippetsDir, 'catalogue')
const configPath = path.join(snippetsDir, 'gissen.config.ts')
const pageJsonPath = path.join(snippetsDir, 'page.json')
const mcpCli = path.join(docsRoot, 'node_modules', 'gissen-mcp', 'dist', 'cli.js')

if (!existsSync(mcpCli))
  throw new Error(`${mcpCli} is missing. Run \`pnpm --filter gissen-mcp build\` first.`)

/** A fresh copy of a fixture data file in its own temp directory, so tool-call scenarios never interfere with each other. */
function tempDataFile(sourcePath: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'gissen-docs-catalogue-'))
  const dest = path.join(dir, 'page.json')
  writeFileSync(dest, readFileSync(sourcePath))
  return dest
}

/** Replaces absolute paths this machine happens to generate with stable placeholders, so snapshots don't churn with where the repo is checked out. */
function normalize(text: string, replacements: [absolutePath: string, placeholder: string][]): string {
  return replacements.reduce((result, [absolutePath, placeholder]) => result.replaceAll(absolutePath, placeholder), text)
}

async function callAndCapture(
  dataPath: string,
  call: { name: string, arguments?: Record<string, unknown> },
): Promise<string> {
  const client = new Client({ name: 'docs-catalogue', version: '0.0.0' })
  await client.connect(new StdioClientTransport({
    command: process.execPath,
    args: [mcpCli, '--config', configPath, '--data', dataPath],
    stderr: 'ignore',
  }))
  try {
    const result = await client.callTool(call)
    const content = result.content as { type: string, text?: string }[]
    const text = content[0]?.text
    if (typeof text !== 'string')
      throw new Error(`Tool call returned no text: ${JSON.stringify(result)}`)
    return normalize(text, [[dataPath, '/path/to/page.json']])
  }
  finally {
    await client.close()
  }
}

function captureStartupFailure(args: string[]): string {
  const result = spawnSync(process.execPath, [mcpCli, ...args], { encoding: 'utf8' })
  return normalize(`exit code: ${result.status}\n${result.stderr}`, [
    [pageJsonPath, '/path/to/page.json'],
    [fixturesDir, '/path/to'],
  ])
}

interface Scenario {
  name: string
  run: () => string | Promise<string>
}

const toolScenarios: Scenario[] = [
  { name: 'add-unknown-type', run: () => callAndCapture(tempDataFile(pageJsonPath), { name: 'add_component', arguments: { type: 'Nope' } }) },
  { name: 'add-not-allowed-in-slot', run: () => callAndCapture(tempDataFile(pageJsonPath), { name: 'add_component', arguments: { type: 'Hero', parentId: 'container-1', slot: 'children' } }) },
  { name: 'add-parent-not-found', run: () => callAndCapture(tempDataFile(pageJsonPath), { name: 'add_component', arguments: { type: 'Card', parentId: 'nope', slot: 'children' } }) },
  { name: 'add-field-is-not-a-slot', run: () => callAndCapture(tempDataFile(pageJsonPath), { name: 'add_component', arguments: { type: 'Card', parentId: 'hero-1', slot: 'title' } }) },
  { name: 'add-slot-required', run: () => callAndCapture(tempDataFile(pageJsonPath), { name: 'add_component', arguments: { type: 'Card', parentId: 'container-1' } }) },
  { name: 'add-root-slot-not-applicable', run: () => callAndCapture(tempDataFile(pageJsonPath), { name: 'add_component', arguments: { type: 'Card', slot: 'children' } }) },
  { name: 'add-index-out-of-range', run: () => callAndCapture(tempDataFile(pageJsonPath), { name: 'add_component', arguments: { type: 'Card', parentId: 'container-1', slot: 'children', index: 99 } }) },
  { name: 'update-unknown-field', run: () => callAndCapture(tempDataFile(pageJsonPath), { name: 'update_component', arguments: { id: 'hero-1', props: { bogus: 1 } } }) },
  { name: 'update-reserved-field', run: () => callAndCapture(tempDataFile(pageJsonPath), { name: 'update_component', arguments: { id: 'hero-1', props: { id: 'x' } } }) },
  { name: 'update-invalid-select-value', run: () => callAndCapture(tempDataFile(pageJsonPath), { name: 'update_component', arguments: { id: 'card-1', props: { size: 'xl' } } }) },
  { name: 'update-number-out-of-range', run: () => callAndCapture(tempDataFile(pageJsonPath), { name: 'update_component', arguments: { id: 'card-1', props: { rating: 10 } } }) },
  { name: 'update-field-type-mismatch', run: () => callAndCapture(tempDataFile(pageJsonPath), { name: 'update_component', arguments: { id: 'hero-1', props: { title: 123 } } }) },
  { name: 'update-slot-field-not-editable', run: () => callAndCapture(tempDataFile(pageJsonPath), { name: 'update_component', arguments: { id: 'container-1', props: { children: [] } } }) },
  { name: 'update-node-not-found', run: () => callAndCapture(tempDataFile(pageJsonPath), { name: 'update_component', arguments: { id: 'nope', props: {} } }) },
  { name: 'delete-node-not-found', run: () => callAndCapture(tempDataFile(pageJsonPath), { name: 'delete_component', arguments: { id: 'nope' } }) },
  { name: 'move-into-self', run: () => callAndCapture(tempDataFile(pageJsonPath), { name: 'move_component', arguments: { id: 'container-1', parentId: 'container-1', slot: 'children' } }) },
  { name: 'move-into-descendant', run: () => callAndCapture(tempDataFile(pageJsonPath), { name: 'move_component', arguments: { id: 'container-1', parentId: 'container-2', slot: 'children' } }) },
  { name: 'data-duplicate-ids', run: () => callAndCapture(tempDataFile(path.join(fixturesDir, 'duplicate-ids.json')), { name: 'read_page' }) },
  { name: 'data-mismatched-config', run: () => callAndCapture(tempDataFile(path.join(fixturesDir, 'mismatched-data.json')), { name: 'read_page' }) },
  { name: 'data-invalid-json', run: () => callAndCapture(tempDataFile(path.join(fixturesDir, 'invalid-json.json')), { name: 'read_page' }) },
]

const startupScenarios: Scenario[] = [
  { name: 'start-missing-config-flag', run: () => captureStartupFailure(['--data', pageJsonPath]) },
  { name: 'start-unknown-flag', run: () => captureStartupFailure(['--config', configPath, '--data', pageJsonPath, '--wat']) },
  { name: 'start-config-file-missing', run: () => captureStartupFailure(['--config', path.join(fixturesDir, 'does-not-exist.ts'), '--data', pageJsonPath]) },
  { name: 'start-config-reference-error', run: () => captureStartupFailure(['--config', path.join(fixturesDir, 'reference-error.config.ts'), '--data', pageJsonPath]) },
  { name: 'start-config-invalid', run: () => captureStartupFailure(['--config', path.join(fixturesDir, 'invalid.config.ts'), '--data', pageJsonPath]) },
  { name: 'start-data-file-missing', run: () => captureStartupFailure(['--config', configPath, '--data', path.join(fixturesDir, 'does-not-exist.json')]) },
]

describe('mcp error catalogue', () => {
  describe.each([...toolScenarios, ...startupScenarios])('$name', ({ run, name }) => {
    it('matches the committed snapshot', async () => {
      const text = await run()
      await expect(text).toMatchFileSnapshot(path.join(catalogueDir, `${name}.txt`))
    })
  })
})

describe('mcp tools/list', () => {
  // Not an error case: this is the evidence for "tool schemas are derived
  // from your config" — add_component's `type` enum, captured from a real
  // tools/list response against the same config shown above, not asserted
  // in prose.
  it('derives add_component\'s type enum from the config above', async () => {
    const client = new Client({ name: 'docs-catalogue', version: '0.0.0' })
    await client.connect(new StdioClientTransport({
      command: process.execPath,
      args: [mcpCli, '--config', configPath, '--data', tempDataFile(pageJsonPath)],
      stderr: 'ignore',
    }))
    try {
      const { tools } = await client.listTools()
      const addComponent = tools.find(tool => tool.name === 'add_component')
      const typeSchema = addComponent?.inputSchema.properties?.type as { enum?: string[] } | undefined
      await expect(`${JSON.stringify(typeSchema?.enum, null, 2)}\n`).toMatchFileSnapshot(path.join(catalogueDir, 'add-component-type-enum.json'))
    }
    finally {
      await client.close()
    }
  })
})
