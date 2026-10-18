import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import ts from 'typescript'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { docsRoot, parseSections, readPage, tableRows } from './helpers/markdown'

// The API reference is written by hand. This file is what keeps it honest:
// everything the published entry points expose must be documented, and
// everything documented must exist. The "published" side is read from the
// built output (`dist`), which is what `npm publish` ships, not from `src`.

const gissenDist = realpathSync(path.join(docsRoot, 'node_modules', 'gissen', 'dist'))
const mcpCli = path.join(realpathSync(path.join(docsRoot, 'node_modules', 'gissen-mcp')), 'dist', 'cli.js')

function requireBuilt(file: string, buildCommand: string): void {
  if (!existsSync(file))
    throw new Error(`${file} is missing. Run \`${buildCommand}\` first.`)
}

function sorted(values: Iterable<string>): string[] {
  return [...values].sort()
}

/** Fails with the offending items printed one per line. */
function expectNone(offenders: string[], message: string): void {
  expect(offenders.join('\n'), message).toBe('')
}

/** Names exported by a declaration file, resolved by the TypeScript checker. */
function exportsOf(declarationFile: string): string[] {
  requireBuilt(declarationFile, 'pnpm --filter gissen build')
  const program = ts.createProgram([declarationFile], {
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  })
  const checker = program.getTypeChecker()
  const source = program.getSourceFile(declarationFile)
  const moduleSymbol = source && checker.getSymbolAtLocation(source)
  if (!moduleSymbol)
    throw new Error(`${declarationFile} is not a module.`)
  return checker.getExportsOfModule(moduleSymbol).map(symbol => symbol.name)
}

