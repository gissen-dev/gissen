import { GissenValidationError } from 'gissen'

/** Thrown when the CLI is invoked without the required flags. */
export class CliUsageError extends Error {}

/** Thrown when the config file at `configPath` cannot be loaded or fails `validateConfig`. */
export class ConfigLoadError extends Error {
  readonly configPath: string

  constructor(configPath: string, cause: unknown) {
    super(`Failed to load Gissen config from "${configPath}": ${describeCause(cause)}`, { cause })
    this.name = 'ConfigLoadError'
    this.configPath = configPath
  }
}

/** Thrown when the data file at `dataPath` cannot be read. */
export class DataFileError extends Error {
  readonly dataPath: string

  constructor(dataPath: string, cause: unknown) {
    super(`Cannot read Gissen data file at "${dataPath}": ${describeCause(cause)}`, { cause })
    this.name = 'DataFileError'
    this.dataPath = dataPath
  }
}

/**
 * Reduces an arbitrary thrown value to one human-readable line. Gives
 * `GissenValidationError` special treatment since its `.message` already
 * lists every validation issue with its path — that detail is exactly what
 * an agent needs to self-correct a malformed config.
 */
function describeCause(cause: unknown): string {
  if (cause instanceof GissenValidationError)
    return cause.message
  if (cause instanceof Error)
    return cause.message
  return String(cause)
}

/** Formats any error thrown by `run()` into the single line written to stderr on exit. */
export function formatFatalError(error: unknown): string {
  if (error instanceof CliUsageError)
    return `Usage error: ${error.message}`
  if (error instanceof ConfigLoadError || error instanceof DataFileError)
    return error.message
  if (error instanceof Error)
    return `Unexpected error: ${error.message}`
  return `Unexpected error: ${String(error)}`
}
