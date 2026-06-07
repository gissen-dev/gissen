import type { ZodError, ZodIssue } from 'zod'

function formatPath(path: (string | number)[]): string {
  return path.reduce<string>((acc, segment, index) => {
    if (typeof segment === 'number')
      return `${acc}[${segment}]`
    return index === 0 ? segment : `${acc}.${segment}`
  }, '')
}

/** Thrown when a Gissen config or data object fails runtime validation. */
export class GissenValidationError extends Error {
  /** Structured list of validation failures from Zod. */
  readonly issues: ZodIssue[]

  constructor(zodError: ZodError) {
    super(`GissenValidationError: ${zodError.issues.map(i => `[${formatPath(i.path)}] ${i.message}`).join('; ')}`)
    this.name = 'GissenValidationError'
    this.issues = zodError.issues
  }
}
