import process from 'node:process'
import { parseCliArgs } from './args'
import { assertDataFileReadable } from './data-file'
import { formatFatalError } from './errors'
import { buildGrammar } from './grammar/build-grammar'
import { printGrammar } from './grammar/print-grammar'
import { loadGissenConfig } from './loader/load-config'
import { serveOverStdio } from './server/stdio'

/**
 * Runs the CLI end to end and returns the process exit code. Kept separate
 * from `cli.ts` so it's testable in-process.
 *
 * Loads and validates the config, prints its grammar to stderr (an
 * operator's only confirmation the intended `--config` actually loaded —
 * stdout stays reserved for JSON-RPC), then serves the five tools over
 * stdio until the transport closes. A config-load failure is reported and
 * the process exits before any transport is ever constructed — a server
 * with no valid config has no tools to offer and must not pretend otherwise.
 */
export async function run(argv: string[]): Promise<number> {
  try {
    const { configPath, dataPath } = parseCliArgs(argv)
    await assertDataFileReadable(dataPath)
    const config = await loadGissenConfig(configPath)
    const grammar = buildGrammar(config)
    printGrammar(grammar)
    await serveOverStdio({ dataPath, document: { config, grammar } })
    return 0
  }
  catch (error) {
    process.stderr.write(`${formatFatalError(error)}\n`)
    return 1
  }
}