describe('gissen and gissen/render', () => {
  const entryPoints: Record<string, string[]> = {
    'gissen': exportsOf(path.join(gissenDist, 'index.d.ts')),
    'gissen/render': exportsOf(path.join(gissenDist, 'render.d.ts')),
  }

  const actual = new Map<string, Set<string>>()
  for (const [entry, names] of Object.entries(entryPoints)) {
    for (const name of names)
      actual.set(name, (actual.get(name) ?? new Set<string>()).add(entry))
  }

  const sections = parseSections(readPage('api/gissen.md')).filter(section => section.level === 3)
  const documented = new Map<string, Set<string>>()
  const duplicates: string[] = []
  const withoutEntryPoints: string[] = []
  for (const section of sections) {
    const line = /^Entry points:(.*)$/m.exec(section.body)
    if (!line) {
      withoutEntryPoints.push(section.heading)
      continue
    }
    if (documented.has(section.heading))
      duplicates.push(section.heading)
    documented.set(section.heading, new Set([...line[1].matchAll(/`([^`]+)`/g)].map(match => match[1])))
  }

  it('reads exports from both entry points', () => {
    expect(actual.size).toBeGreaterThan(20)
    expect(entryPoints['gissen/render']).toContain('GissenRender')
  })

  it('documents every export', () => {
    const missing = sorted(actual.keys()).filter(name => !documented.has(name))
    expectNone(missing, 'Exports with no "### `Name`" section in api/gissen.md')
  })

  it('documents nothing that does not exist', () => {
    const unknown = sorted(documented.keys()).filter(name => !actual.has(name))
    expectNone(unknown, 'Documented symbols that no entry point exports')
  })

  it('lists the right entry points for every symbol', () => {
    const wrong = sorted(actual.keys())
      .filter(name => documented.has(name))
      .filter(name => sorted(actual.get(name) ?? []).join() !== sorted(documented.get(name) ?? []).join())
      .map(name => `${name}: exported from ${sorted(actual.get(name) ?? []).join(', ')}, documented for ${sorted(documented.get(name) ?? []).join(', ')}`)
    expectNone(wrong, 'Entry points that do not match the build')
  })

  it('has no duplicate or incomplete sections', () => {
    expectNone(duplicates, 'Duplicate sections')
    expectNone(withoutEntryPoints, 'Level-3 sections without an "Entry points:" line')
  })

  // Variables the stylesheet declares but the docs deliberately do not offer for
  // overriding. A documented variable is a promise not to rename or remove it,
  // so these stay out until they are split from the theme variables.
  const internalVariables = new Set([
    // Layout detail of the editor chrome; expected to change with a responsive layout.
    '--gissen-chrome-height',
  ])

  it('documents every public CSS custom property in the stylesheet', () => {
    const stylesheet = path.join(gissenDist, 'gissen.css')
    requireBuilt(stylesheet, 'pnpm --filter gissen build')
    const allDeclared = new Set([...readFileSync(stylesheet, 'utf8').matchAll(/(--gissen-[\w-]+)\s*:/g)].map(match => match[1]))
    const declared = new Set([...allDeclared].filter(name => !internalVariables.has(name)))

    expectNone(sorted(internalVariables).filter(name => !allDeclared.has(name)), 'Internal variables the stylesheet no longer declares (remove them from the list)')

    const section = parseSections(readPage('api/gissen.md')).find(candidate => candidate.heading === 'CSS custom properties')
    expect(section, 'api/gissen.md needs a "CSS custom properties" section').toBeDefined()
    const documentedVariables = new Set(tableRows(section?.body ?? '').map(row => row[0]))

    expectNone(sorted(documentedVariables).filter(name => internalVariables.has(name)), 'Variables that are both documented and listed as internal')
    expectNone(sorted(declared).filter(name => !documentedVariables.has(name)), 'Undocumented variables')
    expectNone(sorted(documentedVariables).filter(name => !declared.has(name)), 'Documented variables that do not exist')
  })
})

describe('gissen-mcp', () => {
  const sections = parseSections(readPage('api/gissen-mcp.md'))

  function subsectionsOf(heading: string): typeof sections {
    const start = sections.findIndex(section => section.level === 2 && section.heading === heading)
    if (start === -1)
      throw new Error(`api/gissen-mcp.md needs a "## ${heading}" section`)
    const rest = sections.slice(start + 1)
    const end = rest.findIndex(section => section.level <= 2)
    return (end === -1 ? rest : rest.slice(0, end)).filter(section => section.level === 3)
  }

  it('documents the CLI flags that --help prints, and only those', () => {
    requireBuilt(mcpCli, 'pnpm --filter gissen-mcp build')
    const help = spawnSync(process.execPath, [mcpCli, '--help'], { encoding: 'utf8' })
    expect(help.status).toBe(0)

    const actualFlags = new Map<string, string | undefined>()
    for (const match of help.stdout.matchAll(/^ {2}(?:(-\w), )?(--[\w-]+)/gm))
      actualFlags.set(match[2], match[1])

    const documentedFlags = new Map<string, string | undefined>()
    for (const section of subsectionsOf('CLI flags'))
      documentedFlags.set(section.heading, /^Alias: `(-\w)`/m.exec(section.body)?.[1])

    expect(sorted(documentedFlags.keys())).toEqual(sorted(actualFlags.keys()))
    expect(Object.fromEntries(documentedFlags), 'Flag aliases').toEqual(Object.fromEntries(actualFlags))
  })

  describe('tools', () => {
    let workDir = ''
    let client: Client
    let tools: Awaited<ReturnType<Client['listTools']>>['tools'] = []

    beforeAll(async () => {
      requireBuilt(mcpCli, 'pnpm --filter gissen-mcp build')
      // The fixture config sits inside the docs package so that `gissen`
      // resolves from here. The page file is copied out because the server
      // is allowed to write to it.
      workDir = mkdtempSync(path.join(tmpdir(), 'gissen-docs-mcp-'))
      cpSync(path.join(docsRoot, 'tests', 'fixtures', 'mcp', 'page.json'), path.join(workDir, 'page.json'))

      client = new Client({ name: 'docs-coverage', version: '0.0.0' })
      await client.connect(new StdioClientTransport({
        command: process.execPath,
        args: [
          mcpCli,
          '--config',
          path.join(docsRoot, 'tests', 'fixtures', 'mcp', 'gissen.config.ts'),
          '--data',
          path.join(workDir, 'page.json'),
        ],
        stderr: 'ignore',
      }))
      tools = (await client.listTools()).tools
    })

    afterAll(async () => {
      await client?.close()
      if (workDir)
        rmSync(workDir, { recursive: true, force: true })
    })

    it('documents every tool the server registers, and only those', () => {
      const documentedTools = subsectionsOf('Tools').map(section => section.heading)
      expect(sorted(documentedTools)).toEqual(sorted(tools.map(tool => tool.name)))
    })

    it('documents the arguments and required flags of every tool', () => {
      const bySection = new Map(subsectionsOf('Tools').map(section => [section.heading, section]))
      const mismatches: string[] = []

      for (const tool of tools) {
        const section = bySection.get(tool.name)
        if (!section)
          continue
        const properties = Object.keys(tool.inputSchema.properties ?? {})
        const required = new Set(tool.inputSchema.required ?? [])
        const rows = tableRows(section.body)
        const documentedArguments = rows.map(row => row[0])

        if (sorted(documentedArguments).join() !== sorted(properties).join()) {
          mismatches.push(`${tool.name}: server accepts [${sorted(properties).join(', ')}], docs list [${sorted(documentedArguments).join(', ')}]`)
          continue
        }
        for (const row of rows) {
          const documentedRequired = row[2] === 'yes'
          if (documentedRequired !== required.has(row[0]))
            mismatches.push(`${tool.name}.${row[0]}: server says required=${required.has(row[0])}, docs say "${row[2]}"`)
        }
      }
      expectNone(mismatches, 'Tool arguments that do not match the server')
    })
  })
})
