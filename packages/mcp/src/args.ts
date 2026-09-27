import path from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'
import { CliUsageError } from './errors'
import { USAGE_MESSAGE } from './messages'

export interface CliArgs {
  /** Absolute path to the user's Gissen config module. */
  configPath: string
  /** Absolute path to the Gissen data (page tree) JSON file. */
  dataPath: string
}

/**
 * True when the invocation asks for the help text. Deliberately a plain token
 * scan rather than a `parseArgs` pass: help has to be answerable on its own,
 * without the two flags `parseCliArgs` insists on, and it should still win
 * when paired with a flag that would otherwise fail parsing.
 */
export function isHelpRequested(argv: string[]): boolean {
  return argv.includes('--help') || argv.includes('-h')
}

/** Parses and validates the CLI's two required flags, resolving both to absolute paths. */
export function parseCliArgs(argv: string[]): CliArgs {
  const values = parseFlags(argv)

  if (!values.config)
    throw new CliUsageError(`--config is required.\n${USAGE_MESSAGE}`)
  if (!values.data)
    throw new CliUsageError(`--data is required.\n${USAGE_MESSAGE}`)

  return {
    configPath: path.resolve(process.cwd(), values.config),
    dataPath: path.resolve(process.cwd(), values.data),
  }
}

/** Wraps `node:util`'s `parseArgs` so an unrecognized flag also surfaces as an instructive `CliUsageError`. */
function parseFlags(argv: string[]): { config?: string, data?: string } {
  try {
    return parseArgs({
      args: argv,
      options: {
        config: { type: 'string' },
        data: { type: 'string' },
      },
      strict: true,
    }).values
  }
  catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause)
    throw new CliUsageError(`${reason}\n${USAGE_MESSAGE}`)
  }
}
