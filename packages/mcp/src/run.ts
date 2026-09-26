import process from 'node:process'
import { parseCliArgs } from './args'
import { assertDataFileReadable } from './data-file'
import { formatFatalError } from './errors'
import { buildGrammar } from './grammar/build-grammar'
import { printGrammar } from './grammar/print-grammar'
import { loadGissenConfig } from './loader/load-config'

/**
 * Runs the CLI end to end and returns the process exit code. Kept separate
 * from `cli.ts` so it's testable in-process (no subprocess, no reliance on
 * `process.exit`).
 *
 * For now this is the CLI's entire behavior: parse args, load and validate
 * the config, derive and print its grammar, exit. There is no MCP server
 * yet (that's Phase C) — no flag gates this, since inventing CLI surface now
 * would likely just be replaced once serving starts.
 */
export async function run(argv: string[]): Promise<number> {
  try {
    const { configPath, dataPath } = parseCliArgs(argv)
    await assertDataFileReadable(dataPath)
    const config = await loadGissenConfig(configPath)
    printGrammar(buildGrammar(config))
    return 0
  }
  catch (error) {
    process.stderr.write(`${formatFatalError(error)}\n`)
    return 1
  }
}
