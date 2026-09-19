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

/** Thrown when the data file's contents are not valid JSON. */
export class DataParseError extends Error {
  readonly dataPath: string

  constructor(dataPath: string, cause: unknown) {
    super(`Gissen data file at "${dataPath}" is not valid JSON: ${describeCause(cause)}`, { cause })
    this.name = 'DataParseError'
    this.dataPath = dataPath
  }
}

/** Thrown when the data file, once parsed, fails `validateData` against the loaded config. */
export class DataValidationError extends Error {
  readonly dataPath: string

  constructor(dataPath: string, cause: unknown) {
    super(`Gissen data file at "${dataPath}" does not match this project's config: ${describeCause(cause)}`, { cause })
    this.name = 'DataValidationError'
    this.dataPath = dataPath
  }
}

/**
 * Thrown when a document operation's own output fails `validateData` — a bug
 * in `gissen-mcp` or a Gissen operation, never the caller's fault, since
 * every operation is supposed to only ever produce a tree its own config
 * accepts. The write never happens when this is thrown.
 */
export class PostMutationValidationError extends Error {
  readonly dataPath: string

  constructor(dataPath: string, cause: unknown) {
    super(`Applying this operation would have produced an invalid Gissen page (not written to "${dataPath}"): ${describeCause(cause)}`, { cause })
    this.name = 'PostMutationValidationError'
    this.dataPath = dataPath
  }
}

/** Thrown when the data file cannot be written (permissions, disk full, etc). The file on disk is left untouched — see `writeDataFileAtomically`. */
export class DataWriteError extends Error {
  readonly dataPath: string

  constructor(dataPath: string, cause: unknown) {
    super(`Could not write Gissen data file at "${dataPath}": ${describeCause(cause)}`, { cause })
    this.name = 'DataWriteError'
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
